#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Surveille UltraRumble et lance les outils locaux uniquement si la source change.

Le script est conçu pour être exécuté automatiquement par le Planificateur de
tâches Windows toutes les 30 minutes. Il utilise des requêtes conditionnelles
(ETag / Last-Modified quand le serveur les fournit), conserve des empreintes
stables des pages et restaure la sauvegarde locale si une mise à jour échoue.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urldefrag

import requests
from bs4 import BeautifulSoup

BASE = "https://ultrarumble.com"
FR_BASE = "https://fr.ultrarumble.com"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 Chrome/126 Safari/537.36 MHUR-France-Sync/1.0"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.7",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}
CORE_URLS = [
    f"{BASE}/",
    f"{BASE}/characters",
    f"{BASE}/costumes",
    f"{BASE}/tuning",
    f"{FR_BASE}/costumes",
]
TOOLS_DIR = Path(__file__).resolve().parent

BACKUP_FILES = [
    "index.html",
    "data/local_style_map.json",
    "data/home_data.json",
    "data/home_data.js",
    "data/costume_catalog_canonical_v273.json",
    "data/costume_source_bindings_v278.json",
    "data/ultrarumble/characters_exact.json",
    "data/ultrarumble/site_data_latest.json",
    "data/ultrarumble/remote_costumes.json",
    "data/ultrarumble/costume_baseline_ids.json",
]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def local_stamp() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def load_json(path: Path, default: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def write_json_atomic(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    temp.replace(path)


def log(message: str, log_path: Path) -> None:
    line = f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}"
    print(line, flush=True)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("a", encoding="utf-8") as handle:
        handle.write(line + "\n")


def monitored_urls(root: Path) -> list[str]:
    urls = list(CORE_URLS)

    characters = load_json(root / "data/ultrarumble/characters_exact.json", [])
    if isinstance(characters, list):
        for item in characters:
            if not isinstance(item, dict):
                continue
            source = str(item.get("source_url") or "").strip()
            if source:
                urls.append(urldefrag(source)[0])

    home = load_json(root / "data/home_data.json", {})
    patches = home.get("patch_notes") if isinstance(home, dict) else None
    if isinstance(patches, list) and patches:
        patch_url = str((patches[0] or {}).get("url") or "").strip()
        if patch_url:
            urls.append(urldefrag(patch_url)[0])

    # Tri stable et suppression des doublons.
    return sorted(set(url for url in urls if url.startswith("https://")))


def stable_html_fingerprint(html: str) -> str:
    """Crée une empreinte sensible aux données, mais pas aux scripts dynamiques."""
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript", "template"]):
        tag.decompose()

    chunks: list[str] = []
    title = soup.title.get_text(" ", strip=True) if soup.title else ""
    if title:
        chunks.append(title)

    body_text = soup.get_text(" ", strip=True)
    body_text = re.sub(r"\s+", " ", body_text)
    chunks.append(body_text)

    # Les liens et images permettent aussi de détecter une nouvelle fiche,
    # un nouveau costume, une nouvelle bannière ou une nouvelle patch note.
    for tag in soup.find_all(["a", "img"]):
        value = tag.get("href") if tag.name == "a" else (
            tag.get("src") or tag.get("data-src") or tag.get("data-lazy-src")
        )
        if value:
            chunks.append(str(value).strip())

    normalized = "\n".join(chunks)
    return hashlib.sha256(normalized.encode("utf-8", "ignore")).hexdigest()


def fetch_snapshot(
    session: requests.Session,
    url: str,
    previous: dict[str, Any] | None,
    log_path: Path,
) -> dict[str, Any]:
    headers = dict(HEADERS)
    if previous:
        if previous.get("etag"):
            headers["If-None-Match"] = str(previous["etag"])
        if previous.get("last_modified"):
            headers["If-Modified-Since"] = str(previous["last_modified"])

    last_error: Exception | None = None
    for attempt in range(1, 5):
        try:
            response = session.get(url, headers=headers, timeout=45)
            if response.status_code == 304 and previous:
                return {**previous, "checked_at": utc_now(), "http_status": 304}
            response.raise_for_status()
            return {
                "hash": stable_html_fingerprint(response.text),
                "etag": response.headers.get("ETag") or "",
                "last_modified": response.headers.get("Last-Modified") or "",
                "checked_at": utc_now(),
                "http_status": response.status_code,
            }
        except Exception as exc:
            last_error = exc
            if attempt < 4:
                time.sleep(attempt * 1.5)
    raise RuntimeError(f"Impossible de vérifier {url}: {last_error}")


def collect_snapshots(
    root: Path,
    previous_pages: dict[str, Any],
    log_path: Path,
) -> tuple[dict[str, Any], list[str]]:
    session = requests.Session()
    session.headers.update(HEADERS)
    snapshots: dict[str, Any] = {}
    changed: list[str] = []

    urls = monitored_urls(root)
    log(f"Vérification de {len(urls)} page(s) UltraRumble.", log_path)
    for index, url in enumerate(urls, start=1):
        old = previous_pages.get(url) if isinstance(previous_pages, dict) else None
        snap = fetch_snapshot(session, url, old if isinstance(old, dict) else None, log_path)
        snapshots[url] = snap
        if isinstance(old, dict) and old.get("hash") and snap.get("hash") != old.get("hash"):
            changed.append(url)
        if index < len(urls):
            time.sleep(0.08)  # évite les rafales de requêtes

    # Une nouvelle URL surveillée est aussi un changement (nouveau personnage,
    # nouvelle patch note, etc.), sauf lors de la toute première initialisation.
    if previous_pages:
        for url in snapshots:
            if url not in previous_pages:
                changed.append(url)

    return snapshots, sorted(set(changed))


def create_backup(root: Path, log_path: Path) -> Path:
    backup = root / "sauvegardes" / f"sync_auto_{local_stamp()}"
    for rel in BACKUP_FILES:
        source = root / rel
        if not source.exists() or not source.is_file():
            continue
        target = backup / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
    log(f"Sauvegarde créée : {backup.relative_to(root)}", log_path)
    return backup


def restore_backup(root: Path, backup: Path, log_path: Path) -> None:
    if not backup.exists():
        return
    for source in backup.rglob("*"):
        if not source.is_file():
            continue
        rel = source.relative_to(backup)
        target = root / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
    log("La sauvegarde a été restaurée après l'erreur.", log_path)


def run_tool(root: Path, args: list[str], log_path: Path, accepted: set[int] | None = None) -> None:
    accepted = accepted or {0}
    command = [sys.executable, *args]
    log("Exécution : " + " ".join(command[1:]), log_path)
    process = subprocess.Popen(
        command,
        cwd=root,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        errors="replace",
        bufsize=1,
    )
    with log_path.open("a", encoding="utf-8") as handle:
        if process.stdout is not None:
            for line in process.stdout:
                print(line, end="", flush=True)
                handle.write(line)
                handle.flush()
    returncode = process.wait()
    if returncode not in accepted:
        raise RuntimeError(
            f"L'outil {' '.join(args)} a renvoyé le code {returncode}."
        )


def synchronize(root: Path, log_path: Path) -> Path:
    # L'accueil et les événements sont rapides à récupérer. On les applique avant
    # le long scan des personnages/costumes afin que la nouveauté soit visible
    # immédiatement, même si la synchronisation complète prend plusieurs minutes.
    log("Étape 1/3 : mise à jour rapide de l'accueil et des événements...", log_path)
    run_tool(root, [str(TOOLS_DIR / "update_home_data.py"), "--site-root", "."], log_path)

    # La sauvegarde est créée après l'accueil : si le scan complet échoue, la
    # restauration conserve tout de même les nouveaux événements déjà récupérés.
    backup = create_backup(root, log_path)
    try:
        log("Étape 2/3 : synchronisation des personnages, statistiques et costumes...", log_path)
        run_tool(
            root,
            [
                str(TOOLS_DIR / "update_ultrarumble_data.py"),
                "--site-root", ".",
                "--apply-index",
                "--costume-mode", "weekly",
            ],
            log_path,
        )
        log("Étape 3/3 : vérification finale des costumes...", log_path)
        run_tool(
            root,
            [str(TOOLS_DIR / "check_costume_data.py"), "--site-root", "."],
            log_path,
            accepted={0, 2},
        )
        return backup
    except Exception:
        restore_backup(root, backup, log_path)
        raise


def lock_pid(lock_path: Path) -> int | None:
    try:
        match = re.search(r"^pid=(\d+)$", lock_path.read_text(encoding="utf-8"), re.M)
        return int(match.group(1)) if match else None
    except Exception:
        return None


def process_is_alive(pid: int | None) -> bool:
    if not pid or pid <= 0:
        return False
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def acquire_lock(lock_path: Path) -> bool:
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        fd = os.open(str(lock_path), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(f"pid={os.getpid()}\nstarted={utc_now()}\n")
        return True
    except FileExistsError:
        try:
            age = time.time() - lock_path.stat().st_mtime
            pid = lock_pid(lock_path)
            # Supprime immédiatement un verrou laissé par un processus terminé,
            # ou un verrou vraiment ancien.
            if not process_is_alive(pid) or age > 4 * 3600:
                lock_path.unlink(missing_ok=True)
                return acquire_lock(lock_path)
        except OSError:
            pass
        return False


def write_sync_status(status_path: Path, payload: dict) -> None:
    write_json_atomic(status_path, payload)
    js_path = status_path.parent.parent / "diagnostic_data.js"
    js_path.write_text("window.MHUR_SYNC_STATUS = " + json.dumps(payload, ensure_ascii=False) + ";\n", encoding="utf-8")

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--site-root", default=".")
    parser.add_argument("--force", action="store_true", help="force une synchronisation complète")
    parser.add_argument("--check-only", action="store_true", help="vérifie sans modifier le site")
    parser.add_argument(
        "--wait-lock",
        type=int,
        default=0,
        metavar="SECONDES",
        help="attend qu'une synchronisation déjà en cours se termine",
    )
    args = parser.parse_args()

    root = Path(args.site_root).resolve()
    data_dir = root / "data/ultrarumble"
    state_path = data_dir / "synchronisation_state.json"
    status_path = data_dir / "derniere_synchronisation.json"
    log_path = data_dir / "synchronisation_ultrarumble.log"
    lock_path = data_dir / "synchronisation_en_cours.lock"

    if not acquire_lock(lock_path):
        deadline = time.time() + max(0, args.wait_lock)
        if args.wait_lock:
            log("Une synchronisation est déjà en cours; attente de sa fin...", log_path)
        while args.wait_lock and time.time() < deadline:
            time.sleep(2)
            if acquire_lock(lock_path):
                break
        else:
            if args.wait_lock:
                log("Délai dépassé : la mise à jour immédiate n'a pas pu démarrer.", log_path)
                return 4
            log("Une autre synchronisation est déjà en cours; cette exécution est ignorée.", log_path)
            return 4

    try:
        state = load_json(state_path, {})
        previous_pages = state.get("pages", {}) if isinstance(state, dict) else {}
        snapshots, changed = collect_snapshots(root, previous_pages, log_path)
        first_run = not bool(previous_pages)

        if args.force:
            changed = ["synchronisation_forcée"]
        elif first_run:
            write_json_atomic(
                state_path,
                {"version": 1, "checked_at": utc_now(), "pages": snapshots},
            )
            write_sync_status(
                status_path,
                {
                    "status": "initialisé",
                    "checked_at": utc_now(),
                    "message": "Empreintes initiales enregistrées; aucun fichier local modifié.",
                },
            )
            log("Première vérification : empreintes enregistrées.", log_path)
            return 0

        if args.check_only:
            payload = {
                "status": "changements_disponibles" if changed else "à_jour",
                "checked_at": utc_now(),
                "changed_urls": changed,
                "message": f"{len(changed)} changement(s) détecté(s)." if changed else "Aucun changement détecté.",
            }
            write_sync_status(status_path, payload)
            log(f"Vérification seule : {len(changed)} changement(s) détecté(s).", log_path)
            return 10 if changed else 0

        if not changed:
            write_json_atomic(
                state_path,
                {"version": 1, "checked_at": utc_now(), "pages": snapshots},
            )
            write_sync_status(
                status_path,
                {
                    "status": "à_jour",
                    "checked_at": utc_now(),
                    "message": "Aucun changement détecté sur UltraRumble.",
                },
            )
            log("Aucun changement détecté; le site local reste inchangé.", log_path)
            return 0

        log(f"Changement détecté sur {len(changed)} page(s).", log_path)
        for url in changed[:20]:
            log(f"  - {url}", log_path)
        backup = synchronize(root, log_path)

        # Recalcule les empreintes après la mise à jour pour inclure une éventuelle
        # nouvelle fiche ajoutée au cache local par les outils.
        final_snapshots, _ = collect_snapshots(root, snapshots, log_path)
        write_json_atomic(
            state_path,
            {"version": 1, "checked_at": utc_now(), "pages": final_snapshots},
        )
        write_sync_status(
            status_path,
            {
                "status": "mis_à_jour",
                "updated_at": utc_now(),
                "changed_urls": changed,
                "backup": str(backup.relative_to(root)),
                "message": "Le site local a été synchronisé avec UltraRumble.",
            },
        )
        log("Synchronisation terminée avec succès.", log_path)
        return 0
    except Exception as exc:
        write_sync_status(
            status_path,
            {
                "status": "erreur",
                "checked_at": utc_now(),
                "message": str(exc),
            },
        )
        log(f"ERREUR : {exc}", log_path)
        return 1
    finally:
        lock_path.unlink(missing_ok=True)


if __name__ == "__main__":
    raise SystemExit(main())
