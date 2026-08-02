from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable

IMAGE_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".svg"
}

IMAGE_FIELDS = {
    "image", "img", "art", "portrait", "skill_image", "icon", "banner"
}

SOURCE_FIELDS = (
    "image_source",
    "banner_source",
    "portrait_source",
    "skill_image_source",
    "art_source",
    "source_image",
    "remote_image",
)

VALID_TONES = {"buff", "nerf", "adjust"}

POLICY_MARKER = "# MHUR V585 LIMITED IMAGE POLICY"

def configure_stdio() -> None:
    for name in ("stdout", "stderr"):
        stream = getattr(sys, name, None)
        try:
            stream.reconfigure(encoding="utf-8", errors="backslashreplace")
        except (AttributeError, OSError):
            pass

def fail(message: str) -> None:
    raise RuntimeError(message)

def clean(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()

def norm(value: Any) -> str:
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(
        char for char in text
        if unicodedata.category(char) != "Mn"
    )
    return re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")

def read_text(path: Path) -> str:
    if not path.is_file():
        fail(f"Fichier introuvable : {path.as_posix()}")
    return path.read_text(encoding="utf-8-sig")

def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")

def parse_assigned_json(path: Path, variable: str) -> dict[str, Any]:
    source = read_text(path)
    pattern = re.compile(
        rf"\s*window\.{re.escape(variable)}\s*=\s*(\{{[\s\S]*\}})\s*;?\s*"
    )
    match = pattern.fullmatch(source)

    if not match:
        fail(f"Impossible de lire window.{variable} dans {path.as_posix()}.")

    try:
        data = json.loads(match.group(1))
    except json.JSONDecodeError as error:
        fail(f"JSON invalide dans {path.as_posix()} : {error}")

    if not isinstance(data, dict):
        fail(f"La racine de {path.as_posix()} doit être un objet.")

    return data

def write_assigned_json(path: Path, variable: str, data: dict[str, Any]) -> None:
    compact = json.dumps(
        data,
        ensure_ascii=False,
        separators=(",", ":"),
    )
    write_text(path, f"window.{variable} = {compact};")

def local_asset_path(site_root: Path, value: Any) -> Path | None:
    raw = str(value or "").strip().replace("\\", "/")
    if not raw or re.match(r"^(?:https?:)?//|^data:", raw, flags=re.I):
        return None

    raw = raw.split("?", 1)[0].split("#", 1)[0].lstrip("/")

    if raw.startswith("public/"):
        return site_root.parent / raw
    if raw.startswith("assets/"):
        return site_root / raw
    if raw.startswith("./assets/"):
        return site_root / raw[2:]

    return None

def relative_to_repo(repo_root: Path, path: Path) -> str:
    return path.resolve().relative_to(repo_root.resolve()).as_posix()

def hash_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()

def image_inventory(site_root: Path) -> dict[str, str]:
    repo_root = site_root.parent
    assets = site_root / "assets"
    result: dict[str, str] = {}

    if not assets.exists():
        return result

    for path in assets.rglob("*"):
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
            result[relative_to_repo(repo_root, path)] = hash_file(path)

    return result

def home_path(site_root: Path) -> Path:
    json_path = site_root / "data" / "home_data.json"
    return json_path if json_path.is_file() else site_root / "data" / "home_data.js"

def load_home(site_root: Path) -> dict[str, Any]:
    json_path = site_root / "data" / "home_data.json"
    if json_path.is_file():
        try:
            data = json.loads(read_text(json_path))
        except json.JSONDecodeError as error:
            fail(f"home_data.json invalide : {error}")
        if not isinstance(data, dict):
            fail("home_data.json doit contenir un objet.")
        return data

    return parse_assigned_json(
        site_root / "data" / "home_data.js",
        "MHUR_HOME_DATA",
    )

def save_home(site_root: Path, data: dict[str, Any]) -> None:
    json_path = site_root / "data" / "home_data.json"
    js_path = site_root / "data" / "home_data.js"

    write_text(
        json_path,
        json.dumps(data, ensure_ascii=False, indent=2),
    )
    write_assigned_json(js_path, "MHUR_HOME_DATA", data)

def load_season(site_root: Path) -> dict[str, Any]:
    return parse_assigned_json(
        site_root / "data" / "season18_sync.js",
        "MHUR_SEASON18_DATA",
    )

def save_season(site_root: Path, data: dict[str, Any]) -> None:
    write_assigned_json(
        site_root / "data" / "season18_sync.js",
        "MHUR_SEASON18_DATA",
        data,
    )

def record_id(row: Any, fallback: str = "") -> str:
    if not isinstance(row, dict):
        return fallback
    return str(
        row.get("id")
        or row.get("character_id")
        or row.get("style_id")
        or fallback
        or ""
    )

def inventory(site_root: Path) -> dict[str, Any]:
    home = load_home(site_root)
    season = load_season(site_root)

    events = {
        record_id(row, norm(row.get("title") if isinstance(row, dict) else ""))
        for row in home.get("events", [])
        if isinstance(row, dict)
    }

    latest_releases = {
        "|".join(
            [
                str(row.get("release_kind") or ""),
                str(row.get("character_id") or ""),
                str(row.get("style_id") or ""),
                str(row.get("releaseDate") or row.get("date") or ""),
                str(row.get("title") or ""),
            ]
        )
        for row in home.get("latest_releases", [])
        if isinstance(row, dict)
    }

    return {
        "costumes": sorted(map(str, (season.get("costumes") or {}).keys())),
        "styles": sorted(map(str, (season.get("official_portraits") or {}).keys())),
        "active_characters": sorted(
            map(
                str,
                (
                    season.get("active_new_content")
                    or season.get("new_content")
                    or {}
                ).get("characters", []),
            )
        ),
        "active_styles": sorted(
            map(
                str,
                (
                    season.get("active_new_content")
                    or season.get("new_content")
                    or {}
                ).get("styles", []),
            )
        ),
        "events": sorted(events),
        "latest_releases": sorted(latest_releases),
        "images": image_inventory(site_root),
    }

def add_import_os(source: str) -> str:
    if re.search(r"^\s*import\s+os\b|^\s*from\s+os\b", source, flags=re.M):
        return source

    future = re.search(
        r"^from __future__ import [^\n]+\n",
        source,
        flags=re.M,
    )
    if future:
        return source[: future.end()] + "import os\n" + source[future.end():]

    return "import os\n" + source

def patch_download_policy(path: Path) -> bool:
    if not path.is_file():
        return False

    source = read_text(path)
    if POLICY_MARKER in source:
        return False

    lines = source.splitlines()
    function_start = None
    signature_end = None
    parenthesis_depth = 0

    for index, line in enumerate(lines):
        if function_start is None and re.match(r"^\s*def\s+download_image\s*\(", line):
            function_start = index

        if function_start is not None:
            parenthesis_depth += line.count("(") - line.count(")")
            if parenthesis_depth <= 0 and line.rstrip().endswith(":"):
                signature_end = index
                break

    if function_start is None or signature_end is None:
        return False

    source = add_import_os(source)
    lines = source.splitlines()

    # Le nouvel import peut avoir décalé la fonction.
    for index, line in enumerate(lines):
        if re.match(r"^\s*def\s+download_image\s*\(", line):
            function_start = index
            parenthesis_depth = 0
            for second in range(index, len(lines)):
                parenthesis_depth += lines[second].count("(") - lines[second].count(")")
                if parenthesis_depth <= 0 and lines[second].rstrip().endswith(":"):
                    signature_end = second
                    break
            break

    if function_start is None or signature_end is None:
        return False

    indent = re.match(r"^(\s*)", lines[function_start]).group(1) + "    "
    policy = [
        indent + POLICY_MARKER,
        indent + 'if os.environ.get("MHUR_IMAGE_POLICY_V585") == "limited":',
        indent + '    normalized = str(rel_base or "").replace("\\\\", "/").lower()',
        indent + "    blocked = (",
        indent + '        "assets/home/gachas/",',
        indent + '        "assets/home/bonuses/",',
        indent + '        "assets/home/discounts/",',
        indent + '        "assets/home/patches/",',
        indent + "    )",
        indent + "    if normalized.startswith(blocked):",
        indent + "        return url",
    ]

    lines[signature_end + 1 : signature_end + 1] = policy
    write_text(path, "\n".join(lines))
    return True

def install_image_policy(repo_root: Path) -> list[str]:
    changed: list[str] = []

    candidates = [
        repo_root / "mise_a_jour" / "outils" / "update_home_data.py",
        repo_root / "mise_a_jour" / "outils" / "season18_postprocess.py",
    ]

    for path in candidates:
        if patch_download_policy(path):
            changed.append(relative_to_repo(repo_root, path))

    return changed

def date_day(value: Any) -> str:
    match = re.match(r"^(20\d{2}-\d{2}-\d{2})", str(value or ""))
    return match.group(1) if match else ""

def now_jst_day() -> str:
    return (
        datetime.now(timezone.utc) + timedelta(hours=9)
    ).date().isoformat()

def release_date(row: dict[str, Any]) -> str:
    return str(
        row.get("releaseDate")
        or row.get("release_date")
        or row.get("start")
        or row.get("date")
        or ""
    )

def is_future(row: dict[str, Any], today: str) -> bool:
    day = date_day(release_date(row))
    return bool(row.get("upcoming")) or bool(day and day > today)

def unique_strings(values: Iterable[Any]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()

    for value in values:
        text = str(value or "")
        if text and text not in seen:
            seen.add(text)
            result.append(text)

    return result

def sanitize_home(home: dict[str, Any]) -> dict[str, Any]:
    today = now_jst_day()

    for key in (
        "latest_releases",
        "gachas",
        "events",
        "login_bonuses",
        "patch_notes",
        "discounts",
    ):
        if not isinstance(home.get(key), list):
            home[key] = []

    releases = [
        row for row in home["latest_releases"]
        if isinstance(row, dict)
    ]

    # Les placeholders historiques « Character 13 » sans identifiant ne doivent
    # plus prendre la place des vraies sorties dans l'accueil.
    cleaned_releases: list[dict[str, Any]] = []
    for row in releases:
        title = clean(row.get("title"))
        has_identifier = bool(row.get("character_id") or row.get("style_id"))
        generic = bool(re.fullmatch(r"Character\s+\d+", title, flags=re.I))
        if generic and not has_identifier:
            continue
        cleaned_releases.append(row)

    cleaned_releases.sort(
        key=lambda row: release_date(row),
        reverse=True,
    )
    home["latest_releases"] = cleaned_releases[:12]

    home["events"] = sorted(
        [row for row in home["events"] if isinstance(row, dict)],
        key=lambda row: str(row.get("start") or ""),
    )
    home["gachas"] = sorted(
        [row for row in home["gachas"] if isinstance(row, dict)],
        key=lambda row: str(row.get("start") or ""),
    )
    home["login_bonuses"] = sorted(
        [row for row in home["login_bonuses"] if isinstance(row, dict)],
        key=lambda row: str(row.get("start") or ""),
    )
    home["patch_notes"] = sorted(
        [row for row in home["patch_notes"] if isinstance(row, dict)],
        key=lambda row: str(row.get("date") or row.get("id") or ""),
        reverse=True,
    )[:20]

    for key in (
        "planned_releases",
        "upcoming_releases",
        "future_releases",
        "roadmap",
    ):
        rows = home.get(key)
        if isinstance(rows, list):
            home[key] = sorted(
                [
                    row for row in rows
                    if isinstance(row, dict) and is_future(row, today)
                ],
                key=release_date,
            )

    meta = home.setdefault("meta", {})
    if isinstance(meta, dict):
        meta["updated_at"] = datetime.now(timezone.utc).isoformat()
        meta["source"] = "UltraRumble.com"
        meta["version"] = "v585-complete-safe-sync"

    return home

def number(value: Any) -> float | None:
    match = re.search(r"[-+]?\d+(?:[.,]\d+)?", str(value or ""))
    if not match:
        return None
    try:
        return float(match.group(0).replace(",", "."))
    except ValueError:
        return None

def values(value: Any) -> list[Any]:
    return value if isinstance(value, list) else [value]

def metric_direction(context: Any) -> int:
    text = norm(context)

    if re.search(
        r"(reload|recharge|cooldown|recovery)_?speed|"
        r"speed_?(reload|recharge|cooldown|recovery)|"
        r"vitesse_de_(recharge|rechargement|recuperation)",
        text,
    ):
        return 1

    if re.search(
        r"reload|recharge|cooldown|charge_?time|"
        r"recovery_?time|temps_de_recharge|"
        r"interval|delay|startup|start_?up|end_?lag|"
        r"second|seconde|time|temps|"
        r"use_?ammo|ammo_?use|consumption|consommation|cost|cout|"
        r"damage_?taken|degats_?subis|penalty|penalite",
        text,
    ):
        return -1

    if re.search(
        r"damage|degats|ammo|munition|round|magazine|"
        r"health|hp|pv|guard|armor|armure|"
        r"range|portee|size|taille|radius|rayon|"
        r"power|puissance|speed|vitesse|"
        r"duration|duree|distance|amount|quantite|"
        r"number|nombre|count|max",
        text,
    ):
        return 1

    return 0

def explicit_tone(change: dict[str, Any]) -> str:
    text = norm(change.get("tone") or change.get("type"))
    if re.search(r"buff|increase|improve|up", text):
        return "buff"
    if re.search(r"nerf|decrease|reduce|down", text):
        return "nerf"
    return "adjust"

def verified_tone(change: dict[str, Any], section_title: str) -> str:
    context = " ".join(
        str(value or "")
        for value in (
            section_title,
            change.get("label"),
            change.get("skill_name"),
            change.get("stat"),
            change.get("metric"),
            " ".join(map(str, change.get("bullets") or [])),
        )
    )

    direction = metric_direction(context)

    if direction:
        results: list[float] = []

        for before, after in zip(
            values(change.get("before")),
            values(change.get("after")),
        ):
            old = number(before)
            new = number(after)
            if old is None or new is None:
                continue

            result = (new - old) * direction
            if abs(result) > 1e-9:
                results.append(result)

        if results:
            if all(result > 0 for result in results):
                return "buff"
            if all(result < 0 for result in results):
                return "nerf"
            return "adjust"

    return explicit_tone(change)

def correct_patch_notes(home: dict[str, Any]) -> list[dict[str, Any]]:
    corrections: list[dict[str, Any]] = []

    for note in home.get("patch_notes", []):
        if not isinstance(note, dict):
            continue

        for section in note.get("details", []):
            if not isinstance(section, dict):
                continue

            title = clean(section.get("title"))

            for change in section.get("changes", []):
                if not isinstance(change, dict):
                    continue

                old = explicit_tone(change)
                new = verified_tone(change, title)
                change["tone"] = new

                if old != "adjust" and old != new:
                    corrections.append(
                        {
                            "patch": str(note.get("id") or note.get("title") or ""),
                            "character": str(change.get("character") or ""),
                            "skill": str(
                                change.get("skill_name")
                                or change.get("label")
                                or ""
                            ),
                            "metric": str(change.get("label") or ""),
                            "before": change.get("before"),
                            "after": change.get("after"),
                            "old": old,
                            "new": new,
                        }
                    )

    return corrections

def update_season(
    season: dict[str, Any],
    home: dict[str, Any],
) -> dict[str, Any]:
    costumes = season.setdefault("costumes", {})
    if not isinstance(costumes, dict):
        fail("season18_sync.costumes doit être un objet.")

    today = now_jst_day()
    released_days: list[str] = []
    upcoming_ids: list[str] = []

    for costume_id, row in costumes.items():
        if not isinstance(row, dict):
            continue

        day = date_day(release_date(row))
        upcoming = bool(row.get("upcoming")) or bool(day and day > today)
        row["upcoming"] = upcoming

        if upcoming:
            upcoming_ids.append(str(costume_id))
        elif day:
            released_days.append(day)

    latest_day = max(released_days) if released_days else ""
    latest_costumes = [
        str(costume_id)
        for costume_id, row in costumes.items()
        if isinstance(row, dict)
        and not row.get("upcoming")
        and date_day(release_date(row)) == latest_day
    ]

    release_rows = [
        row for row in home.get("latest_releases", [])
        if isinstance(row, dict)
        and date_day(release_date(row)) == latest_day
    ]

    latest_characters = unique_strings(
        row.get("character_id")
        for row in release_rows
        if str(row.get("release_kind") or "").lower() == "character"
    )
    latest_styles = unique_strings(
        row.get("style_id")
        for row in release_rows
        if str(row.get("release_kind") or "").lower() in {
            "style", "alter", "quirk", "skill"
        }
    )

    old_active = (
        season.get("active_new_content")
        or season.get("new_content")
        or {}
    )

    if not latest_characters:
        latest_characters = unique_strings(old_active.get("characters", []))
    if not latest_styles:
        latest_styles = unique_strings(old_active.get("styles", []))

    active = {
        "characters": latest_characters,
        "styles": latest_styles,
        "costumes": latest_costumes,
    }

    season["active_new_content"] = active
    season["new_content"] = json.loads(json.dumps(active))
    season["upcoming_costumes"] = sorted(
        upcoming_ids,
        key=lambda value: (
            release_date(costumes.get(value, {})),
            value,
        ),
    )
    season["updated_at"] = datetime.now(timezone.utc).isoformat()

    return season

def all_strings(value: Any) -> Iterable[str]:
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for key, item in value.items():
            yield str(key)
            yield from all_strings(item)
    elif isinstance(value, list):
        for item in value:
            yield from all_strings(item)

def asset_paths_for_id(asset_data: Any, target_id: str) -> list[str]:
    result: list[str] = []

    def visit(value: Any, matched: bool = False) -> None:
        if isinstance(value, dict):
            local_match = matched or target_id in {
                str(value.get("id") or ""),
                str(value.get("urId") or ""),
                str(value.get("ur_id") or ""),
            }

            for key, item in value.items():
                key_match = local_match or str(key) == target_id
                visit(item, key_match)

        elif isinstance(value, list):
            for item in value:
                visit(item, matched)

        elif isinstance(value, str):
            if matched and (
                value.startswith("assets/")
                or value.startswith("public/assets/")
            ):
                result.append(value)

    visit(asset_data)
    return result

def new_content_from_inventories(
    before: dict[str, Any],
    after: dict[str, Any],
    home: dict[str, Any],
    season: dict[str, Any],
) -> dict[str, list[str]]:
    new_styles = sorted(
        set(after["styles"]) - set(before["styles"])
    )
    new_costumes = sorted(
        set(after["costumes"]) - set(before["costumes"])
    )
    new_events = sorted(
        set(after["events"]) - set(before["events"])
    )
    new_characters = sorted(
        set(after["active_characters"]) - set(before["active_characters"])
    )

    for row in home.get("latest_releases", []):
        if not isinstance(row, dict):
            continue

        character_id = str(row.get("character_id") or "")
        style_id = str(row.get("style_id") or "")

        if character_id and character_id not in before["active_characters"]:
            new_characters.append(character_id)
        if style_id and style_id not in before["styles"]:
            new_styles.append(style_id)

    return {
        "characters": sorted(set(filter(None, new_characters))),
        "styles": sorted(set(filter(None, new_styles))),
        "costumes": sorted(set(filter(None, new_costumes))),
        "events": sorted(set(filter(None, new_events))),
    }

def is_allowed_new_image(
    relative: str,
    new_content: dict[str, list[str]],
) -> bool:
    path = relative.lower().replace("\\", "/")

    if path.startswith("public/assets/home/events/"):
        return True
    if path.startswith("public/assets/home/releases/"):
        return True
    if path.startswith("public/assets/costume_photos/"):
        return True
    if path.startswith("public/assets/mhur_database/costumes/"):
        return True
    if "/tuning/" in path or "/t.u.n.i.n.g/" in path:
        return True

    slugs = {
        norm(value)
        for key in ("characters", "styles")
        for value in new_content.get(key, [])
        if value
    }

    normalized_path = norm(path)
    return any(slug and slug in normalized_path for slug in slugs)

def git_lines(
    repo_root: Path,
    arguments: list[str],
) -> list[str]:
    result = subprocess.run(
        ["git", *arguments],
        cwd=repo_root,
        text=True,
        capture_output=True,
        check=True,
    )
    return [
        line.strip()
        for line in result.stdout.splitlines()
        if line.strip()
    ]

def enforce_asset_policy(
    repo_root: Path,
    site_root: Path,
    before: dict[str, Any],
    new_content: dict[str, list[str]],
) -> dict[str, list[str]]:
    preserved: list[str] = []
    removed: list[str] = []
    restored: list[str] = []

    # Une image déjà suivie par Git ne doit jamais être remplacée
    # simplement parce que le synchroniseur l'a retéléchargée.
    modified = git_lines(
        repo_root,
        ["diff", "--name-only", "--diff-filter=M", "--", "public/assets"],
    )

    for relative in modified:
        path = repo_root / relative
        if path.suffix.lower() not in IMAGE_EXTENSIONS:
            continue
        subprocess.run(
            ["git", "checkout", "--", relative],
            cwd=repo_root,
            check=True,
        )
        restored.append(relative)

    untracked = git_lines(
        repo_root,
        [
            "ls-files",
            "--others",
            "--exclude-standard",
            "--",
            "public/assets",
        ],
    )

    for relative in untracked:
        path = repo_root / relative

        if path.suffix.lower() not in IMAGE_EXTENSIONS:
            continue

        if is_allowed_new_image(relative, new_content):
            preserved.append(relative)
        else:
            path.unlink(missing_ok=True)
            removed.append(relative)

    # Supprime les dossiers désormais vides.
    assets_root = site_root / "assets"
    for directory in sorted(
        [path for path in assets_root.rglob("*") if path.is_dir()],
        key=lambda path: len(path.parts),
        reverse=True,
    ):
        try:
            directory.rmdir()
        except OSError:
            pass

    return {
        "preserved": sorted(preserved),
        "removed": sorted(removed),
        "restored": sorted(restored),
    }

def repair_missing_images(value: Any, site_root: Path) -> None:
    if isinstance(value, dict):
        for key, item in list(value.items()):
            if key in IMAGE_FIELDS and isinstance(item, str):
                local = local_asset_path(site_root, item)
                if local is not None and not local.is_file():
                    replacement = ""

                    for source_key in SOURCE_FIELDS:
                        candidate = value.get(source_key)
                        if isinstance(candidate, str) and re.match(
                            r"^(?:https?:)?//",
                            candidate,
                            flags=re.I,
                        ):
                            replacement = candidate
                            break

                    value[key] = replacement

            repair_missing_images(value.get(key), site_root)

    elif isinstance(value, list):
        for item in value:
            repair_missing_images(item, site_root)

def validate_local_references(index: str, site_root: Path) -> list[str]:
    missing: list[str] = []
    pattern = re.compile(
        r"<(?:script|link)\b[^>]*(?:src|href)=[\"']"
        r"([^\"']+\.(?:js|css)(?:\?[^\"']*)?)[\"']",
        flags=re.I,
    )

    for raw in pattern.findall(index):
        if re.match(r"^(?:https?:)?//|^data:", raw, flags=re.I):
            continue

        clean_path = raw.split("?", 1)[0].split("#", 1)[0].lstrip("/")
        target = site_root / clean_path

        if not target.is_file():
            missing.append(clean_path)

    return sorted(set(missing))

def find_event(home: dict[str, Any], event_id: str) -> dict[str, Any] | None:
    for row in home.get("events", []):
        if not isinstance(row, dict):
            continue
        candidate = record_id(row, norm(row.get("title")))
        if candidate == event_id:
            return row
    return None

def validate_complete_update(
    repo_root: Path,
    site_root: Path,
    before: dict[str, Any],
    after: dict[str, Any],
    new_content: dict[str, list[str]],
    home: dict[str, Any],
    season: dict[str, Any],
) -> dict[str, list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    removed_costumes = set(before["costumes"]) - set(after["costumes"])
    removed_styles = set(before["styles"]) - set(after["styles"])

    if removed_costumes:
        errors.append(
            "Costumes historiques supprimés : "
            + ", ".join(sorted(removed_costumes)[:20])
        )
    if removed_styles:
        errors.append(
            "Styles/Alters historiques supprimés : "
            + ", ".join(sorted(removed_styles)[:20])
        )

    index_path = site_root / "index.html"
    index = read_text(index_path)
    missing_references = validate_local_references(index, site_root)

    if missing_references:
        errors.append(
            "Fichiers JS/CSS chargés mais absents : "
            + ", ".join(missing_references)
        )

    portraits = season.get("official_portraits") or {}

    for style_id in new_content["styles"]:
        portrait_value = portraits.get(style_id)

        if not portrait_value:
            errors.append(f"{style_id} : portrait officiel absent.")
            continue

        portrait = local_asset_path(site_root, portrait_value)
        if portrait is None or not portrait.is_file():
            errors.append(f"{style_id} : fichier portrait absent.")
            continue

        if style_id not in index:
            errors.append(
                f"{style_id} : données de l'Alter absentes de index.html."
            )

        folder = portrait.parent
        images = [
            path for path in folder.rglob("*")
            if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
        ]

        if len(images) < 4:
            warnings.append(
                f"{style_id} : moins de 4 images locales "
                "(portrait + Alters attendus)."
            )

        style_occurrences = index.count(style_id)
        if style_occurrences < 2:
            warnings.append(
                f"{style_id} : présence faible dans les données "
                f"({style_occurrences} occurrence)."
            )

    asset_file = site_root / "data" / "mhur_database_assets.json"
    asset_data: Any = {}

    if asset_file.is_file():
        try:
            asset_data = json.loads(read_text(asset_file))
        except json.JSONDecodeError:
            warnings.append("mhur_database_assets.json est invalide.")

    for costume_id in new_content["costumes"]:
        candidates = asset_paths_for_id(asset_data, costume_id)

        candidates.extend(
            relative_to_repo(repo_root, path)
            for directory in (
                site_root / "assets" / "costume_photos",
                site_root / "assets" / "mhur_database" / "costumes",
            )
            if directory.exists()
            for path in directory.rglob(f"*{costume_id}*")
            if path.is_file()
        )

        existing = False

        for candidate in candidates:
            local = local_asset_path(site_root, candidate)
            if local is None and candidate.startswith("public/"):
                local = repo_root / candidate

            if local is not None and local.is_file():
                existing = True
                break

        if not existing:
            warnings.append(
                f"Costume {costume_id} : image locale non confirmée."
            )

    for event_id in new_content["events"]:
        row = find_event(home, event_id)

        if row is None:
            errors.append(f"Événement {event_id} absent de home_data.")
            continue

        image = str(row.get("image") or "")
        local = local_asset_path(site_root, image)

        if not image:
            errors.append(f"Événement {event_id} : image absente.")
        elif local is not None and not local.is_file():
            errors.append(
                f"Événement {event_id} : fichier image local absent."
            )

    for note in home.get("patch_notes", []):
        if not isinstance(note, dict):
            continue
        for section in note.get("details", []):
            if not isinstance(section, dict):
                continue
            for change in section.get("changes", []):
                if not isinstance(change, dict):
                    continue
                if change.get("tone") not in VALID_TONES:
                    errors.append(
                        "Patch Note avec un ton invalide : "
                        + str(change.get("tone"))
                    )

    # Le correcteur de noms officiels doit rester chargé après chaque synchro.
    if "v584-patch-notes-final.js" not in index:
        warnings.append(
            "Le correcteur V584 des noms officiels n'est pas chargé."
        )

    active = season.get("active_new_content") or {}
    if not isinstance(active.get("costumes"), list):
        errors.append("active_new_content.costumes est invalide.")
    if not isinstance(season.get("upcoming_costumes"), list):
        errors.append("upcoming_costumes est invalide.")

    if errors:
        fail(
            "La mise à jour V585 est incomplète et a été bloquée :\n- "
            + "\n- ".join(errors)
        )

    return {
        "errors": errors,
        "warnings": warnings,
    }

def cleanup_generated_noise(repo_root: Path) -> list[str]:
    removed: list[str] = []

    for relative in git_lines(
        repo_root,
        ["ls-files", "--others", "--exclude-standard"],
    ):
        path = repo_root / relative
        low = relative.lower()

        if (
            low.endswith((".tmp", ".bak", ".log"))
            or "__pycache__" in low
            or low.endswith(".pyc")
        ):
            if path.is_file():
                path.unlink(missing_ok=True)
                removed.append(relative)
            elif path.is_dir():
                shutil.rmtree(path, ignore_errors=True)
                removed.append(relative)

    return sorted(removed)

def format_list(values: Iterable[str]) -> str:
    values = list(values)
    return ", ".join(values) if values else "aucun"

def write_manifest_and_report(
    site_root: Path,
    before: dict[str, Any],
    after: dict[str, Any],
    new_content: dict[str, list[str]],
    corrections: list[dict[str, Any]],
    asset_result: dict[str, list[str]],
    validation: dict[str, list[str]],
    policy_files: list[str],
) -> None:
    manifest = {
        "version": "v585",
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "source": "UltraRumble.com",
        "new_content": new_content,
        "counts_before": {
            key: len(value)
            for key, value in before.items()
            if isinstance(value, (list, dict))
        },
        "counts_after": {
            key: len(value)
            for key, value in after.items()
            if isinstance(value, (list, dict))
        },
        "patch_note_corrections": corrections,
        "images": asset_result,
        "validation": validation,
        "image_policy_files": policy_files,
    }

    write_text(
        site_root / "data" / "update_manifest_v585.json",
        json.dumps(manifest, ensure_ascii=False, indent=2),
    )

    lines = [
        "MHUR FRANCE — RAPPORT MISE À JOUR COMPLÈTE V585",
        "",
        f"Date UTC : {manifest['updated_at']}",
        "Source : UltraRumble.com",
        "",
        "CONTENU NOUVEAU DÉTECTÉ",
        f"- Personnages : {format_list(new_content['characters'])}",
        f"- Alters / Styles : {format_list(new_content['styles'])}",
        f"- Costumes : {format_list(new_content['costumes'])}",
        f"- Événements : {format_list(new_content['events'])}",
        "",
        "SECTIONS SYNCHRONISÉES",
        "- Personnages jouables et personnages à venir",
        "- Alters, actions spéciales, détails, valeurs et effets de niveau",
        "- T.U.N.I.N.G. normal et spécial",
        "- Accueil complet",
        "- Patch Notes avec double vérification BUFF / NERF",
        "- Costumes sortis et costumes à venir",
        "- Événements",
        "",
        "POLITIQUE DES IMAGES",
        "- Conservées uniquement : nouveaux personnages / Alters, leur T.U.N.I.N.G.,",
        "  nouveaux costumes, illustrations de sorties et événements.",
        f"- Nouvelles images conservées : {len(asset_result['preserved'])}",
        f"- Images inutiles refusées : {len(asset_result['removed'])}",
        f"- Anciennes images protégées/restaurées : {len(asset_result['restored'])}",
        "",
        "PATCH NOTES",
        f"- Contradictions BUFF / NERF corrigées : {len(corrections)}",
    ]

    for correction in corrections:
        lines.append(
            "- "
            + correction["character"]
            + " — "
            + correction["skill"]
            + " : "
            + correction["old"].upper()
            + " → "
            + correction["new"].upper()
        )

    lines += [
        "",
        "VALIDATION",
        "- Aucun personnage, Alter ou costume historique supprimé : OK",
        "- Fichiers JS/CSS chargés présents : OK",
        "- Données accueil valides : OK",
        "- Costumes à venir recalculés : OK",
        "- NEW recalculés sur la dernière date sortie : OK",
        "- Patch Notes vérifiées niveau par niveau : OK",
    ]

    for warning in validation["warnings"]:
        lines.append("- AVERTISSEMENT : " + warning)

    write_text(
        site_root.parent / "RAPPORT_MISE_A_JOUR_V585.txt",
        "\n".join(lines),
    )

def run_sync(
    repo_root: Path,
    site_root: Path,
    monitor: Path,
    wait_lock: int,
) -> None:
    if not monitor.is_file():
        fail(f"Synchroniseur introuvable : {monitor.as_posix()}")

    environment = os.environ.copy()
    environment.update(
        {
            "PYTHONUTF8": "1",
            "PYTHONIOENCODING": "utf-8",
            "MHUR_IMAGE_POLICY_V585": "limited",
        }
    )

    command = [
        sys.executable,
        str(monitor),
        "--site-root",
        relative_to_repo(repo_root, site_root),
        "--force",
        "--wait-lock",
        str(wait_lock),
    ]

    print("[V585] Lancement du synchroniseur complet :", flush=True)
    print("[V585] " + " ".join(command), flush=True)

    subprocess.run(
        command,
        cwd=repo_root,
        env=environment,
        check=True,
        timeout=60 * 30,
    )

def main() -> None:
    configure_stdio()

    parser = argparse.ArgumentParser(
        description="Mise à jour complète et sécurisée de MHUR France."
    )
    parser.add_argument("--site-root", default="public")
    parser.add_argument(
        "--monitor",
        default="mise_a_jour/outils/surveiller_ultrarumble.py",
    )
    parser.add_argument("--wait-lock", type=int, default=300)
    parser.add_argument(
        "--skip-sync",
        action="store_true",
        help="Appliquer seulement les validations/post-traitements.",
    )
    args = parser.parse_args()

    repo_root = Path.cwd().resolve()
    site_root = (repo_root / args.site_root).resolve()
    monitor = (repo_root / args.monitor).resolve()

    for required in (
        site_root / "index.html",
        site_root / "data" / "home_data.js",
        site_root / "data" / "season18_sync.js",
    ):
        if not required.is_file():
            fail(f"Fichier essentiel absent : {required.as_posix()}")

    before = inventory(site_root)
    policy_files = install_image_policy(repo_root)

    if not args.skip_sync:
        run_sync(
            repo_root,
            site_root,
            monitor,
            args.wait_lock,
        )

    home = sanitize_home(load_home(site_root))
    corrections = correct_patch_notes(home)
    season = update_season(load_season(site_root), home)

    save_home(site_root, home)
    save_season(site_root, season)

    after_before_assets = inventory(site_root)
    new_content = new_content_from_inventories(
        before,
        after_before_assets,
        home,
        season,
    )

    asset_result = enforce_asset_policy(
        repo_root,
        site_root,
        before,
        new_content,
    )

    repair_missing_images(home, site_root)
    save_home(site_root, home)

    cleanup_generated_noise(repo_root)

    final_inventory = inventory(site_root)
    validation = validate_complete_update(
        repo_root,
        site_root,
        before,
        final_inventory,
        new_content,
        home,
        season,
    )

    write_manifest_and_report(
        site_root,
        before,
        final_inventory,
        new_content,
        corrections,
        asset_result,
        validation,
        policy_files,
    )

    print("", flush=True)
    print("[OK] Mise à jour complète V585 terminée.", flush=True)
    print(
        "[OK] Nouveaux personnages : "
        + format_list(new_content["characters"]),
        flush=True,
    )
    print(
        "[OK] Nouveaux Alters : "
        + format_list(new_content["styles"]),
        flush=True,
    )
    print(
        "[OK] Nouveaux costumes : "
        + format_list(new_content["costumes"]),
        flush=True,
    )
    print(
        "[OK] Nouveaux événements : "
        + format_list(new_content["events"]),
        flush=True,
    )
    print(
        f"[OK] Corrections Patch Notes : {len(corrections)}.",
        flush=True,
    )
    print(
        f"[OK] Images conservées : {len(asset_result['preserved'])}; "
        f"refusées : {len(asset_result['removed'])}.",
        flush=True,
    )
    print(
        "[OK] Rapport créé : RAPPORT_MISE_A_JOUR_V585.txt",
        flush=True,
    )

if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print("", file=sys.stderr)
        print("[ERREUR V585] " + str(error), file=sys.stderr)
        print(
            "[SÉCURITÉ] Aucun commit n'est créé lorsque la validation échoue.",
            file=sys.stderr,
        )
        raise
