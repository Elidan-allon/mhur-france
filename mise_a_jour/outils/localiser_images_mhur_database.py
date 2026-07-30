#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Télécharge les images utilisées par MHUR France depuis MHUR Database.

Toutes les images officielles sont enregistrées dans public/assets/mhur_database.
Le site utilise ensuite ces fichiers locaux au lieu de charger ultrarumble.com
chez chaque visiteur. Le programme couvre :
- portraits de personnages et de styles ;
- icônes d'Alters, d'Action spéciale et T.U.N.I.N.G ;
- images de tous les costumes installés et à venir.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import requests

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.7",
}
IMAGE_EXTS = {".png", ".webp", ".jpg", ".jpeg", ".avif"}


def configure_stdio() -> None:
    for name in ("stdout", "stderr"):
        stream = getattr(sys, name, None)
        try:
            stream.reconfigure(encoding="utf-8", errors="backslashreplace")
        except (AttributeError, OSError):
            pass


def norm(value: Any) -> str:
    import unicodedata
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")


def valid_image(path: Path) -> bool:
    try:
        if not path.exists() or path.stat().st_size < 700:
            return False
        head = path.read_bytes()[:16]
        return (
            head.startswith(b"\x89PNG")
            or head[:3] == b"\xff\xd8\xff"
            or head.startswith(b"RIFF")
            or head.startswith(b"\x00\x00\x00")  # AVIF/HEIF family
        )
    except OSError:
        return False


def extension_for(url: str, fallback: str = ".webp") -> str:
    ext = Path(urlparse(str(url or "")).path).suffix.lower()
    return ext if ext in IMAGE_EXTS else fallback


def download_one(url: str, destination: Path, force: bool = False, referer: str = "") -> tuple[bool, str]:
    if not force and valid_image(destination):
        return True, "cache"
    destination.parent.mkdir(parents=True, exist_ok=True)
    headers = dict(HEADERS)
    if referer:
        headers["Referer"] = referer
    errors: list[str] = []
    candidates = [url]
    parsed = urlparse(url)
    if parsed.path:
        # Les miroirs utilisent les mêmes chemins d'assets. Le domaine anglais
        # est utilisé en secours lorsqu'un miroir localisé ne répond pas.
        path = parsed.path.replace("/character/assets/", "/assets/")
        for host in ("https://ultrarumble.com", "https://fr.ultrarumble.com"):
            candidate = host + path
            if candidate not in candidates:
                candidates.append(candidate)
    for candidate in candidates:
        for attempt in range(1, 4):
            try:
                response = requests.get(candidate, headers=headers, timeout=45)
                if response.status_code in {429, 500, 502, 503, 504}:
                    raise requests.HTTPError(f"HTTP {response.status_code}")
                response.raise_for_status()
                content = response.content
                tmp = destination.with_suffix(destination.suffix + ".tmp")
                tmp.write_bytes(content)
                if not valid_image(tmp):
                    tmp.unlink(missing_ok=True)
                    raise ValueError("fichier image invalide")
                tmp.replace(destination)
                return True, candidate
            except Exception as exc:  # la mise à jour globale continue
                errors.append(f"{candidate}: {exc}")
                time.sleep(min(3.0, 0.5 * attempt))
    return False, " | ".join(errors[-3:])


def load_json(path: Path, default: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def read_costumes(index_path: Path) -> tuple[str, dict[str, Any]]:
    text = index_path.read_text(encoding="utf-8", errors="ignore")
    match = re.search(
        r'<script id="v249-local-costumes-data" type="application/json">\s*([\s\S]*?)\s*</script>',
        text,
    )
    if not match:
        return text, {"costumes": {}}
    try:
        return text, json.loads(match.group(1))
    except Exception:
        return text, {"costumes": {}}


def write_costumes(index_path: Path, text: str, data: dict[str, Any]) -> None:
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    block = f'<script id="v249-local-costumes-data" type="application/json">\n{payload}\n</script>'
    pattern = r'<script id="v249-local-costumes-data" type="application/json">[\s\S]*?</script>'
    if re.search(pattern, text):
        text = re.sub(pattern, lambda _m: block, text, count=1)
    index_path.write_text(text, encoding="utf-8")


def existing_style_source(root: Path, style_key: str, key: str) -> Path | None:
    aliases = {
        "assault": root / "assets/midoriya/midoriya_assault",
        "fullbullet": root / "assets/midoriya/midoriya_attack",
        "ofa": root / "assets/midoriya_ofa",
    }
    folders: list[Path] = []
    if style_key in aliases:
        folders.append(aliases[style_key])
    folders.extend(root.glob(f"assets/*/{style_key}"))
    folders.extend(p for p in root.glob(f"assets/**/{style_key}") if p.is_dir() and "costume_photos" not in p.parts)
    for folder in folders:
        for ext in IMAGE_EXTS:
            candidate = folder / f"{key}{ext}"
            if valid_image(candidate):
                return candidate
        if key == "portrait":
            for name in (
                "character.webp", "character.png", "profile.webp", "profile.png",
                f"{style_key}.png", f"{style_key}.webp",
            ):
                candidate = folder / name
                if valid_image(candidate):
                    return candidate
    return None


def seed_existing_assets(root: Path, manifest: dict[str, Any], exact: dict[str, Any], costume_data: dict[str, Any]) -> None:
    """Première installation : déplace le cache officiel déjà présent.

    Ces fichiers viennent des précédentes synchronisations MHUR Database. Ils
    servent seulement lorsqu'aucune connexion n'est disponible pendant cette
    installation ; les prochaines mises à jour écrasent/complètent ce cache à
    partir des URL officielles.
    """
    for style_key, row in exact.items():
        assets = row.get("assets") or {}
        out = manifest["styles"].setdefault(str(style_key), {})
        for key in assets:
            src = existing_style_source(root, str(style_key), str(key))
            if not src:
                continue
            # Les assets fournis par le propriétaire restent la source directe.
            # Aucun portrait de personnage n'est recopié ou remplacé.
            out[str(key)] = src.relative_to(root).as_posix()

    for _cid, rows in (costume_data.get("costumes") or {}).items():
        for costume in rows:
            rid = str(costume.get("urId") or "")
            src_rel = str(costume.get("img") or "")
            if not rid or not src_rel:
                continue
            src = root / src_rel
            if not valid_image(src):
                continue
            dst = root / "assets/mhur_database/costumes" / f"{rid}{src.suffix.lower()}"
            if not valid_image(dst):
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, dst)
            manifest["costumes"][rid] = dst.relative_to(root).as_posix()


def patch_payload_assets(payload: dict[str, Any], manifest: dict[str, Any]) -> None:
    exact = payload.get("exact_by_style") or {}
    for style_key, row in exact.items():
        local = manifest.get("styles", {}).get(str(style_key), {})
        if local:
            row["assets"] = {**(row.get("assets") or {}), **local}
    # La liste `characters` contient les mêmes lignes, mais sans style_key.
    by_source = {
        str(row.get("source_url") or ""): manifest.get("styles", {}).get(str(style_key), {})
        for style_key, row in exact.items()
    }
    for row in payload.get("characters") or []:
        local = by_source.get(str(row.get("source_url") or ""), {})
        if local:
            row["assets"] = {**(row.get("assets") or {}), **local}


def ensure_manifest_script(index_path: Path) -> None:
    text = index_path.read_text(encoding="utf-8", errors="ignore")
    text = re.sub(r'\s*<script src="data/mhur_database_assets\.js[^>]*></script>\s*', "\n", text)
    tag = '<script src="data/mhur_database_assets.js?v=29000"></script>'
    marker = re.search(r'<script src="data/season18_sync\.js[^>]*></script>', text)
    if marker:
        text = text[:marker.start()] + tag + "\n" + text[marker.start():]
    elif "</body>" in text:
        text = text.replace("</body>", tag + "\n</body>", 1)
    else:
        text += "\n" + tag
    index_path.write_text(text, encoding="utf-8")


def main() -> int:
    configure_stdio()
    parser = argparse.ArgumentParser()
    parser.add_argument("--site-root", default=".")
    parser.add_argument("--force", action="store_true", help="retélécharge aussi les fichiers déjà présents")
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args()
    root = Path(args.site_root).resolve()
    data_dir = root / "data"
    ultra_dir = data_dir / "ultrarumble"
    payload_path = ultra_dir / "site_data_latest.json"
    exact_path = ultra_dir / "characters_exact.json"
    remote_costume_path = ultra_dir / "remote_costumes.json"
    index_path = root / "index.html"

    payload = load_json(payload_path, {})
    exact = payload.get("exact_by_style") or {}
    remote_costumes = load_json(remote_costume_path, [])
    index_text, costume_data = read_costumes(index_path)
    previous = load_json(data_dir / "mhur_database_assets.json", {"styles": {}, "costumes": {}})
    manifest: dict[str, Any] = {
        "meta": {
            "source": "https://ultrarumble.com",
            "description": "Assets locaux. Les portraits de personnages sont verrouillés sur le dossier assets fourni.",
        },
        "styles": {
            str(style_key): {str(k): str(v) for k, v in (row or {}).items() if str(k) != "portrait"}
            for style_key, row in (previous.get("styles") or {}).items()
        },
        "costumes": dict(previous.get("costumes") or {}),
    }

    seed_existing_assets(root, manifest, exact, costume_data)

    jobs: list[tuple[str, Path, str, str, str]] = []
    # tuple(kind, destination, url, referer, manifest key encoded)
    for style_key, row in exact.items():
        for asset_key, url in (row.get("assets") or {}).items():
            if str(asset_key) == "portrait":
                continue
            if not isinstance(url, str) or not url.startswith("http"):
                continue
            cached_rel = str((manifest.get("styles", {}).get(str(style_key), {}) or {}).get(str(asset_key)) or "")
            if cached_rel and valid_image(root / cached_rel) and not args.force:
                continue
            ext = extension_for(url)
            dst = root / "assets/mhur_database/characters" / str(style_key) / f"{asset_key}{ext}"
            jobs.append(("style", dst, url, str(row.get("source_url") or ""), f"{style_key}\0{asset_key}"))

    remote_by_id = {str(row.get("ur_id") or ""): row for row in remote_costumes if row.get("ur_id")}
    for rid, row in remote_by_id.items():
        url = str(row.get("image_url") or row.get("image_url_hint") or "")
        if not url.startswith("http"):
            continue
        cached_rel = str(manifest.get("costumes", {}).get(rid) or "")
        if cached_rel and valid_image(root / cached_rel) and not args.force:
            continue
        ext = extension_for(url, ".png")
        dst = root / "assets/mhur_database/costumes" / f"{rid}{ext}"
        jobs.append(("costume", dst, url, str(row.get("url") or ""), rid))

    print(f"[MHUR DATABASE ASSETS] {len(jobs)} image(s) vérifiée(s), cache local en cours...", flush=True)
    completed = 0
    failed = 0
    with ThreadPoolExecutor(max_workers=max(1, min(16, args.workers))) as executor:
        futures = {
            executor.submit(download_one, url, dst, args.force, referer): (kind, dst, url, key)
            for kind, dst, url, referer, key in jobs
        }
        for future in as_completed(futures):
            kind, dst, _url, key = futures[future]
            ok, detail = future.result()
            if ok:
                rel = dst.relative_to(root).as_posix()
                if kind == "style":
                    style_key, asset_key = key.split("\0", 1)
                    manifest["styles"].setdefault(style_key, {})[asset_key] = rel
                else:
                    manifest["costumes"][key] = rel
            else:
                failed += 1
                print(f"[IMAGE WARNING] {key}: {detail}", flush=True)
            completed += 1
            if completed % 100 == 0 or completed == len(jobs):
                print(f"[MHUR DATABASE ASSETS] {completed}/{len(jobs)}", flush=True)

    # Force les costumes du site à utiliser le cache MHUR Database dédié.
    for _cid, rows in (costume_data.get("costumes") or {}).items():
        for costume in rows:
            rid = str(costume.get("urId") or "")
            local = manifest["costumes"].get(rid)
            if local and valid_image(root / local):
                costume["img"] = local
    write_costumes(index_path, index_text, costume_data)

    patch_payload_assets(payload, manifest)
    payload_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    # characters_exact est reconstruit à partir de la liste localisée.
    exact_path.write_text(json.dumps(payload.get("characters") or [], ensure_ascii=False, indent=2), encoding="utf-8")

    manifest["meta"].update({
        "styles": len(manifest["styles"]),
        "costumes": len(manifest["costumes"]),
        "failed_this_run": failed,
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    })
    (data_dir / "mhur_database_assets.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    (data_dir / "mhur_database_assets.js").write_text(
        "window.MHUR_DATABASE_ASSETS = " + json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    ensure_manifest_script(index_path)
    print(
        f"[OK MHUR DATABASE] styles={len(manifest['styles'])} costumes={len(manifest['costumes'])} échecs={failed}",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
