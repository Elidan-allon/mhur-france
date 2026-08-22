#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path
from typing import Any


def clean(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def norm(value: Any) -> str:
    value = unicodedata.normalize("NFD", clean(value))
    value = "".join(
        ch for ch in value
        if unicodedata.category(ch) != "Mn"
    )
    return re.sub(
        r"[^a-z0-9]+",
        "_",
        value.lower().replace("'", ""),
    ).strip("_")


def load_json(path: Path, fallback: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback


def write_json(path: Path, value: Any) -> None:
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )


root = Path("public")
home_path = root / "data/home_data.json"
home_js_path = root / "data/home_data.js"
payload_path = root / "data/ultrarumble/site_data_latest.json"
local_map_path = root / "data/local_style_map.json"

home = load_json(home_path, {})
payload = load_json(payload_path, {})
local_map = load_json(local_map_path, [])

if not isinstance(home, dict):
    raise SystemExit("[V44][ERREUR] home_data.json invalide")

if not isinstance(payload, dict):
    raise SystemExit("[V44][ERREUR] site_data_latest.json invalide")


def is_twice_support(row: dict[str, Any]) -> bool:
    if norm(row.get("base_name") or row.get("name")) != "twice":
        return False

    names = " ".join(
        norm(
            ((row.get("skills") or {}).get(symbol) or {}).get("name")
        )
        for symbol in ("α", "β", "γ")
    )

    return (
        norm(row.get("role")) == "support"
        or "critical_tape_measure" in names
        or "sad_man_s_parade" in names
        or "help_duplicate" in names
    )


# ------------------------------------------------
# Resolve the real Twice Support exact row.
# ------------------------------------------------
exact_by_style = payload.get("exact_by_style") or {}
characters = payload.get("characters") or []

style_id = clean((payload.get("meta") or {}).get("v38_style_key"))
remote = None

if style_id and isinstance(exact_by_style.get(style_id), dict):
    candidate = exact_by_style[style_id]
    if is_twice_support(candidate):
        remote = candidate

if remote is None:
    for key, row in exact_by_style.items():
        if isinstance(row, dict) and is_twice_support(row):
            style_id = str(key)
            remote = row
            break

if remote is None:
    for row in characters:
        if isinstance(row, dict) and is_twice_support(row):
            remote = row
            break

# local_style_map is a useful fallback for the local style id.
if not style_id and isinstance(local_map, list):
    for row in local_map:
        if not isinstance(row, dict):
            continue

        if norm(row.get("character_name")) != "twice":
            continue

        if (
            norm(row.get("role")) == "support"
            or norm(row.get("style_name")) in {
                "sad_man_s_parade",
                "parade_miserable",
            }
        ):
            style_id = clean(row.get("style_key"))
            if style_id:
                break

generated_styles = payload.get("generated_styles") or {}
style = (
    generated_styles.get(style_id)
    if style_id and isinstance(generated_styles.get(style_id), dict)
    else {}
)

# ------------------------------------------------
# Best portrait:
# 1. generated local style portrait
# 2. exact UltraRumble portrait
# 3. already-downloaded S18 Twice art as last fallback
# ------------------------------------------------
portrait = clean(style.get("portrait"))

if not portrait and isinstance(remote, dict):
    portrait = clean((remote.get("assets") or {}).get("portrait"))

if not portrait:
    portrait = "assets/home/season18/twice_s18_portrait.webp"


# ------------------------------------------------
# A. HOME RELEASE: Twice is released now.
# ------------------------------------------------
releases = home.get("latest_releases")

if not isinstance(releases, list):
    releases = []

twice_release = next(
    (
        row for row in releases
        if isinstance(row, dict)
        and norm(row.get("title")) == "twice"
    ),
    None,
)

if twice_release is None:
    twice_release = {
        "title": "Twice",
        "release_kind": "style",
    }
    releases.insert(0, twice_release)

twice_release.update({
    "title": "Twice",
    "subtitle": "Sad Man's Parade",
    "subtitle_fr": "Parade misérable · Soutien",
    "subtitle_en": "Sad Man's Parade · Support",
    "character_id": "twice",
    "style_id": style_id,
    "release_kind": "style",
    "releaseDate": "2026-08-19T13:00:00+09:00",
    "art": portrait,
    "word": "NEW!",
})

home["latest_releases"] = releases[:12]


# ------------------------------------------------
# B. ENTRY COST DISCOUNT:
# the source may expose only a decorative frame for a new style.
# Replace it with the real Twice Support style info.
# ------------------------------------------------
discounts = home.get("discounts")

if not isinstance(discounts, list):
    discounts = []

target = next(
    (
        row for row in discounts
        if isinstance(row, dict)
        and (
            norm(
                row.get("name")
                or row.get("name_fr")
                or row.get("name_en")
            ) in {
                "sad_mans_parade",
                "sad_man_s_parade",
                "parade_miserable",
            }
            or re.search(
                r"Sad Man['’]s Parade|Parade misérable",
                str(
                    row.get("name")
                    or row.get("name_fr")
                    or row.get("name_en")
                    or ""
                ),
                re.I,
            )
        )
    ),
    None,
)

if target is not None:
    target.update({
        "name": "Parade misérable",
        "name_fr": "Parade misérable",
        "name_en": "Sad Man's Parade",
        "character": "Twice",
        "role": "support",
        "style": "Support",
        "style_id": style_id,
        "image": portrait,
    })

home["discounts"] = discounts

home.setdefault("meta", {})["v44_finalized"] = True
home["meta"]["v44_twice_style_id"] = style_id
home["meta"]["v44_twice_portrait"] = portrait

write_json(home_path, home)

home_js_path.write_text(
    "window.MHUR_HOME_DATA = "
    + json.dumps(home, ensure_ascii=False, separators=(",", ":"))
    + ";\n",
    encoding="utf-8",
    newline="\n",
)

print("[V44][OK] Accueil Twice finalisé en NEW.")
if target is not None:
    print(
        "[V44][OK] Réduction Parade misérable finalisée : "
        f"style_id={style_id or '(runtime)'} / portrait={portrait}"
    )
else:
    print(
        "[V44][INFO] Parade misérable n'est pas dans la vague "
        "de réductions actuelle : aucune carte forcée."
    )
