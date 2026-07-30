#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Indexe les portraits installés dans public/assets.

Les portraits de personnages/styles proviennent exclusivement du chemin :
public/assets/<personnage>/<style>/portrait.*
(avec le cas historique public/assets/midoriya_ofa/portrait.*).
Aucune image de profil n'est téléchargée et aucune ancienne image n'est utilisée.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

IMAGE_EXTS = {".png", ".webp", ".jpg", ".jpeg", ".avif"}
SKIP_PARTS = {"costume_photos", "mhur_database", "brand", "community", "home", "mods", "ui"}
ALIASES = {
    "assault": "midoriya_assault",
    "fullbullet": "midoriya_attack",
    "ofa": "midoriya_ofa",
    "gentle_criminal": "gentle_criminal_technical",
}


def clean_url(path: Path, public_root: Path, version: str) -> str:
    rel = path.relative_to(public_root).as_posix()
    return f"{rel}?v={version}"


def portrait_file(folder: Path) -> Path | None:
    for ext in IMAGE_EXTS:
        candidate = folder / f"portrait{ext}"
        if candidate.is_file():
            return candidate
    # Cas Hawks Rapid : le portrait porte le nom du style.
    for ext in IMAGE_EXTS:
        candidate = folder / f"{folder.name}{ext}"
        if candidate.is_file():
            return candidate
    return None


def scan_assets(public_root: Path) -> dict[str, Any]:
    assets = public_root / "assets"
    folders: list[Path] = []
    for path in assets.rglob("*"):
        if not path.is_dir() or any(part in SKIP_PARTS for part in path.relative_to(assets).parts):
            continue
        if portrait_file(path):
            folders.append(path)

    latest = max((p.stat().st_mtime_ns for folder in folders for p in folder.iterdir() if p.is_file()), default=0)
    version = str(latest or 32000)
    styles: dict[str, dict[str, str]] = {}
    for folder in sorted(folders):
        portrait = portrait_file(folder)
        if not portrait:
            continue
        row: dict[str, str] = {"portrait": clean_url(portrait, public_root, version)}
        for file in sorted(folder.iterdir()):
            if not file.is_file() or file.suffix.lower() not in IMAGE_EXTS or file == portrait:
                continue
            row[file.stem.lower()] = clean_url(file, public_root, version)
        styles[folder.name] = row

    for alias, target in ALIASES.items():
        if target in styles:
            styles[alias] = dict(styles[target])

    return {
        "meta": {
            "source": "public/assets fourni par le propriétaire",
            "version": version,
            "portraits_only_from_local_assets": True,
            "styles": len(styles),
        },
        "styles": styles,
        "aliases": ALIASES,
    }


def patch_index(index_path: Path, version: str) -> None:
    if not index_path.exists():
        return
    text = index_path.read_text(encoding="utf-8", errors="ignore")
    text = re.sub(r'\s*<script src="data/local_assets_index\.js[^>]*></script>\s*', "\n", text)
    tag = f'<script src="data/local_assets_index.js?v={version}"></script>'
    marker = re.search(r'<script src="data/mhur_database_assets\.js[^>]*></script>', text)
    if marker:
        text = text[:marker.start()] + tag + "\n" + text[marker.start():]
    else:
        marker = re.search(r'<script src="[^\"]*season18-(?:early|v12|fixes)\.js[^>]*></script>', text)
        if marker:
            text = text[:marker.start()] + tag + "\n" + text[marker.start():]
        elif "</body>" in text:
            text = text.replace("</body>", tag + "\n</body>", 1)

    for filename in ("season18-early.js", "season18-v12.js", "season18-fixes.js"):
        text = re.sub(
            rf'(<script src="[^\"]*{re.escape(filename)})(?:\?[^\"]*)?("[^>]*></script>)',
            rf'\1?v={version}\2',
            text,
        )
    text = re.sub(
        r'(<link[^>]+href="[^\"]*season18-fixes\.css)(?:\?[^\"]*)?("[^>]*>)',
        rf'\1?v={version}\2',
        text,
    )
    index_path.write_text(text, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--site-root", default=".")
    args = parser.parse_args()
    site_root = Path(args.site_root).resolve()
    public_root = site_root / "public" if (site_root / "public").is_dir() else site_root
    data_dir = public_root / "data"
    data_dir.mkdir(parents=True, exist_ok=True)

    manifest = scan_assets(public_root)
    version = str(manifest["meta"]["version"])
    (data_dir / "local_assets_index.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (data_dir / "local_assets_index.js").write_text(
        "window.MHUR_LOCAL_ASSETS = "
        + json.dumps(manifest, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    patch_index(public_root / "index.html", version)
    print(f"[OK PORTRAITS LOCAUX] {len(manifest['styles'])} styles indexes dans public/assets.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
