#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import annotations

import argparse, copy, json, re, time, unicodedata, hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://ultrarumble.com"
# Costume names are fetched from the official French mirror. The costume IDs,
# photos and T.U.N.I.N.G data are identical to the English site, while the
# French titles match the labels already used by the local site.
COSTUME_BASE_URL = "https://fr.ultrarumble.com"
COSTUME_FALLBACK_BASE_URL = "https://ultrarumble.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.7",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}
ROLE_MAP = {"speed": "rapid", "rapid": "rapid", "strike": "strike", "assault": "assault", "technical": "technical", "support": "support"}

def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", str(s or ""))
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = s.lower().replace("’", "").replace("'", "")
    s = re.sub(r"[^a-z0-9]+", "_", s)
    return s.strip("_")

def clean(s: str) -> str:
    return re.sub(r"\s+", " ", str(s or "")).strip()

RETRYABLE_HTTP_STATUS = {408, 425, 429, 500, 502, 503, 504}

def request_with_retries(
    session: requests.Session,
    url: str,
    *,
    timeout: int = 45,
    headers: Optional[Dict[str, str]] = None,
    attempts: int = 6,
    label: str = "request",
) -> requests.Response:
    """Perform a polite GET with retries for temporary server/network failures.

    UltraRumble occasionally closes a connection while many costume pages or
    images are checked. Those temporary failures must never abort the whole
    repair. Permanent errors such as 404 are still reported immediately.
    """
    last_error: Optional[BaseException] = None
    for attempt in range(1, max(1, attempts) + 1):
        try:
            time.sleep(0.16)
            response = session.get(url, timeout=timeout, headers=headers or HEADERS)
            if response.status_code in RETRYABLE_HTTP_STATUS and attempt < attempts:
                retry_after = response.headers.get("Retry-After", "").strip()
                try:
                    wait = max(float(retry_after), min(8.0, 1.0 * (2 ** (attempt - 1))))
                except ValueError:
                    wait = min(8.0, 1.0 * (2 ** (attempt - 1)))
                print(f"[NETWORK RETRY] {label} attempt {attempt}/{attempts} status={response.status_code}; wait={wait:.1f}s", flush=True)
                response.close()
                time.sleep(wait)
                continue
            response.raise_for_status()
            return response
        except requests.RequestException as exc:
            last_error = exc
            status = getattr(getattr(exc, "response", None), "status_code", None)
            retryable = status in RETRYABLE_HTTP_STATUS or status is None
            if attempt >= attempts or not retryable:
                raise
            wait = min(8.0, 1.0 * (2 ** (attempt - 1)))
            if isinstance(exc, requests.ConnectionError):
                # Drop stale pooled connections before the next attempt.
                session.close()
            print(f"[NETWORK RETRY] {label} attempt {attempt}/{attempts}: {exc}; wait={wait:.1f}s", flush=True)
            time.sleep(wait)
    if isinstance(last_error, BaseException):
        raise last_error
    raise requests.ConnectionError(f"Unable to fetch {url}")

def fetch(session: requests.Session, url: str) -> str:
    response = request_with_retries(session, url, timeout=45, headers=HEADERS, attempts=6, label="page")
    return response.text

def soup_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    return "\n".join(clean(x) for x in soup.get_text("\n").splitlines() if clean(x))

def lines_from_text(txt: str) -> List[str]:
    return [clean(x) for x in txt.splitlines() if clean(x)]

def links_from(html: str, pat: str) -> List[str]:
    soup = BeautifulSoup(html, "html.parser")
    rg = re.compile(pat)
    out = []
    for a in soup.find_all("a", href=True):
        if rg.search(a["href"]):
            out.append(urljoin(BASE_URL, a["href"]))
    def key(u: str) -> Tuple[int, int]:
        m = re.search(r"/character/(\d+)", u)
        code = int(m.group(1)) if m else 999999999
        return code, character_variant_index(u)
    return sorted(set(out), key=key)

def is_fake_tuning_skill(name: str) -> bool:
    n = clean(name)
    return bool(re.search(r"(Attack Power|Defense|Reload|Speed|GP Recovery|HP Recovery|Damage Reduction|Recovery Speed|Revive Speed)\+$", n, re.I))

def parse_stats(txt: str) -> Dict[str, Any]:
    lines = lines_from_text(txt)
    stats: Dict[str, Any] = {}
    if "STATS" not in lines:
        return stats
    i = lines.index("STATS") + 1
    while i < len(lines):
        line = lines[i]
        if line.startswith("Quirk Skill") or line.startswith("Special Action") or line == "Tuning Skills":
            break
        m = re.match(r"(.+?)\s+(-?\d+(?:[.,]\d+)?)$", line)
        if m:
            raw = m.group(2).replace(",", ".")
            stats[clean(m.group(1))] = float(raw) if "." in raw else int(raw)
        elif i + 1 < len(lines) and re.match(r"^-?\d+(?:[.,]\d+)?$", lines[i+1]):
            raw = lines[i+1].replace(",", ".")
            stats[clean(line)] = float(raw) if "." in raw else int(raw)
            i += 1
        i += 1
    return stats

def parse_role(txt: str) -> str:
    for line in lines_from_text(txt):
        low = line.lower()
        if low in {"assault", "strike", "rapid", "technical", "support"}:
            return low
    return ""

def find_skill_section(txt: str, sym: str) -> tuple[str, str, str]:
    """Return (name, description, section_text) for the real Quirk Skill sym."""
    matches = list(re.finditer(rf"Quirk Skill\s*{re.escape(sym)}\s+([^\n]+)", txt, re.I))
    for m in matches:
        name = clean(m.group(1))
        if is_fake_tuning_skill(name):
            continue
        # Skip tuning section occurrences if possible.
        before = txt[max(0, m.start()-900):m.start()]
        after_until_next = txt[m.end():]
        next_m = re.search(r"\n(?:Quirk Skill\s*[αβγ]|Special Action|Tuning Skills|STATS|Obtained From)\b", after_until_next, re.I)
        end = m.end() + (next_m.start() if next_m else min(len(after_until_next), 6000))
        section = txt[m.start():end]
        desc = ""
        lines = lines_from_text(section)
        for line in lines[1:12]:
            if line == "Image":
                continue
            if line.startswith("##") or line.startswith("Skill Level") or line.startswith("Base ") or line.startswith("Additional "):
                break
            if line.startswith("Quirk Skill") or is_fake_tuning_skill(line):
                continue
            desc = line
            break
        if "Tuning Skills" not in before[-300:] or len(matches) == 1:
            return name, desc, section
    # fallback
    if matches:
        m = matches[0]
        name = clean(m.group(1))
        return name, "", txt[m.start():m.start()+5000]
    return "", "", ""

def parse_level_effects(section: str) -> Dict[str, Any]:
    m = re.search(r"Skill Level Up Effects\s*Level\s+Level Up Effect\s*(.*?)(?:\n\s*##\s*Base|\n\s*Base\s*[αβγ]|\n\s*Additional|\n\s*Quirk Skill|\n\s*Special Action|$)", section, re.S | re.I)
    if not m:
        return {"columns": [], "rows": []}
    body = m.group(1)
    rows = []
    for line in lines_from_text(body):
        mm = re.match(r"^(Lv\.\d+)\s+(.+)$", line)
        if mm:
            rows.append([mm.group(1), mm.group(2)])
    return {"columns": ["Level", "Level Up Effect"], "rows": rows}

def parse_base_values(section: str, sym: str) -> Dict[str, Any]:
    # Supports both web-rendered rows and BeautifulSoup cell-per-line text.
    rg = re.compile(rf"(?:##[^\n]*?)?Base\s*{re.escape(sym)}\s*Values[^\n]*?\s*Level\s+Damage\s+Ammo\s+Use Ammo\s+Reload\s+Down Power\s*(.*?)(?:\n\s*(?:##[^\n]*?)?(?:Additional\s*{re.escape(sym)}|Quirk Skill|Special Action|STATS|Tuning Skills)|$)", re.S | re.I)
    m = rg.search(section)
    if not m:
        m = re.search(r"(?:##[^\n]*?)?Base\s*[αβγ]\s*Values[^\n]*?\s*Level\s+Damage\s+Ammo\s+Use Ammo\s+Reload\s+Down Power\s*(.*?)(?:\n\s*(?:##[^\n]*?)?(?:Additional|Quirk Skill|Special Action|STATS|Tuning Skills)|$)", section, re.S | re.I)
    if not m:
        return {"columns": [], "rows": []}
    body = m.group(1)
    rows = []
    cells = lines_from_text(body)

    # Row-per-line format.
    for line in cells:
        mm = re.match(r"^(Lv\.\d+)\s+(-?\d+(?:\.\d+)?)\s+(x?\d+)\s+(x?\d+)\s+([0-9.]+s)\s+(-?\d+(?:\.\d+)?)$", line)
        if mm:
            rows.append([mm.group(1), mm.group(2), mm.group(3), mm.group(4), mm.group(5), mm.group(6)])

    # Cell-per-line format.
    if not rows:
        i = 0
        while i < len(cells):
            if re.match(r"^Lv\.\d+$", cells[i]) and i + 5 < len(cells):
                rows.append([cells[i], cells[i+1], cells[i+2], cells[i+3], cells[i+4], cells[i+5]])
                i += 6
            else:
                i += 1

    return {"columns": ["Level", "Damage", "Ammo", "Use Ammo", "Reload", "Down Power"], "rows": rows}

def parse_additional_values(section: str, sym: str) -> Dict[str, Any]:
    # Supports both row-per-line and cell-per-line text.
    rg = re.compile(rf"(?:##[^\n]*?)?Additional\s*{re.escape(sym)}.*?Values[^\n]*?\s*Type\s+Level\s+Damage\s+Down Power\s*(.*?)(?:\n\s*(?:##[^\n]*?)?(?:Quirk Skill|Special Action|STATS|Tuning Skills|Base\s*[αβγ]|Additional\s*[αβγ])|$)", re.S | re.I)
    m = rg.search(section)
    if not m:
        base_end = re.search(r"(?:##[^\n]*?)?Base\s*[αβγ]\s*Values[\s\S]*?(?:Lv\.9[^\n]*\n)", section, re.I)
        search_area = section[base_end.end():] if base_end else section
        m = re.search(r"Type\s+Level\s+Damage\s+Down Power\s*(.*?)(?:\n\s*(?:##[^\n]*?)?(?:Quirk Skill|Special Action|STATS|Tuning Skills|Base\s*[αβγ]|Additional\s*[αβγ])|$)", search_area, re.S | re.I)
    if not m:
        return {"columns": [], "rows": []}
    body = m.group(1)
    rows = []
    cells = lines_from_text(body)

    # Row-per-line format.
    for line in cells:
        mm = re.match(r"^(.+?)\s+(Lv\.\d+)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)$", line)
        if mm:
            rows.append([clean(mm.group(1)), mm.group(2), mm.group(3), mm.group(4)])

    # Cell-per-line format. Type may be one or more cells before Lv.X.
    if not rows:
        i = 0
        current_type = None
        type_parts = []
        while i < len(cells):
            cell = cells[i]
            if re.match(r"^Lv\.\d+$", cell):
                if i + 2 < len(cells):
                    t = clean(" ".join(type_parts)) or current_type or "Value"
                    current_type = t
                    rows.append([t, cell, cells[i+1], cells[i+2]])
                    type_parts = []
                    i += 3
                    continue
            else:
                if cell not in {"Type", "Level", "Damage", "Down Power"}:
                    type_parts.append(cell)
            i += 1

    return {"columns": ["Type", "Level", "Damage", "Down Power"], "rows": rows}

def parse_special_values(txt: str) -> Dict[str, Any]:
    m = re.search(r"Special Values\s*Ammo\s+Use Ammo\s+Reload\s*(x?\d+)\s+(x?\d+)\s+([0-9.]+s)", txt, re.S | re.I)
    if not m:
        return {"columns": [], "rows": []}
    return {"columns": ["Ammo", "Use Ammo", "Reload"], "rows": [[m.group(1), m.group(2), m.group(3)]]}

def character_variant_index(url: str) -> int:
    m = re.search(r"#Variant-(\d+)", str(url or ""), re.I)
    return int(m.group(1)) if m else 0


def extract_character_variant_text(full_text: str, url: str) -> str:
    """Return only the requested battle-style section from a character page.

    UltraRumble puts every style of a character in the same HTML document and
    uses #Variant-N only in the browser. HTTP never sends URL fragments, so the
    old updater accidentally read the Original style for every alternative.
    This function selects the Nth STATS block and its surrounding section.
    """
    lines = lines_from_text(full_text)
    stats_positions = [i for i, line in enumerate(lines) if line == "STATS"]
    wanted = character_variant_index(url)
    if not stats_positions or wanted >= len(stats_positions):
        return full_text

    stats_at = stats_positions[wanted]
    start = max(0, stats_at - 120)
    for i in range(stats_at - 1, max(-1, stats_at - 180), -1):
        if lines[i] == "Obtained From":
            start = max(0, i - 3)
            break

    end = len(lines)
    if wanted + 1 < len(stats_positions):
        next_stats = stats_positions[wanted + 1]
        end = next_stats
        for i in range(next_stats - 1, stats_at, -1):
            if lines[i] == "Obtained From":
                end = max(stats_at + 1, i - 3)
                break
    return "\n".join(lines[start:end])


def character_style_header(section_text: str, base_name: str) -> Tuple[str, str]:
    lines = lines_from_text(section_text)
    obtained = lines.index("Obtained From") if "Obtained From" in lines else min(len(lines), 30)
    candidates: List[str] = []
    bn = norm(base_name)
    for line in lines[:obtained]:
        n = norm(line)
        if bn and (n == bn or n.startswith(bn + "_")) and "costumes" not in n and "assets" not in n:
            candidates.append(line)
    header = candidates[-1] if candidates else base_name
    m = re.search(r"\(([^()]+)\)\s*$", header)
    style_name = clean(m.group(1)) if m else "Original"
    return header, style_name


def parse_character_tunings(section_text: str) -> Tuple[List[Dict[str, str]], Dict[str, str]]:
    lines = lines_from_text(section_text)
    try:
        tuning_i = lines.index("Tuning Skills")
    except ValueError:
        return [], {}
    try:
        special_i = lines.index("Special Tuning Skill", tuning_i + 1)
    except ValueError:
        special_i = len(lines)
    try:
        stats_i = lines.index("STATS", special_i + 1)
    except ValueError:
        stats_i = len(lines)

    normal_raw = [x for x in lines[tuning_i + 1:special_i] if x not in {"* * *", "Image"}]
    normal: List[Dict[str, str]] = []
    for i in range(0, len(normal_raw) - 1, 2):
        normal.append({"name": normal_raw[i], "description": normal_raw[i + 1]})

    special_raw = [x for x in lines[special_i + 1:stats_i] if x not in {"* * *", "Image"}]
    special: Dict[str, str] = {}
    if special_raw:
        special = {
            "name": special_raw[0],
            "description": special_raw[1] if len(special_raw) > 1 else "",
        }
    return normal[:2], special


def canonical_character_source_url(url: str) -> str:
    m = re.search(r"/character/0*(\d+)", str(url or ""), re.I)
    if not m:
        return str(url or "")
    fragment = urlparse(str(url or "")).fragment
    suffix = f"#{fragment}" if fragment else ""
    return f"{BASE_URL}/character/{int(m.group(1))}{suffix}"


def tuning_card_sections(html: str) -> Dict[str, Dict[str, str]]:
    """Return character-card text from the Normal and Special tuning sections."""
    soup = BeautifulSoup(html, "html.parser")
    out: Dict[str, Dict[str, str]] = {"normal": {}, "special": {}}
    for heading in soup.find_all(["h1", "h2", "h3", "h4"]):
        title = norm(heading.get_text(" "))
        if "normal_t_u_n_i_n_g_slots" in title or ("normal" in title and "t_u_n_i_n_g" in title):
            mode = "normal"
        elif "special_t_u_n_i_n_g_slots" in title or ("special" in title and "t_u_n_i_n_g" in title):
            mode = "special"
        else:
            continue
        for node in heading.find_all_next():
            if node is not heading and node.name in {"h1", "h2", "h3", "h4"}:
                break
            if node.name != "a" or not node.get("href"):
                continue
            href = str(node.get("href") or "")
            if not re.search(r"/character/\d+", href):
                continue
            text = clean(node.get_text(" "))
            if "Level 1:" not in text:
                continue
            key = canonical_character_source_url(urljoin(BASE_URL, href))
            if key in out[mode] and out[mode][key] != text:
                key = f"{key}@@{len(out[mode])}"
            out[mode][key] = text
    return out


def tuning_card_for_row(card_map: Dict[str, str], row: Dict[str, Any]) -> str:
    key = canonical_character_source_url(str(row.get("source_url") or ""))
    base = norm(row.get("base_name") or row.get("name") or "")
    style = norm(row.get("style_name") or "Original")
    exact = card_map.get(key, "")
    if exact:
        exact_norm = norm(exact)
        if style in {"", "original"} or style in exact_norm:
            return exact
    candidates: List[str] = []
    for text in card_map.values():
        n = norm(text)
        if base and base not in n:
            continue
        if style not in {"", "original"} and style not in n:
            continue
        if style in {"", "original"} and base and n.startswith(base + "_"):
            # Reject an alternative card such as "Name (Style)" for Original.
            opening = clean(text)[len(clean(row.get("base_name") or row.get("name") or "")):].lstrip()
            if opening.startswith("("):
                continue
        candidates.append(text)
    return candidates[0] if candidates else exact


def tuning_levels_from_segment(segment: str) -> List[str]:
    levels: List[str] = []
    pattern = re.compile(r"(Level\s+\d+|Sub\s+Effect\s+\d+)\s*:\s*([^\s]+)", re.I)
    for label, value in pattern.findall(segment or ""):
        number = re.search(r"\d+", label)
        if not number:
            continue
        prefix = "Sub Effect" if "sub" in label.lower() else "Lv."
        spacer = " " if prefix == "Sub Effect" else ""
        levels.append(f"{prefix}{spacer}{number.group(0)} : {value}")
    return levels


def enrich_character_tuning_levels(session: requests.Session, chars: List[Dict[str, Any]]) -> Dict[str, int]:
    """Attach exact level values from /tuning to character rows.

    Existing hand-made T.U.N.I.N.G entries are not overwritten by the weekly
    updater. These values are used only when a new/generated style is created.
    """
    stats = {"normal_cards": 0, "special_cards": 0, "styles_enriched": 0}
    try:
        cards = tuning_card_sections(fetch(session, BASE_URL + "/tuning"))
    except Exception as exc:
        print(f"[TUNING WARNING] page globale indisponible: {exc}", flush=True)
        return stats
    stats["normal_cards"] = len(cards.get("normal", {}))
    stats["special_cards"] = len(cards.get("special", {}))

    for row in chars:
        key = canonical_character_source_url(str(row.get("source_url") or ""))
        changed = False
        normal_card = tuning_card_for_row(cards.get("normal", {}), row)
        normal = row.get("normal_tuning") or []
        if normal_card and normal:
            positions: List[Tuple[int, int]] = []
            for i, effect in enumerate(normal):
                name = str((effect or {}).get("name") or "")
                pos = normal_card.find(name) if name else -1
                if pos >= 0:
                    positions.append((pos, i))
            positions.sort()
            for n, (pos, effect_i) in enumerate(positions):
                end = positions[n + 1][0] if n + 1 < len(positions) else len(normal_card)
                levels = tuning_levels_from_segment(normal_card[pos:end])
                if levels:
                    normal[effect_i]["levels"] = levels
                    changed = True

        special_card = tuning_card_for_row(cards.get("special", {}), row)
        special = row.get("special_tuning") or {}
        if special_card and special.get("name"):
            pos = special_card.find(str(special.get("name")))
            segment = special_card[pos:] if pos >= 0 else special_card
            levels = tuning_levels_from_segment(segment)
            if levels:
                special["levels"] = levels
                changed = True
        if changed:
            stats["styles_enriched"] += 1
    print(
        f"[TUNING] cartes_normales={stats['normal_cards']} cartes_speciales={stats['special_cards']} "
        f"styles_avec_niveaux={stats['styles_enriched']}", flush=True,
    )
    return stats


def character_asset_urls(url: str, html: str) -> Dict[str, str]:
    """Find exact portrait/skill/tuning assets for the requested style."""
    m = re.search(r"/character/0*(\d+)", str(url or ""))
    if not m:
        return {}
    code = int(m.group(1))
    variant = character_variant_index(url)
    soup = BeautifulSoup(html, "html.parser")
    urls: List[str] = []
    for img in soup.find_all("img", src=True):
        raw = str(img.get("src") or "").replace("/character/assets/", "/assets/")
        full = urljoin(BASE_URL, raw)
        if full not in urls:
            urls.append(full)

    ch = f"Ch{code:03d}"
    var_dir = f"/Variation/Var{variant:02d}/" if variant else ""
    filtered: List[str] = []
    for asset in urls:
        path = urlparse(asset).path
        if ch.lower() not in path.lower():
            continue
        if variant:
            if var_dir.lower() not in path.lower() and f"_ch{code:03d}_{variant:02d}" not in path.lower():
                continue
        else:
            if "/Variation/" in path:
                continue
            mslot = re.search(rf"_ch{code:03d}_(\d\d)", path, re.I)
            if mslot and mslot.group(1) != "00":
                continue
        filtered.append(asset)

    out: Dict[str, str] = {}
    for asset in filtered:
        low = asset.lower()
        if "charaimage" in low and "portrait" not in out:
            out["portrait"] = asset
        elif "specialskill" in low and "special" not in out:
            out["special"] = asset
        elif "unique1" in low and "alpha" not in out:
            out["alpha"] = asset
        elif "unique2" in low and "beta" not in out:
            out["beta"] = asset
        elif "unique3" in low and "gamma" not in out:
            out["gamma"] = asset
        elif "roleslots" in low and "tuning" not in out:
            out["tuning"] = asset
    return out


def parse_character(url: str, html: str) -> Dict[str, Any]:
    full_txt = soup_text(html)
    txt = extract_character_variant_text(full_txt, url)
    soup = BeautifulSoup(html, "html.parser")
    title = clean(soup.title.get_text()) if soup.title else ""
    base_name = title.split(" - ")[0] if " - " in title else (lines_from_text(full_txt)[0] if lines_from_text(full_txt) else url)
    header, style_name = character_style_header(txt, base_name)

    skills: Dict[str, Any] = {}
    for sym in ["α", "β", "γ"]:
        sk_name, desc, section = find_skill_section(txt, sym)
        skills[sym] = {
            "name": sk_name,
            "description": desc,
            "level_up_effects": parse_level_effects(section),
            "base_values": parse_base_values(section, sym),
            "additional_values": parse_additional_values(section, sym),
        }

    normal_tuning, special_tuning = parse_character_tunings(txt)
    side = ""
    for line in lines_from_text(txt):
        if line in {"HERO", "VILLAIN"}:
            side = line.lower()
            break

    return {
        "source_url": url,
        "name": base_name,
        "base_name": base_name,
        "style_header": header,
        "style_name": style_name,
        "variant_index": character_variant_index(url),
        "side": side,
        "role": parse_role(txt),
        "stats": parse_stats(txt),
        "skills": skills,
        "special_action": {"values": parse_special_values(txt)},
        "normal_tuning": normal_tuning,
        "special_tuning": special_tuning,
        "assets": character_asset_urls(url, html),
    }


def load_local_styles(root: Path) -> List[Dict[str, Any]]:
    p = root / "data" / "local_style_map.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else []

def role_eq(a: str, b: str) -> bool:
    return ROLE_MAP.get(norm(a), norm(a)) == ROLE_MAP.get(norm(b), norm(b))

def match_score(local: Dict[str, Any], remote: Dict[str, Any]) -> int:
    if local.get("source_url") and str(local.get("source_url")) == str(remote.get("source_url")):
        return 100000
    blob = norm(" ".join([
        remote.get("name", ""),
        remote.get("base_name", ""),
        remote.get("style_name", ""),
        remote.get("style_header", ""),
        remote.get("source_url", ""),
        remote.get("role", ""),
        " ".join((remote.get("skills") or {}).get(k, {}).get("name", "") for k in ["α", "β", "γ"]),
    ]))
    s = 0
    cname = norm(local.get("character_name", ""))
    if cname and cname in blob:
        s += 500
    if role_eq(local.get("role", ""), remote.get("role", "")):
        s += 250
    style_name = norm(local.get("style_name", ""))
    if style_name and style_name not in {"original", "ofa"} and style_name in blob:
        s += 80
    style_key = norm(local.get("style_key", ""))
    if style_key and style_key in blob:
        s += 40
    return s

def local_skill_names(row: Dict[str, Any]) -> List[str]:
    values: List[str] = []
    for item in row.get("skill_names") or []:
        name = norm((item or {}).get("name", ""))
        if name:
            values.append(name)
    return values


def remote_skill_names(row: Dict[str, Any]) -> List[str]:
    values: List[str] = []
    for sym in ("α", "β", "γ"):
        name = norm(((row.get("skills") or {}).get(sym) or {}).get("name", ""))
        if name:
            values.append(name)
    return values


def remote_already_represented(remote: Dict[str, Any], local_rows: List[Dict[str, Any]]) -> bool:
    """Return True when a remote style is already present in the hand-made site.

    This deliberately uses several independent signals.  It prevents a
    translated style label from being mistaken for a brand-new style while
    still allowing a genuinely new battle style to be added later.
    """
    source_url = str(remote.get("source_url") or "")
    base = norm(remote.get("base_name") or remote.get("name") or "")
    rstyle = norm(remote.get("style_name") or "")
    rrole = ROLE_MAP.get(norm(remote.get("role", "")), norm(remote.get("role", "")))
    rskills = set(remote_skill_names(remote))
    for local in local_rows:
        if source_url and str(local.get("source_url") or "") == source_url:
            return True
        lname = norm(local.get("character_name") or "")
        if base and lname and not (base == lname or base in lname or lname in base):
            continue
        lstyle = norm(local.get("style_name") or "")
        lrole = ROLE_MAP.get(norm(local.get("role", "")), norm(local.get("role", "")))
        lskills = set(local_skill_names(local))
        if rstyle and lstyle and rstyle == lstyle and (not rrole or not lrole or rrole == lrole):
            return True
        if rskills and lskills and len(rskills & lskills) >= 2:
            return True
        # Original styles are uniquely identified by character + role.
        if rstyle in {"", "original"} and lstyle in {"", "original"} and rrole and rrole == lrole:
            return True
    return False


def build_exact_by_style(root: Path, chars: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Map local styles to remote styles one-to-one.

    The previous greedy matcher could attach the same Original remote row to
    several alternative styles.  Exact source URLs are reserved first, then
    the remaining rows are matched by the strongest score without reusing a
    remote style.
    """
    local_rows = load_local_styles(root)
    out: Dict[str, Any] = {}
    unused = set(range(len(chars)))

    # Reserve explicit source URLs first. Generated entries always have one,
    # and future weekly runs must remain stable.
    for local in local_rows:
        source_url = str(local.get("source_url") or "")
        if not source_url:
            continue
        for i in list(unused):
            if str(chars[i].get("source_url") or "") == source_url:
                out[str(local.get("style_key"))] = chars[i]
                unused.remove(i)
                break

    # Match the most distinctive local styles first (those with more skill
    # names), which makes translated role/style names much less ambiguous.
    remaining = [x for x in local_rows if str(x.get("style_key")) not in out]
    remaining.sort(key=lambda x: (len(local_skill_names(x)), bool(x.get("style_name"))), reverse=True)
    for local in remaining:
        best_i, best_score = None, -1
        for i in unused:
            sc = match_score(local, chars[i])
            # Skill overlap is the strongest language-independent signal.
            overlap = len(set(local_skill_names(local)) & set(remote_skill_names(chars[i])))
            sc += overlap * 400
            if sc > best_score:
                best_i, best_score = i, sc
        if best_i is not None and best_score >= 500:
            out[str(local.get("style_key"))] = chars[best_i]
            unused.remove(best_i)
    return out


def health_from_stats(stats: Dict[str, Any]) -> Any:
    for key in ("Max Main Health", "Max Health", "Max HP", "Main Health", "HP"):
        if stats.get(key) not in (None, ""):
            return stats.get(key)
    return "À compléter"


def local_table(title: str, table: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not isinstance(table, dict) or not table.get("rows"):
        return None
    return {"title": title, "cols": table.get("columns", []), "rows": table.get("rows", [])}


def generated_style_payload(style_key: str, row: Dict[str, Any], paths: Dict[str, str]) -> Dict[str, Any]:
    role = ROLE_MAP.get(norm(row.get("role", "")), row.get("role", "support"))
    skills = []
    for sym, asset_key in (("α", "alpha"), ("β", "beta"), ("γ", "gamma")):
        remote = (row.get("skills") or {}).get(sym) or {}
        tables = []
        for title, key in ((f"Effets de montée {sym}", "level_up_effects"),
                           (f"Valeurs {sym}", "base_values"),
                           (f"Valeurs supplémentaires {sym}", "additional_values")):
            tb = local_table(title, remote.get(key) or {})
            if tb:
                tables.append(tb)
        skills.append({
            "letter": sym,
            "name": remote.get("name") or f"Alter {sym}",
            "img": paths.get(asset_key, ""),
            "desc": {"fr": remote.get("description") or "", "en": remote.get("description") or ""},
            "tables": tables,
        })
    special_tables = []
    tb = local_table("Valeurs Action spéciale", (row.get("special_action") or {}).get("values") or {})
    if tb:
        special_tables.append(tb)
    return {
        "name": {"fr": row.get("style_name") or "Original", "en": row.get("style_name") or "Original"},
        "role": role,
        "portrait": paths.get("portrait", ""),
        "pv": health_from_stats(row.get("stats") or {}),
        "description": {"fr": f"Données mises à jour automatiquement depuis UltraRumble pour {row.get('base_name') or row.get('name') or 'ce personnage'}.", "en": "Automatically updated data."},
        "roleDesc": {"fr": "Données du rôle mises à jour automatiquement.", "en": "Automatically updated role data."},
        "special": {
            "name": {"fr": "Action spéciale", "en": "Special Action"},
            "img": paths.get("special", ""),
            "desc": {"fr": "Consulte les valeurs ci-dessous.", "en": "See values below."},
            "tables": special_tables,
        },
        "skills": skills,
        "__generated": True,
        "__sourceUrl": row.get("source_url", ""),
    }


def generated_tuning_payload(row: Dict[str, Any], paths: Dict[str, str]) -> List[Dict[str, Any]]:
    role = ROLE_MAP.get(norm(row.get("role", "")), row.get("role", "support"))
    out: List[Dict[str, Any]] = []
    special = row.get("special_tuning") or {}
    if special.get("name"):
        out.append({
            "role": role, "img": paths.get("tuning", ""), "type": "SP",
            "name": special.get("name"), "desc": special.get("description", ""), "levels": special.get("levels", []),
        })
    normal = row.get("normal_tuning") or []
    if normal:
        out.append({
            "role": role, "type": "normal",
            "name": ", ".join(x.get("name", "") for x in normal if x.get("name")),
            "desc": "<br><br>".join(x.get("description", "") for x in normal if x.get("description")),
            "effects": [{"name": x.get("name", ""), "desc": x.get("description", ""), "levels": x.get("levels", [])} for x in normal],
        })
    return out


def download_character_asset(session: requests.Session, root: Path, url: str, rel: Path) -> str:
    if not url:
        return ""
    dst = root / rel
    if dst.exists() and dst.stat().st_size > 1000:
        return rel.as_posix()
    dst.parent.mkdir(parents=True, exist_ok=True)
    headers = dict(HEADERS)
    headers["Accept"] = "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
    try:
        response = request_with_retries(session, url, timeout=45, headers=headers, attempts=4, label="character asset")
        content = response.content
        response.close()
        if len(content) < 1000:
            return ""
        dst.write_bytes(content)
        return rel.as_posix()
    except Exception as exc:
        print(f"[CHARACTER ASSET WARNING] {url}: {exc}", flush=True)
        return ""


def ensure_generated_characters(root: Path, session: requests.Session, chars: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Create generic local entries only for genuinely new styles/characters.

    Existing hand-made character/style entries are never rewritten here.
    """
    map_path = root / "data" / "local_style_map.json"
    local_rows = load_local_styles(root)
    # Character 201 is the existing playable Young All For One. Never create a
    # second generated character/style for the English label “Youth age”.
    local_rows = [x for x in local_rows if x.get("style_key") != "all_for_one_youth_age_youth_age" and x.get("character_id") != "all_for_one_youth_age"]
    for x in local_rows:
        if x.get("style_key") == "all_for_one_young_assault":
            x["source_url"] = f"{BASE_URL}/character/201"
            x.pop("generated", None)
    map_path.write_text(json.dumps(local_rows, ensure_ascii=False, indent=2), encoding="utf-8")
    exact_before = build_exact_by_style(root, chars)
    used_urls = {str(x.get("source_url") or "") for x in exact_before.values()}
    by_name = {norm(x.get("character_name", "")): x.get("character_id", "") for x in local_rows if x.get("character_name") and x.get("character_id")}
    existing_keys = {str(x.get("style_key") or "") for x in local_rows}
    added = 0

    for row in chars:
        source_url = str(row.get("source_url") or "")
        if source_url in used_urls or remote_already_represented(row, local_rows):
            continue
        if not any(((row.get("skills") or {}).get(sym) or {}).get("name") for sym in ("α", "β", "γ")):
            continue
        base_name = clean(row.get("base_name") or row.get("name") or "")
        if not base_name:
            continue
        is_young_afo = bool(re.search(r"/character/201(?:#|$)", source_url)) or ("all_for_one" in norm(base_name) and any(x in norm(base_name) for x in ("young", "youth", "jeune")))
        if is_young_afo:
            # The hand-made site already contains this character and style.
            existing = next((x for x in local_rows if x.get("style_key") == "all_for_one_young_assault"), None)
            if existing is not None:
                existing["source_url"] = source_url or f"{BASE_URL}/character/201"
                used_urls.add(source_url)
                continue
        char_id = by_name.get(norm(base_name)) or norm(base_name)
        role = ROLE_MAP.get(norm(row.get("role", "")), norm(row.get("role", "")) or "support")
        style_name = clean(row.get("style_name") or "Original")
        preferred_key = f"{char_id}_{role}" if norm(style_name) == "original" else f"{char_id}_{norm(style_name)}"
        style_key = preferred_key
        suffix = 2
        while style_key in existing_keys:
            placeholder = next((x for x in local_rows if x.get("style_key") == style_key), None)
            if placeholder and not placeholder.get("character_name"):
                break
            style_key = f"{preferred_key}_{suffix}"
            suffix += 1

        skill_names = [{"letter": sym, "name": ((row.get("skills") or {}).get(sym) or {}).get("name", "")} for sym in ("α", "β", "γ")]
        pv = health_from_stats(row.get("stats") or {})
        record = next((x for x in local_rows if x.get("style_key") == style_key), None)
        values = {
            "style_key": style_key, "character_id": char_id, "character_name": base_name,
            "style_name": style_name, "role": role, "pv": pv,
            "skill_names": skill_names, "special_name": "Action spéciale",
            "source_url": source_url, "generated": True,
            "side": row.get("side") or "hero",
        }
        if record is None:
            local_rows.append(values)
        else:
            record.update(values)
        existing_keys.add(style_key)
        by_name[norm(base_name)] = char_id
        used_urls.add(source_url)
        added += 1
        print(f"[NEW STYLE] {base_name} / {style_name} -> {style_key}", flush=True)

    if added:
        map_path.write_text(json.dumps(local_rows, ensure_ascii=False, indent=2), encoding="utf-8")

    # Rebuild exact mapping after new rows were added, then generate the runtime
    # objects for every generated row so they persist on future weekly updates.
    exact = build_exact_by_style(root, chars)
    generated_styles: Dict[str, Any] = {}
    generated_tunings: Dict[str, Any] = {}
    generated_chars: Dict[str, Dict[str, Any]] = {}
    remote_by_url = {str(x.get("source_url") or ""): x for x in chars}
    for local in local_rows:
        if not local.get("generated"):
            continue
        style_key = str(local.get("style_key") or "")
        row = exact.get(style_key) or remote_by_url.get(str(local.get("source_url") or ""))
        if not style_key or not row:
            continue
        char_id = str(local.get("character_id") or norm(row.get("base_name") or row.get("name") or "character"))
        asset_urls = row.get("assets") or {}
        base_dir = Path("assets") / char_id / style_key
        paths = {
            key: download_character_asset(session, root, url, base_dir / f"{key}.png")
            for key, url in asset_urls.items()
        }
        generated_styles[style_key] = generated_style_payload(style_key, row, paths)
        generated_tunings[style_key] = generated_tuning_payload(row, paths)
        gc = generated_chars.setdefault(char_id, {
            "id": char_id,
            "name": row.get("base_name") or row.get("name") or char_id,
            "side": row.get("side") or local.get("side") or "hero",
            "portrait": paths.get("portrait", ""),
            "styles": [],
        })
        if style_key not in gc["styles"]:
            gc["styles"].append(style_key)
        if not gc.get("portrait") and paths.get("portrait"):
            gc["portrait"] = paths["portrait"]
    return {
        "exact": exact,
        "generated_styles": generated_styles,
        "generated_tunings": generated_tunings,
        "generated_characters": list(generated_chars.values()),
        "new_styles_added": added,
    }


def apply_index(root: Path, payload: Dict[str, Any]) -> None:
    idx = root / "index.html"
    text = idx.read_text(encoding="utf-8", errors="ignore")
    text = re.sub(r'<script id="ultrarumble-exact-data" type="application/json">[\s\S]*?</script><!-- /ultrarumble-exact-data -->\s*', "", text)
    block = '<script id="ultrarumble-exact-data" type="application/json">\n' + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + '\n</script><!-- /ultrarumble-exact-data -->\n'
    generated_marker = '<script id="v290-generated-character-bridge">'
    marker = generated_marker if generated_marker in text else '<script id="v253-robust-stats-patch">'
    if marker in text:
        text = text.replace(marker, block + marker, 1)
    elif "</body>" in text:
        text = text.replace("</body>", block + "</body>", 1)
    else:
        text += "\n" + block
    idx.write_text(text, encoding="utf-8")


def missing_skill_tables(c: Dict[str, Any]) -> bool:
    for sym in ["α", "β", "γ"]:
        sk = (c.get("skills") or {}).get(sym) or {}
        if not sk.get("base_values", {}).get("rows"):
            return True
        # Additional can be empty for some characters, so do not require it.
    return False

def candidate_locale_urls(url: str) -> List[str]:
    m = re.search(r"/character/(\d+)", url)
    if not m:
        return []
    n = int(m.group(1))
    ids = [str(n), f"{n:03d}"]
    fragment = urlparse(url).fragment
    suffix = f"#{fragment}" if fragment else ""
    hosts = ["https://ultrarumble.com", "https://es.ultrarumble.com", "https://de.ultrarumble.com", "https://it.ultrarumble.com"]
    out = []
    for host in hosts:
        for sid in ids:
            u = f"{host}/character/{sid}{suffix}"
            if u not in out and u != url:
                out.append(u)
    return out

def merge_missing_tables(dst: Dict[str, Any], src: Dict[str, Any]) -> bool:
    changed = False
    # Stats: keep existing unless missing.
    if not dst.get("stats") and src.get("stats"):
        dst["stats"] = src["stats"]
        changed = True
    else:
        for k, v in (src.get("stats") or {}).items():
            if k not in dst.get("stats", {}):
                dst.setdefault("stats", {})[k] = v
                changed = True

    for sym in ["α", "β", "γ"]:
        dsk = dst.setdefault("skills", {}).setdefault(sym, {})
        ssk = (src.get("skills") or {}).get(sym) or {}
        if not dsk.get("name") and ssk.get("name"):
            dsk["name"] = ssk["name"]
            changed = True
        if not dsk.get("description") and ssk.get("description"):
            dsk["description"] = ssk["description"]
            changed = True
        for key in ["level_up_effects", "base_values", "additional_values"]:
            if not dsk.get(key, {}).get("rows") and ssk.get(key, {}).get("rows"):
                dsk[key] = ssk[key]
                changed = True
    if not dst.get("special_action", {}).get("values", {}).get("rows") and src.get("special_action", {}).get("values", {}).get("rows"):
        dst["special_action"] = src["special_action"]
        changed = True
    return changed

def fill_missing_tables_from_locales(session: requests.Session, url: str, c: Dict[str, Any]) -> Dict[str, Any]:
    if not missing_skill_tables(c):
        return c
    for alt in candidate_locale_urls(url):
        try:
            alt_c = parse_character(alt, fetch(session, alt))
            merge_missing_tables(c, alt_c)
            if not missing_skill_tables(c):
                print(f"[OK] table fallback {alt}")
                break
        except Exception as e:
            print(f"[INFO] fallback skipped {alt}: {e}")
    return c


# ==================== COSTUME UPDATER v270 ====================
VARIANT_MAP = {
    "": "Original",
    "default": "Original",
    "villain style": "Super-vilain",
    "villain": "Super-vilain",
    "heat": "D'enfer",
    "combat": "Combat",
    "fancy": "Élégant",
    "dangerous": "Dangereux",
    "hero style": "Ver. Héros",
    "hero": "Ver. Héros",
    # French costume mirror suffixes.
    "par défaut": "Original",
    "super-vilain": "Super-vilain",
    "d'enfer": "D'enfer",
    "combat": "Combat",
    "élégant": "Élégant",
    "dangereux": "Dangereux",
    "ver. héros": "Ver. Héros",
}
VARIANT_RANK = {
    "Original": 0,
    "Super-vilain": 1,
    "Ver. Héros": 1,
    "D'enfer": 2,
    "Combat": 3,
    "Élégant": 4,
    "Dangereux": 5,
}
ROLE_COLOR = {
    "strike": "red",
    "assault": "yellow",
    "rapid": "cyan",
    "speed": "cyan",
    "technical": "violet",
    "support": "green",
}
# Exact character codes encoded in costume IDs. These four characters have
# names that are prefix/alias variants of another local character, so resolving
# them by text alone can silently merge two separate galleries.
SOURCE_CHARACTER_CODE_OVERRIDES = {
    1: "midoriya",
    16: "all_for_one",
    201: "all_for_one_young",
    202: "midoriya_ofa",
}

GROUP_ALIASES = {
    "hero_costume": ["tenue_de_heros", "costume_de_heros", "hero_costume"],
    "casual_wear": ["tenue_decontractee", "vetements_decontractes", "casual_wear"],
    "casual_style": ["style_decontracte", "casual_style"],
    "undefeatable": ["coeur_vaillant", "indomptable", "undefeatable"],
    "parallel_world": ["monde_parallele", "parallel_world"],
    "kung_fu_outfit": ["tenue_kung_fu", "costume_kung_fu", "kung_fu_outfit"],
    "old_uniform": ["ancien_uniforme", "vieil_uniforme", "old_uniform"],
    "full_cowling_100": ["revetement_integral_100", "full_cowling_100"],
    "festival_jinbei": ["jinbei_de_festival", "festival_jinbei"],
    "festival_outfit": ["tenue_de_festival", "festival_outfit"],
    "festival_yukata": ["yukata_de_festival", "festival_yukata"],
    "ua_track_suit": ["survetement_yuei", "survetement_ua", "ua_track_suit"],
    "shoot_style": ["shoot_style"],
    "cyber_hero_costume": ["costume_de_heros_cyber", "cyber_hero_costume"],
    "christmas_santa_costume": ["costume_du_pere_noel", "christmas_santa_costume"],
}

def costume_slug(s: str) -> str:
    return norm(s)

def costume_group_key(s: str) -> str:
    n = costume_slug(s)
    for eng, aliases in GROUP_ALIASES.items():
        if n == eng or n in aliases:
            return eng
    return n

def split_costume_title(title: str) -> Tuple[str, str]:
    title = clean(title)
    m = re.match(r"^(.*?)\s*\(([^()]*)\)\s*$", title)
    if not m:
        return title, "Original"
    base, suffix = clean(m.group(1)), clean(m.group(2))
    key = suffix.lower()
    if key in VARIANT_MAP:
        return base, VARIANT_MAP[key]
    # New color/event variants stay readable and in the source order.
    return base, suffix

def parse_costume_index(html: str) -> List[Dict[str, Any]]:
    soup = BeautifulSoup(html, "html.parser")
    out, seen = [], set()
    order = 0
    for a in soup.find_all("a", href=True):
        href = urljoin(COSTUME_BASE_URL, a.get("href", ""))
        m = re.search(r"/costume/(\d+)", href)
        if not m or m.group(1) in seen:
            continue
        seen.add(m.group(1))
        title = clean(a.get_text(" "))
        if not title:
            title = f"Costume {m.group(1)}"
        out.append({"ur_id": m.group(1), "url": href, "list_title": title, "source_order": order})
        order += 1
    return out


def costume_items_from_character_page(html: str, start_order: int) -> List[Dict[str, Any]]:
    """Read every costume observation from one character page.

    The same ID may already exist in the main /costumes list. This helper
    gathers link and image observations, but ``discover_all_costume_items`` only
    uses them to enrich IDs already present in the official catalogue. Internal
    character-page-only IDs are never promoted to costumes.
    """
    soup = BeautifulSoup(html, "html.parser")
    rows: Dict[str, Dict[str, Any]] = {}
    order = start_order

    def add(cid: str, title: str = "", image_hint: str = "") -> None:
        nonlocal order
        cid = str(cid or "")
        if not cid:
            return
        row = rows.get(cid)
        if row is None:
            row = {
                "ur_id": cid,
                "url": f"{COSTUME_BASE_URL}/costume/{cid}",
                "list_title": clean(title) or f"Costume {cid}",
                "source_order": order,
                "discovered_from": "character_page",
            }
            rows[cid] = row
            order += 1
        elif title and str(row.get("list_title") or "").startswith("Costume "):
            row["list_title"] = clean(title)
        if image_hint:
            row["image_url_hint"] = image_hint

    for a in soup.find_all("a", href=True):
        href = urljoin(COSTUME_BASE_URL + "/", a.get("href", ""))
        m = re.search(r"/costume/(\d+)", href)
        if m:
            add(m.group(1), a.get_text(" "))

    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src") or img.get("data-lazy-src") or ""
        m = re.search(r"T_ui_Thumb_4_(\d+)_(?:LL|L|S)\.(?:png|webp|jpg|jpeg)", src, re.I)
        if not m:
            continue
        # Costume pages sometimes expose a relative "assets/..." URL while the
        # browser page lives under /character/.  Force it to the site root.
        clean_src = str(src).replace("\\", "/")
        if re.match(r"^https?://", clean_src, re.I):
            full = clean_src
        else:
            full = urljoin(COSTUME_BASE_URL + "/", clean_src.lstrip("/"))
        full = re.sub(r"_(?:S|L)(\.(?:png|webp|jpg|jpeg))(?:\?.*)?$", r"_LL\1", full, flags=re.I)
        add(m.group(1), img.get("alt", ""), full)
    return sorted(rows.values(), key=lambda x: int(x.get("source_order", 0)))


def discover_all_costume_items(session: requests.Session, chars: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Build the official costume list and enrich it with character-page images.

    Only IDs published in the main ``/costumes`` catalogue are real remote
    costumes to verify. Character pages also expose internal/unpublished asset
    IDs; those observations may supply an image URL for an official row, but
    they must never become extra costumes or detail-page checks.
    """
    print("[COSTUMES] Lecture de la liste principale...", flush=True)
    items = parse_costume_index(fetch(session, COSTUME_BASE_URL + "/costumes"))
    by_id = {str(x.get("ur_id")): x for x in items}
    main_count = len(items)
    next_order = len(items)

    character_urls: List[str] = []
    seen_character_urls: set[str] = set()
    for c in chars:
        m = re.search(r"/character/(\d+)", str(c.get("source_url", "")))
        if not m:
            continue
        url = f"{COSTUME_BASE_URL}/character/{int(m.group(1))}"
        if url not in seen_character_urls:
            seen_character_urls.add(url)
            character_urls.append(url)

    ignored_character_only = enriched = 0

    def fetch_character_page(index_url: Tuple[int, str]) -> Tuple[int, str, str, str]:
        idx, url = index_url
        try:
            local_session = requests.Session()
            return idx, url, fetch(local_session, url), ""
        except Exception as exc:
            return idx, url, "", str(exc)

    fetched_pages: Dict[int, Tuple[str, str, str]] = {}
    if character_urls:
        with ThreadPoolExecutor(max_workers=8) as executor:
            futures = [executor.submit(fetch_character_page, pair) for pair in enumerate(character_urls)]
            done = 0
            for future in as_completed(futures):
                idx, url, html, error = future.result()
                fetched_pages[idx] = (url, html, error)
                done += 1
                if done % 10 == 0 or done == len(character_urls):
                    print(f"[COSTUMES DISCOVERY DOWNLOAD] personnages={done}/{len(character_urls)}", flush=True)

    # Merge in the original character order so new costume placement is stable.
    for idx in range(len(character_urls)):
        url, html, error = fetched_pages.get(idx, (character_urls[idx], "", "missing response"))
        if error:
            print(f"[COSTUMES DISCOVERY WARNING] {url}: {error}", flush=True)
            continue
        observations = costume_items_from_character_page(html, next_order)
        for extra in observations:
            rid = str(extra.get("ur_id") or "")
            existing = by_id.get(rid)
            if existing is None:
                # Character pages contain many internal asset IDs without a
                # published costume detail page. They are useful only as image
                # observations and are deliberately ignored as catalogue rows.
                ignored_character_only += 1
                continue
            changed = False
            hint = str(extra.get("image_url_hint") or "")
            if hint and existing.get("image_url_hint") != hint:
                existing["image_url_hint"] = hint
                changed = True
            if (not existing.get("list_title") or str(existing.get("list_title")).startswith("Costume ")) and extra.get("list_title"):
                existing["list_title"] = extra.get("list_title")
                changed = True
            if changed:
                existing["discovered_from"] = "main+character_page"
                enriched += 1

    items.sort(key=lambda x: int(x.get("source_order", 0)))
    print(
        f"[COSTUMES DISCOVERY DONE] official={len(items)} main={main_count} "
        f"character_only_ignored={ignored_character_only} enriched={enriched}", flush=True,
    )
    return items


def costume_variant_from_id(costume_id: str) -> str:
    """Infer only the universal final variant code used by costume assets."""
    try:
        suffix = int(str(costume_id)) % 100
    except (TypeError, ValueError):
        return ""
    return {0: "Original", 1: "Ver. Héros", 2: "Super-vilain", 3: "D'enfer", 4: "Combat", 5: "Élégant", 6: "Dangereux"}.get(suffix, "")


def costume_family_number(costume_id: str) -> int:
    try:
        return int(str(costume_id)) // 100
    except (TypeError, ValueError):
        return 0

def costume_character_code(costume_id: str) -> int:
    """Return the exact character number encoded before the last 6 costume digits.

    Examples: 1000000 -> character 1, 13304104 -> character 13.
    This is an exact numeric split, not the unsafe broad string-prefix guessing that
    previously sent unrelated costumes to one character.
    """
    try:
        value = int(str(costume_id or ""))
    except (TypeError, ValueError):
        return 0
    return value // 1_000_000 if value >= 1_000_000 else 0


def character_name_by_costume_code(chars: List[Dict[str, Any]]) -> Dict[int, str]:
    """Map a costume character code to the matching /character/N page name."""
    out: Dict[int, str] = {}
    for c in chars:
        m = re.search(r"/character/0*(\d+)(?:$|[/?#])", str(c.get("source_url", "")))
        name = clean(c.get("base_name") or c.get("name", ""))
        if not m or not name:
            continue
        code = int(m.group(1))
        # Prefer the base character page name if duplicate locale/URL forms exist.
        out.setdefault(code, name)
    return out


def costume_character_from_id(costume_id: str, chars: List[Dict[str, Any]]) -> str:
    code = costume_character_code(costume_id)
    return character_name_by_costume_code(chars).get(code, "") if code else ""


def parse_costume_character(lines: List[str], chars: Optional[List[Dict[str, Any]]] = None) -> str:
    """Read the owner only from the costume summary, never from T.U.N.I.N.G rows."""
    summary: List[str] = []
    for line in lines[:140]:
        if re.match(r"^(?:Starting Slot Amount:|Special Slot [12]|Tuning Slot (?:10|[1-9]))", line, re.I):
            break
        summary.append(line)

    # Older pages use an explicit sentence such as "Katsuki Bakugo Costume".
    for line in summary:
        m = re.match(r"^(.*?)\s+Costume(?:\s*(?:\([^)]*\)|[^.]*?ver\.?))?$", line, re.I)
        if m and clean(m.group(1)).lower() not in {"hero", "villain"}:
            return clean(m.group(1))

    # Newer pages may only mention the owner in a description, for example
    # "Shota Aizawa's festival outfit." Match known names in this summary only.
    if chars:
        summary_norm = "_".join(norm(x) for x in summary)
        candidates: List[Tuple[int, str]] = []
        for c in chars:
            cname = clean(c.get("name", ""))
            if not cname:
                continue
            base = clean(re.sub(r"\s*\([^)]*\)\s*$", "", cname))
            for candidate in {cname, base}:
                cn = norm(candidate)
                # norm() removes apostrophes, so possessives become e.g.
                # "shota_aizawas". Accept that trailing possessive s as a boundary.
                if cn and re.search(rf"(?:^|_){re.escape(cn)}(?:_|s(?:_|$)|$)", summary_norm):
                    candidates.append((len(cn), candidate))
        if candidates:
            return max(candidates)[1]
    return ""

def costume_image_url(soup: BeautifulSoup, costume_id: str = "") -> str:
    """Choose the full-body costume render, never the small/cropped card thumbnail."""
    candidates = []
    cid = str(costume_id or "")
    for order, img in enumerate(soup.find_all("img")):
        src = img.get("src") or img.get("data-src") or img.get("data-lazy-src") or ""
        if not src:
            continue
        full = urljoin(COSTUME_BASE_URL, src)
        low = full.lower()
        score = 0
        if "/gui/costume/" in low: score += 100
        if "t_ui_thumb_4_" in low: score += 100
        if cid and cid in low: score += 300
        # LL is the complete/full-body render used by the local costume gallery.
        if re.search(r"_ll\.(?:png|webp|jpg|jpeg)(?:\?|$)", low): score += 500
        if re.search(r"_l\.(?:png|webp|jpg|jpeg)(?:\?|$)", low): score += 180
        # S is the small cropped database thumbnail: explicitly avoid it.
        if re.search(r"_s\.(?:png|webp|jpg|jpeg)(?:\?|$)", low): score -= 250
        if any(x in low for x in ("rarity", "frame", "background", "banner", "logo", "icon")): score -= 150
        candidates.append((score, -order, full))
    candidates.sort(reverse=True)
    if not candidates:
        return ""
    best = candidates[0][2]
    # When the page only exposes the _S thumbnail, request its _LL counterpart.
    best = re.sub(r"_S(\.(?:png|webp|jpg|jpeg))(?:\?.*)?$", r"_LL\1", best, flags=re.I)
    return best

def costume_rarity(soup: BeautifulSoup, item: Optional[Dict[str, Any]] = None) -> str:
    """Read rarity only from the explicit rarity/frame assets.

    ``T_ui_GashaThumb_bg03.png`` is the generic blue card background and appears
    on R, SR and PUR costumes. Older versions treated it as SR, which changed
    hundreds of rarities. The frame/star assets are the authoritative markers.
    The local site intentionally labels the free default Original costume as C.
    """
    item = item or {}
    list_title = norm(item.get("list_title") or "")
    rid = str(item.get("ur_id") or "")
    if ("par_defaut" in list_title or "default" in list_title) and costume_variant_from_id(rid) == "Original":
        return "C"

    urls = " ".join((img.get("src") or "") for img in soup.find_all("img")).lower()
    if any(token in urls for token in ("rarity_pur", "3star", "gasha_ssr_frame")):
        return "PUR"
    if any(token in urls for token in ("rarity_sr", "2star", "gasha_sr_frame")):
        return "SR"
    if any(token in urls for token in ("rarity_r", "1star", "gasha_r_frame")):
        return "R"
    # Empty means "do not overwrite a valid local/cache value".
    return ""


COLOR_RGB = {
    "red": (255, 20, 25),
    "yellow": (255, 235, 0),
    "green": (0, 235, 35),
    "cyan": (20, 190, 210),
    "violet": (190, 20, 205),
}
COLOR_ALIASES = {
    "red": "red", "strike": "red", "attack": "red",
    "yellow": "yellow", "assault": "yellow",
    "green": "green", "support": "green",
    "cyan": "cyan", "blue": "cyan", "rapid": "cyan", "speed": "cyan",
    "violet": "violet", "purple": "violet", "technical": "violet", "technique": "violet",
}

def _nearest_role_color(rgb: Tuple[int, int, int]) -> str:
    return min(COLOR_RGB, key=lambda k: sum((rgb[i] - COLOR_RGB[k][i]) ** 2 for i in range(3)))

def _color_from_blob(blob: str) -> str:
    b = str(blob or "").lower()
    # Explicit role/color words are the most reliable when present in a class or asset name.
    for word, color in COLOR_ALIASES.items():
        if re.search(rf"(?:^|[^a-z]){re.escape(word)}(?:[^a-z]|$)", b):
            return color
    # Hex colors in inline styles/classes/CSS variables.
    for hx in re.findall(r"#([0-9a-f]{3}|[0-9a-f]{6})\b", b):
        if len(hx) == 3:
            hx = "".join(ch * 2 for ch in hx)
        rgb = tuple(int(hx[i:i+2], 16) for i in (0, 2, 4))
        # Ignore grayscale/dark borders/text.
        if max(rgb) - min(rgb) >= 45 and max(rgb) >= 120:
            return _nearest_role_color(rgb)
    # rgb()/rgba() values.
    for m in re.finditer(r"rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})", b):
        rgb = tuple(max(0, min(255, int(m.group(i)))) for i in (1, 2, 3))
        if max(rgb) - min(rgb) >= 45 and max(rgb) >= 120:
            return _nearest_role_color(rgb)
    return ""

def _tag_attr_blob(tag: Any, css_text: str) -> str:
    """Return only the tag/ancestor styling metadata, never descendant content.

    The old parser inspected descendants of the slot heading. Those descendants contain
    T.U.N.I.N.G character images and role names, so their colors polluted the slot color.
    """
    attrs = getattr(tag, "attrs", {}) or {}
    parts: List[str] = []
    classes: List[str] = []
    ids: List[str] = []
    for key, val in attrs.items():
        if isinstance(val, list):
            val = " ".join(map(str, val))
        parts.append(f"{key}={val}")
    raw_classes = attrs.get("class", [])
    if isinstance(raw_classes, list):
        classes.extend(map(str, raw_classes))
    else:
        classes.extend(str(raw_classes).split())
    if attrs.get("id"):
        ids.append(str(attrs["id"]))
    for cls in classes:
        for m in re.finditer(rf"\.{re.escape(cls)}(?:[^{{]*)\{{([^}}]+)\}}", css_text, re.I):
            parts.append(m.group(1))
    for ident in ids:
        for m in re.finditer(rf"#{re.escape(ident)}(?:[^{{]*)\{{([^}}]+)\}}", css_text, re.I):
            parts.append(m.group(1))
    return " ".join(parts)


def _slot_label_parts(label: str) -> Tuple[str, str]:
    """Canonical slot key and optional H/V condition from a visible label."""
    s = clean(label)
    m = re.match(r"^(Special Slot [12]|Tuning Slot (?:10|[1-9]))(?:\s*\(([HV])\))?$", s, re.I)
    if not m:
        return "", ""
    key = clean(m.group(1)).title().replace("Tuning Slot 10", "Tuning Slot 10")
    # .title() makes 'Special Slot'/'Tuning Slot' exactly how the page uses them.
    cond = (m.group(2) or "").upper()
    return key, cond


def slot_labels_from_lines(lines: List[str]) -> Dict[str, str]:
    """Keep the first visible selector label for every numbered slot.

    The compact selector row appears before the long detail sections and contains the
    H/V suffixes. Later detail headings often omit those suffixes.
    """
    out: Dict[str, str] = {}
    for line in lines:
        key, _ = _slot_label_parts(line)
        if key and key not in out:
            out[key] = clean(line)
        if len(out) >= 12:
            break
    return out


def _direct_text(tag: Any) -> str:
    try:
        return clean(" ".join(str(x) for x in tag.find_all(string=True, recursive=False)))
    except Exception:
        return ""


def _slot_keys_inside(tag: Any) -> List[str]:
    keys: List[str] = []
    try:
        for txt in tag.stripped_strings:
            key, _ = _slot_label_parts(str(txt))
            if key and key not in keys:
                keys.append(key)
    except Exception:
        pass
    return keys


def slot_selector_nodes(soup: BeautifulSoup) -> Dict[str, Any]:
    """Return the first compact selector element for each numbered slot.

    The detail page repeats slot names later. We only keep the first occurrence and
    require the chosen node/parent to contain a single slot label, preventing the
    yellow page wrapper from being mistaken for a slot background.
    """
    found: Dict[str, Any] = {}
    for tag in soup.find_all(True):
        texts = []
        direct = _direct_text(tag)
        if direct:
            texts.append(direct)
        # Buttons sometimes wrap the label in one child span.
        if not texts or not any(_slot_label_parts(t)[0] for t in texts):
            for child in tag.find_all(recursive=False):
                t = clean(child.get_text(" "))
                if t:
                    texts.append(t)
        for txt in texts:
            key, _ = _slot_label_parts(txt)
            if not key or key in found:
                continue
            node = tag
            # Prefer the nearest element that owns only this one slot label.
            while node is not None and getattr(node, "name", None) not in {"body", "html"}:
                inside = _slot_keys_inside(node)
                if inside == [key]:
                    attrs = getattr(node, "attrs", {}) or {}
                    blob = " ".join(f"{k}={' '.join(v) if isinstance(v,list) else v}" for k,v in attrs.items())
                    if _color_from_blob(blob):
                        break
                node = node.parent
            found[key] = node if node is not None else tag
            if len(found) == 12:
                return found
    return found


def slot_color_from_dom(soup: BeautifulSoup, heading: str, selector_nodes: Optional[Dict[str, Any]] = None) -> str:
    key, _ = _slot_label_parts(heading)
    if not key:
        key = clean(heading)
    css_text = "\n".join(tag.get_text(" ") for tag in soup.find_all("style"))
    nodes = selector_nodes or slot_selector_nodes(soup)
    tag = nodes.get(key)
    if tag is None:
        return ""

    # Inspect the selector itself, immediate children and only safe ancestors.
    candidates = [tag]
    try:
        candidates.extend(tag.find_all(recursive=False))
    except Exception:
        pass
    node = getattr(tag, "parent", None)
    for _ in range(3):
        if node is None or getattr(node, "name", None) in {"body", "html"}:
            break
        if len(_slot_keys_inside(node)) <= 1:
            candidates.append(node)
        node = node.parent

    for node in candidates:
        color = _color_from_blob(_tag_attr_blob(node, css_text))
        if color:
            return color
    return ""

def costume_sections(lines: List[str]) -> Dict[str, List[str]]:
    out: Dict[str, List[str]] = {}
    current = None
    # H/V is valid on normal slots too, not only Special Slot 2.
    heading = re.compile(r"^(Special Slot [12]|Tuning Slot (?:10|[1-9]))(?:\s*\([HV]\))?$", re.I)
    for line in lines:
        if heading.match(line):
            key, _ = _slot_label_parts(line)
            if key:
                current = key
                out.setdefault(current, [])
            continue
        if current:
            out[current].append(line)
    return out

def character_role_lookup(chars: List[Dict[str, Any]]) -> Dict[str, str]:
    out: Dict[str, str] = {}
    for c in chars:
        name = clean(c.get("name", ""))
        role = clean(c.get("role", "")).lower()
        if name and role:
            out[norm(name)] = role
            # base name before style suffix as weaker fallback
            base = clean(re.sub(r"\s*\([^)]*\)\s*$", "", name))
            if base:
                out.setdefault(norm(base), role)
    return out


def local_tuning_role_lookup(root: Path, chars: List[Dict[str, Any]]) -> Dict[str, str]:
    """Return exact character/style roles used by costume T.U.N.I.N.G pages.

    Character pages sometimes expose every Quirk Set variant with the base
    character role.  The local style map keeps the real role of each named
    variant, so entries such as ``Katsuki Bakugo (Cluster)`` are resolved as
    technical instead of the role of Bakugo's original set.
    """
    out = character_role_lookup(chars)
    path = root / "data" / "local_style_map.json"
    if not path.exists():
        return out
    try:
        rows = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return out
    for row in rows:
        char_name = clean(row.get("character_name", ""))
        style_name = clean(row.get("style_name", ""))
        role = clean(row.get("role", "")).lower()
        if not char_name or role not in ROLE_COLOR:
            continue
        if style_name and norm(style_name) not in {"original", "default"}:
            out[norm(f"{char_name} ({style_name})")] = role
        else:
            out[norm(char_name)] = role
        # French costume pages use these translated display names.
        if row.get("character_id") == "mr_compress":
            out[norm("Mister Compress")] = role
        elif row.get("character_id") == "kurogiri":
            out[norm("Black Mist")] = role
    return out

def section_role(section: List[str], role_lookup: Dict[str, str]) -> str:
    counts: Dict[str, int] = {}
    keys = sorted(role_lookup.keys(), key=len, reverse=True)
    for line in section:
        n = norm(line)
        role = role_lookup.get(n)
        if not role:
            for k in keys:
                if n == k or n.startswith(k + "_"):
                    role = role_lookup[k]
                    break
        if role:
            counts[role] = counts.get(role, 0) + 1
    if not counts:
        return ""
    return max(counts, key=counts.get)

def parse_costume_detail(item: Dict[str, Any], html: str, chars: List[Dict[str, Any]], role_lookup: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    if "No data available for this Costume" in html or "Costume Not Available" in html:
        raise ValueError("costume detail unavailable")
    soup = BeautifulSoup(html, "html.parser")
    lines = [clean(x) for x in soup.get_text("\n").splitlines() if clean(x)]
    title = clean(soup.title.get_text(" ")) if soup.title else item.get("list_title", "")
    title = re.sub(r"\s*-\s*My Hero Ultra Rumble.*$", "", title, flags=re.I)
    for line in lines[:50]:
        if line == item.get("list_title") or re.match(r".+\([^)]*Style\)$", line):
            title = line
            break
    group, variant = split_costume_title(title)
    # Costume IDs encode the exact base character number and match /character/N.
    # Use that first; it remains reliable even when the visible description omits
    # "X Costume". The summary parser is a safe fallback for unexpected IDs.
    char_name = costume_character_from_id(str(item.get("ur_id", "")), chars)
    owner_source = "character_id" if char_name else "summary"
    if not char_name:
        char_name = parse_costume_character(lines, chars)

    # Stable detection safeguard. This is still discovered by the updater; it is not
    # pre-added to the site. It only fixes the database label for this known costume.
    if str(item.get("ur_id")) == "1001102":
        char_name = "Izuku Midoriya"
        group = "Shoot Style"
        variant = "Super-vilain"

    role_lookup = role_lookup or character_role_lookup(chars)
    sections = costume_sections(lines)
    selector_labels = slot_labels_from_lines(lines)
    selector_nodes = slot_selector_nodes(soup)

    normal: Dict[int, str] = {}
    normal_conditions: Dict[int, str] = {}
    slot_debug: Dict[str, Any] = {}

    for i in range(1, 11):
        key = f"Tuning Slot {i}"
        visible = selector_labels.get(key, key)
        role_color = ROLE_COLOR.get(section_role(sections.get(key, []), role_lookup), "")
        dom_color = slot_color_from_dom(soup, visible, selector_nodes)
        if not dom_color and visible != key:
            dom_color = slot_color_from_dom(soup, key, selector_nodes)
        # The colored slot selector is the source of truth. The exact named
        # character/style role is only a fallback when the selector has no color.
        color = dom_color or role_color
        _, hv = _slot_label_parts(visible)
        normal[i] = color
        normal_conditions[i] = "Héros" if hv == "H" else "Vilain" if hv == "V" else ""
        slot_debug[key] = {
            "label": visible, "color": color, "condition": normal_conditions[i],
            "role_color": role_color, "dom_color": dom_color,
            "source": "dom" if dom_color else "section_role",
        }

    def parse_special(n: int) -> Tuple[str, str]:
        key = f"Special Slot {n}"
        visible = selector_labels.get(key, key)
        role_color = ROLE_COLOR.get(section_role(sections.get(key, []), role_lookup), "")
        dom_color = slot_color_from_dom(soup, visible, selector_nodes)
        if not dom_color and visible != key:
            dom_color = slot_color_from_dom(soup, key, selector_nodes)
        color = dom_color or role_color
        _, hv = _slot_label_parts(visible)
        cond = "Héros" if hv == "H" else "Vilain" if hv == "V" else ""
        slot_debug[key] = {
            "label": visible, "color": color, "condition": cond,
            "role_color": role_color, "dom_color": dom_color,
            "source": "dom" if dom_color else "section_role",
        }
        return color, cond

    sp_left, sp_left_cond = parse_special(1)
    sp_right, sp_right_cond = parse_special(2)
    # The local card has one SP condition field; Special Slot 2 is the game condition.
    cond = sp_right_cond or "Tous"

    start_slots = 0
    for line in lines[:100]:
        m = re.search(r"Starting Slot Amount:\s*(\d+)", line, re.I)
        if m:
            start_slots = int(m.group(1)); break
    desc = ""
    acquisition = ""
    for i, line in enumerate(lines[:100]):
        if line == title and i + 2 < len(lines):
            for nxt in lines[i+1:i+8]:
                if "Costume" in nxt or nxt.startswith("Starting Slot") or nxt == "* * *":
                    continue
                desc = nxt; break

    return {
        **item,
        "title": title,
        "group": group,
        "variant": variant,
        "character_name": char_name,
        "owner_source": owner_source if char_name else "unmapped",
        "rarity": costume_rarity(soup, item),
        "image_url": costume_image_url(soup, str(item.get("ur_id", ""))) or item.get("image_url_hint", ""),
        "spLeft": sp_left,
        "spRight": sp_right,
        "condition": cond,
        "normalLeft": [normal.get(i, "") for i in range(1, 6)],
        "normalRight": [normal.get(i, "") for i in range(6, 11)],
        "normalCondLeft": [normal_conditions.get(i, "") for i in range(1, 6)],
        "normalCondRight": [normal_conditions.get(i, "") for i in range(6, 11)],
        "starting_slots": start_slots,
        "notes": "",
        "acquisition": acquisition,
        "slot_debug": slot_debug,
    }

def local_character_map(root: Path) -> Dict[str, str]:
    p = root / "data" / "local_style_map.json"
    out: Dict[str, str] = {}
    if p.exists():
        for row in json.loads(p.read_text(encoding="utf-8")):
            cid = row.get("character_id", "")
            name = row.get("character_name", "")
            if cid and name:
                out[norm(name)] = cid
    # Stable aliases. Midoriya OFA and young All For One are separate playable
    # characters and therefore must keep separate costume galleries.
    out.setdefault("izuku_midoriya", "midoriya")
    out.setdefault("midoriya_izuku", "midoriya")
    out.setdefault("deku", "midoriya")
    out["izuku_midoriya_ofa"] = "midoriya_ofa"
    out["izuku_midoriya_one_for_all"] = "midoriya_ofa"
    out["midoriya_ofa"] = "midoriya_ofa"
    out["all_for_one_youth_age"] = "all_for_one_young"
    out["all_for_one_young"] = "all_for_one_young"
    out["all_for_one_jeune"] = "all_for_one_young"
    return out


def resolve_character_id(name: str, cmap: Dict[str, str], costume_id: str = "") -> str:
    """Resolve a costume owner from its actual character label.

    Never guess from a broad costume-ID prefix: practically every costume ID starts
    with 100..., which was the bug that sent the whole database to Midoriya.
    """
    # The encoded owner is authoritative for characters whose names overlap.
    code = costume_character_code(costume_id)
    exact_from_code = SOURCE_CHARACTER_CODE_OVERRIDES.get(code)
    if exact_from_code:
        return exact_from_code

    n = norm(name)
    if not n:
        return ""

    if n in cmap:
        return cmap[n]

    # Exact aliases must be checked before the broad prefix fallback below.
    exact_aliases = {
        "izuku_midoriya_ofa": "midoriya_ofa",
        "izuku_midoriya_one_for_all": "midoriya_ofa",
        "midoriya_ofa": "midoriya_ofa",
        "all_for_one_youth_age": "all_for_one_young",
        "all_for_one_young": "all_for_one_young",
        "all_for_one_jeune": "all_for_one_young",
        "izuku_midoriya": "midoriya",
        "midoriya_izuku": "midoriya",
        "deku": "midoriya",
    }
    if n in exact_aliases:
        return exact_aliases[n]

    # Longest *boundary* prefix match for labels such as
    # "Eijiro Kirishima Costume Damaged ver.". Do not use k.startswith(n):
    # an empty/short label would match an arbitrary character.
    for k in sorted(cmap, key=len, reverse=True):
        if len(k) >= 4 and (n == k or n.startswith(k + "_")):
            return cmap[k]
    return ""

def read_embedded_costumes(index_text: str) -> Dict[str, Any]:
    m = re.search(r'<script id="v249-local-costumes-data" type="application/json">\s*([\s\S]*?)\s*</script>', index_text)
    if not m:
        return {"costumes": {}}
    try:
        return json.loads(m.group(1))
    except Exception:
        return {"costumes": {}}

def write_embedded_costumes(index_text: str, data: Dict[str, Any]) -> str:
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    block = f'<script id="v249-local-costumes-data" type="application/json">\n{payload}\n</script>'
    pat = r'<script id="v249-local-costumes-data" type="application/json">[\s\S]*?</script>'
    if re.search(pat, index_text):
        return re.sub(pat, lambda _: block, index_text, count=1)
    marker = '<script id="v249-final-costume-fix">'
    if marker in index_text:
        return index_text.replace(marker, block + "\n" + marker, 1)
    return index_text + "\n" + block

def sanitize_file_part(s: str) -> str:
    v = norm(s) or "costume"
    return v[:80]


def validate_costume_image_file(path: Path) -> bool:
    try:
        if not path.exists() or path.stat().st_size < 5000:
            return False
        head = path.read_bytes()[:16]
        return head.startswith(b"\x89PNG") or head[:3] == b"\xff\xd8\xff" or head.startswith(b"RIFF")
    except Exception:
        return False


def costume_image_url_is_exact(url: str, costume_id: str) -> bool:
    if not url or not costume_id:
        return False
    path = urlparse(url).path.lower()
    cid = re.escape(str(costume_id))
    return bool(re.search(rf"(?:_|/){cid}(?:_|\.|/|$)", path))


def costume_image_url_candidates(remote: Dict[str, Any]) -> List[str]:
    """Return exact-ID image URLs, including safe host/path fallbacks."""
    rid = str(remote.get("ur_id") or "")
    raw = [str(remote.get("image_url") or ""), str(remote.get("image_url_hint") or "")]
    out: List[str] = []

    def add(url: str) -> None:
        url = clean(url)
        if not url:
            return
        # Repair the relative-path mistake occasionally exposed by character pages.
        url = url.replace("/character/assets/", "/assets/")
        if costume_image_url_is_exact(url, rid) and url not in out:
            out.append(url)

    for url in raw:
        add(url)
        parsed = urlparse(url)
        if parsed.path:
            root_path = parsed.path.replace("/character/assets/", "/assets/")
            # Locale mirrors sometimes expose the HTML but not every image.  The
            # English host uses the same exact game asset path.
            add(f"https://fr.ultrarumble.com{root_path}")
            add(f"https://ultrarumble.com{root_path}")
            # Try the other published thumbnail sizes only as a last resort.
            for size in ("LL", "L", "S"):
                sized = re.sub(r"_(?:LL|L|S)(\.(?:png|webp|jpg|jpeg))$", rf"_{size}\1", root_path, flags=re.I)
                add(f"https://fr.ultrarumble.com{sized}")
                add(f"https://ultrarumble.com{sized}")
    return out


def download_costume_image(
    session: requests.Session,
    root: Path,
    remote: Dict[str, Any],
    char_id: str,
    force: bool = False,
    preferred_rel: str = "",
) -> Tuple[str, bool, str]:
    """Download an exact costume photo without destroying a valid local one.

    Several exact source URLs are tried.  A missing image never aborts the whole
    repair; the caller receives a warning and the existing file is preserved.
    """
    rid = str(remote.get("ur_id") or "")
    urls = costume_image_url_candidates(remote)
    if not urls:
        return "", False, "no exact costume image URL available"

    primary_url = urls[0]
    if preferred_rel:
        rel = Path(preferred_rel)
    else:
        group = sanitize_file_part(remote.get("group", "costume"))
        variant = sanitize_file_part(remote.get("variant", "original"))
        ext = Path(urlparse(primary_url).path).suffix.lower()
        if ext not in {".png", ".webp", ".jpg", ".jpeg"}:
            ext = ".png"
        rel = Path("assets") / "costume_photos" / char_id / group / f"{variant}_{rid}{ext}"

    dst = root / rel
    existing_valid = validate_costume_image_file(dst)
    if not force and existing_valid:
        return rel.as_posix(), False, ""

    dst.parent.mkdir(parents=True, exist_ok=True)
    errors: List[str] = []
    for url in urls:
        image_headers = dict(HEADERS)
        image_headers.update({
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            "Referer": str(remote.get("url") or f"{COSTUME_BASE_URL}/costume/{rid}"),
        })
        try:
            response = request_with_retries(
                session, url, timeout=45, headers=image_headers, attempts=3,
                label=f"photo {rid}",
            )
            content = response.content
            response.close()
            tmp = dst.with_name(dst.name + ".tmp")
            tmp.write_bytes(content)
            if not validate_costume_image_file(tmp):
                tmp.unlink(missing_ok=True)
                errors.append(f"{url}: invalid image file")
                continue
            tmp.replace(dst)
            if url != primary_url:
                print(f"[PHOTO FALLBACK OK] {rid}: {url}", flush=True)
            return rel.as_posix(), True, ""
        except requests.RequestException as exc:
            errors.append(f"{url}: {exc}")
        except OSError as exc:
            message = str(exc)
            print(f"[PHOTO WARNING] {rid}: local image write failed; repair continues. {message}", flush=True)
            return (rel.as_posix() if existing_valid else ""), False, message

    message = " | ".join(errors[-3:]) or "all exact image URLs failed"
    print(f"[PHOTO WARNING] {rid}: all exact image sources failed; repair continues.", flush=True)
    return (rel.as_posix() if existing_valid else ""), False, message


def is_remote_generated_costume(ct: Dict[str, Any]) -> bool:
    return str(ct.get("id") or "").startswith("ur_")



COSTUME_BINDINGS_FILE = "costume_source_bindings_v278.json"
VALID_TUNING_COLORS = {"red", "yellow", "green", "cyan", "violet"}


def load_costume_bindings(root: Path) -> Dict[str, Dict[str, str]]:
    path = root / "data" / COSTUME_BINDINGS_FILE
    if not path.exists():
        return {}
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        return {str(cid): {str(k): str(v) for k, v in rows.items()} for cid, rows in payload.get("bindings", {}).items()}
    except Exception:
        return {}


def save_costume_bindings(root: Path, bindings: Dict[str, Dict[str, str]]) -> None:
    path = root / "data" / COSTUME_BINDINGS_FILE
    payload = {
        "version": 279,
        "description": "Liaison exacte V279 entre chaque tenue locale historique et son identifiant Ultrarumble.",
        "bindings": bindings,
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def apply_exact_costume_bindings(root: Path, current: Dict[str, List[Dict[str, Any]]]) -> Tuple[Dict[str, Dict[str, str]], int]:
    bindings = load_costume_bindings(root)
    changed = 0
    for cid, by_local_id in bindings.items():
        rows = current.get(cid, [])
        row_by_id = {str(ct.get("id") or ""): ct for ct in rows}
        for local_id, rid in by_local_id.items():
            ct = row_by_id.get(local_id)
            if ct is None:
                continue
            if str(ct.get("urId") or "") != rid:
                ct["urId"] = rid
                changed += 1
            ct["sourceUrl"] = f"{COSTUME_BASE_URL}/costume/{rid}"
    return bindings, changed


def exact_binding_target(bindings: Dict[str, Dict[str, str]]) -> Dict[str, Tuple[str, str]]:
    out: Dict[str, Tuple[str, str]] = {}
    for cid, rows in bindings.items():
        for local_id, rid in rows.items():
            out[str(rid)] = (cid, local_id)
    return out


def tuning_field_valid(field: str, value: Any) -> bool:
    if field in {"spLeft", "spRight"}:
        return value in VALID_TUNING_COLORS
    if field in {"normalLeft", "normalRight"}:
        return isinstance(value, list) and len(value) == 5 and all(x in VALID_TUNING_COLORS for x in value)
    if field in {"normalCondLeft", "normalCondRight"}:
        return isinstance(value, list) and len(value) == 5 and all(x in {"", "Héros", "Vilain"} for x in value)
    if field == "condition":
        return value in {"Tous", "Héros", "Vilain", ""}
    return False


TUNING_FIELDS = (
    "spLeft", "spRight", "condition",
    "normalLeft", "normalRight", "normalCondLeft", "normalCondRight",
)


def refresh_tuning_from_slot_debug(row: Dict[str, Any]) -> Dict[str, int]:
    """Restore exact slot values captured during the one-by-one page scan.

    ``slot_debug`` records every visible selector in its real left-to-right
    position. Older repair versions accidentally replaced those values with the
    generic v273 catalogue. This function makes the scan result authoritative.
    A rare missing selector keeps only that one previously valid local value.
    """
    debug = row.get("slot_debug")
    stats = {"fields_changed": 0, "colors_read": 0, "conditions_read": 0, "complete": 0}
    if not isinstance(debug, dict):
        return stats

    def set_field(field: str, value: Any) -> None:
        if row.get(field) != value:
            row[field] = copy.deepcopy(value)
            stats["fields_changed"] += 1

    # Special slots.
    for number, field in ((1, "spLeft"), (2, "spRight")):
        item = debug.get(f"Special Slot {number}")
        if isinstance(item, dict) and item.get("color") in VALID_TUNING_COLORS:
            set_field(field, item["color"])
            stats["colors_read"] += 1
    special2 = debug.get("Special Slot 2")
    if isinstance(special2, dict) and special2.get("condition", "") in {"", "Héros", "Vilain"}:
        set_field("condition", special2.get("condition") or "Tous")
        stats["conditions_read"] += 1

    # Normal slots. Preserve only an individual color that the source page did
    # not expose; every available slot is replaced by its exact scanned value.
    colors: List[str] = []
    conditions: List[str] = []
    old_colors = list(row.get("normalLeft") or []) + list(row.get("normalRight") or [])
    old_conditions = list(row.get("normalCondLeft") or []) + list(row.get("normalCondRight") or [])
    if len(old_colors) != 10:
        old_colors = [""] * 10
    if len(old_conditions) != 10:
        old_conditions = [""] * 10
    for number in range(1, 11):
        item = debug.get(f"Tuning Slot {number}")
        old_color = old_colors[number - 1]
        old_condition = old_conditions[number - 1]
        if isinstance(item, dict) and item.get("color") in VALID_TUNING_COLORS:
            colors.append(item["color"])
            stats["colors_read"] += 1
        else:
            colors.append(old_color)
        if isinstance(item, dict) and item.get("condition", "") in {"", "Héros", "Vilain"}:
            conditions.append(item.get("condition", ""))
            stats["conditions_read"] += 1
        else:
            conditions.append(old_condition)

    if all(color in VALID_TUNING_COLORS for color in colors):
        set_field("normalLeft", colors[:5])
        set_field("normalRight", colors[5:])
    if all(cond in {"", "Héros", "Vilain"} for cond in conditions):
        set_field("normalCondLeft", conditions[:5])
        set_field("normalCondRight", conditions[5:])

    stats["complete"] = int(stats["colors_read"] == 12 and stats["conditions_read"] == 11)
    return stats


def remote_tuning_complete(remote: Dict[str, Any]) -> bool:
    return all(tuning_field_valid(field, remote.get(field)) for field in (
        "spLeft", "spRight", "condition", "normalLeft", "normalRight", "normalCondLeft", "normalCondRight"
    ))


def bind_unique_unbound_sibling(
    cid: str,
    local: List[Dict[str, Any]],
    remote: Dict[str, Any],
    bindings: Dict[str, Dict[str, str]],
) -> Optional[Dict[str, Any]]:
    """Bind an image-only source ID by its exact numeric family and variant.

    This is used for costumes visible on a character page whose detail page is not
    available. It never guesses across families or characters.
    """
    rid = str(remote.get("ur_id") or "")
    family = costume_family_number(rid)
    variant = remote.get("variant") or costume_variant_from_id(rid)
    if not family or not variant:
        return None

    sibling_groups: set[str] = set()
    for ct in local:
        existing_rid = str(ct.get("urId") or "")
        if existing_rid and costume_family_number(existing_rid) == family:
            sibling_groups.add(costume_group_key(ct.get("group") or ct.get("name") or ""))
    if len(sibling_groups) != 1:
        return None
    group_key = next(iter(sibling_groups))
    candidates = [
        ct for ct in local
        if not ct.get("urId")
        and not is_remote_generated_costume(ct)
        and costume_group_key(ct.get("group") or ct.get("name") or "") == group_key
        and norm(ct.get("variant") or "Original") == norm(variant)
    ]
    if len(candidates) != 1:
        return None
    target = candidates[0]
    target["urId"] = rid
    target["sourceUrl"] = remote.get("url") or f"{COSTUME_BASE_URL}/costume/{rid}"
    bindings.setdefault(cid, {})[str(target.get("id"))] = rid
    return target

CANONICAL_COSTUME_CATALOG = "costume_catalog_canonical_v273.json"


def restore_canonical_costume_catalog(root: Path, current: Dict[str, List[Dict[str, Any]]], reset_bindings: bool = False) -> Dict[str, int]:
    """Restore the site's original French labels and exact local order.

    Identity, order and rarity are restored for canonical costumes. Exact
    T.U.N.I.N.G values come from each costume page's ``slot_debug`` scan and must
    never be overwritten by this older catalogue. Photos and notes remain untouched.
    """
    path = root / "data" / CANONICAL_COSTUME_CATALOG
    stats = {"labels_restored": 0, "order_restored": 0, "missing_restored": 0,
             "generated_duplicates_removed": 0, "bindings_reset": 0,
             "values_restored": 0}
    if not path.exists():
        return stats
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        canonical = payload.get("costumes", {})
    except Exception:
        return stats

    for cid, refs in canonical.items():
        rows = list(current.get(cid, []))
        original_ids = [str(ct.get("id") or "") for ct in rows]
        by_id: Dict[str, Dict[str, Any]] = {}
        for ct in rows:
            local_id = str(ct.get("id") or "")
            if local_id and local_id not in by_id:
                by_id[local_id] = ct

        canonical_ids = {str(ref.get("id") or "") for ref in refs}
        canonical_keys = {
            (costume_group_key(ref.get("group") or ref.get("name") or ""),
             norm(ref.get("variant") or "Original"))
            for ref in refs
        }

        extras: List[Dict[str, Any]] = []
        seen_extra_ids: set[str] = set()
        seen_extra_urids: set[str] = set()
        for ct in rows:
            local_id = str(ct.get("id") or "")
            if local_id in canonical_ids:
                continue
            key = (costume_group_key(ct.get("group") or ct.get("name") or ""),
                   norm(ct.get("variant") or "Original"))
            if is_remote_generated_costume(ct) and key in canonical_keys:
                stats["generated_duplicates_removed"] += 1
                continue
            urid = str(ct.get("urId") or "")
            if local_id and local_id in seen_extra_ids:
                stats["generated_duplicates_removed"] += 1
                continue
            if urid and urid in seen_extra_urids:
                stats["generated_duplicates_removed"] += 1
                continue
            if local_id:
                seen_extra_ids.add(local_id)
            if urid:
                seen_extra_urids.add(urid)
            extras.append(ct)

        ordered: List[Dict[str, Any]] = []
        for ref in refs:
            local_id = str(ref.get("id") or "")
            ct = by_id.get(local_id)
            if ct is None:
                ct = copy.deepcopy(ref)
                stats["missing_restored"] += 1
            for field in ("id", "char", "name", "group", "variant"):
                wanted = ref.get(field)
                if ct.get(field) != wanted:
                    ct[field] = wanted
                    stats["labels_restored"] += 1

            # Keep the already-correct rarity repair, but never restore slot
            # colors from this old catalogue: exact values live in slot_debug.
            wanted_rarity = ref.get("rarity")
            if wanted_rarity in {"C", "R", "SR", "PUR"} and ct.get("rarity") != wanted_rarity:
                ct["rarity"] = wanted_rarity
                stats["values_restored"] += 1

            # The canonical catalogue contains the historically correct local
            # photo path. Restoring it fixes photos mixed by older merge versions
            # without redownloading every valid image from the server.
            canonical_img = str(ref.get("img") or "")
            if canonical_img and validate_costume_image_file(root / canonical_img):
                ct["img"] = canonical_img
            if reset_bindings:
                for field in ("urId", "sourceUrl", "source_order"):
                    if field in ct:
                        ct.pop(field, None)
                        stats["bindings_reset"] += 1
            ordered.append(ct)

        # New variants stay after the old variants of that same family. New
        # families stay at the end. Existing canonical rows never move relative
        # to one another.
        for extra in extras:
            insert_new_costume_preserving_order(ordered, extra)

        new_ids = [str(ct.get("id") or "") for ct in ordered]
        if new_ids != original_ids:
            stats["order_restored"] += 1
        current[cid] = ordered

    return stats


def costume_group_chunks(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Return contiguous costume families without changing their order."""
    chunks: List[Dict[str, Any]] = []
    for ct in items:
        group = ct.get("group") or ct.get("name") or "Costume"
        key = costume_group_key(group)
        if chunks and chunks[-1]["key"] == key:
            chunks[-1]["items"].append(ct)
        else:
            chunks.append({"key": key, "group": group, "items": [ct]})
    return chunks


def grouped_costume_families(items: List[Dict[str, Any]], remote: bool = False) -> List[Dict[str, Any]]:
    """Group every variant of a family, even when releases are not contiguous.

    The source list is ordered by release date, so a new variant can appear months
    after another costume family. Treating only contiguous rows as one family was
    what mixed costumes and names in v275.
    """
    ordered = sorted(items, key=lambda x: int(x.get("source_order", 0))) if remote else list(items)
    families: List[Dict[str, Any]] = []
    by_key: Dict[str, Dict[str, Any]] = {}
    for ct in ordered:
        group = ct.get("group") or ct.get("name") or "Costume"
        key = costume_group_key(group)
        family = by_key.get(key)
        if family is None:
            family = {"key": key, "group": group, "items": []}
            by_key[key] = family
            families.append(family)
        family["items"].append(ct)
    return families


def align_costume_groups(local_items: List[Dict[str, Any]], remote_items: List[Dict[str, Any]]) -> List[Tuple[Dict[str, Any], Dict[str, Any]]]:
    """Match families by their French canonical name, independently of order.

    Existing local order is never used to guess a different family. This avoids
    matching unrelated groups merely because they share variants such as Original,
    Combat or Élégant.
    """
    local_groups = grouped_costume_families(local_items, remote=False)
    remote_groups = grouped_costume_families(remote_items, remote=True)
    remote_by_key = {g["key"]: g for g in remote_groups}
    return [(local_group, remote_by_key[local_group["key"]])
            for local_group in local_groups if local_group["key"] in remote_by_key]


def bind_remote_ids_to_local_order(local: List[Dict[str, Any]], remote_list: List[Dict[str, Any]]) -> int:
    """Attach source IDs to the pre-existing local costumes without reordering them."""
    canonical = [ct for ct in local if not is_remote_generated_costume(ct)]
    bound = 0
    for local_group, remote_group in align_costume_groups(canonical, remote_list):
        remotes = remote_group["items"]
        used: set[int] = set()
        cursor = 0
        for ct in local_group["items"]:
            wanted = norm(ct.get("variant") or "Original")
            match_index: Optional[int] = None
            for idx in range(cursor, len(remotes)):
                if idx not in used and norm(remotes[idx].get("variant") or "Original") == wanted:
                    match_index = idx
                    break
            if match_index is None:
                for idx, remote in enumerate(remotes):
                    if idx not in used and norm(remote.get("variant") or "Original") == wanted:
                        match_index = idx
                        break
            if match_index is None:
                continue
            remote = remotes[match_index]
            used.add(match_index)
            cursor = match_index + 1
            rid = str(remote.get("ur_id") or "")
            old = str(ct.get("urId") or "")
            if rid and old in {"", rid}:
                if old != rid:
                    bound += 1
                ct["urId"] = rid
                ct["sourceUrl"] = ct.get("sourceUrl") or remote.get("url")
                ct["source_order"] = remote.get("source_order", ct.get("source_order", 0))
    return bound



def cleanup_remote_duplicates(
    current: Dict[str, List[Dict[str, Any]]],
    remotes: List[Dict[str, Any]],
    bindings: Optional[Dict[str, Dict[str, str]]] = None,
) -> Dict[str, int]:
    """Deduplicate only by exact source ID, preferring the bound historical row."""
    binding_targets = exact_binding_target(bindings or {})
    intended = {str(r.get("ur_id")): str(r.get("char") or "") for r in remotes if r.get("ur_id")}
    occurrences: Dict[str, List[Tuple[str, Dict[str, Any]]]] = {}
    for cid, rows in current.items():
        for ct in rows:
            rid = str(ct.get("urId") or "")
            if rid:
                occurrences.setdefault(rid, []).append((cid, ct))

    remove_objects: set[int] = set()
    removed = misplaced = cleared = 0
    for rid, occs in occurrences.items():
        bound = binding_targets.get(rid)
        keeper: Optional[Tuple[str, Dict[str, Any]]] = None
        if bound:
            keeper = next(((cid, ct) for cid, ct in occs if cid == bound[0] and str(ct.get("id")) == bound[1]), None)
        if keeper is None:
            expected = intended.get(rid) or SOURCE_CHARACTER_CODE_OVERRIDES.get(costume_character_code(rid), "")
            correct = [(cid, ct) for cid, ct in occs if not expected or cid == expected]
            if correct:
                keeper = next(((cid, ct) for cid, ct in correct if not is_remote_generated_costume(ct)), correct[0])
            else:
                keeper = next(((cid, ct) for cid, ct in occs if not is_remote_generated_costume(ct)), occs[0])

        for cid, ct in occs:
            if keeper and ct is keeper[1]:
                continue
            if is_remote_generated_costume(ct):
                remove_objects.add(id(ct))
                removed += 1
                if keeper and cid != keeper[0]:
                    misplaced += 1
            else:
                for field in ("urId", "sourceUrl", "source_order"):
                    ct.pop(field, None)
                cleared += 1

    if remove_objects:
        for cid in current:
            current[cid][:] = [ct for ct in current[cid] if id(ct) not in remove_objects]
    return {"removed": removed, "misplaced": misplaced, "cleared": cleared}

def insert_new_costume_preserving_order(local: List[Dict[str, Any]], new_ct: Dict[str, Any]) -> None:
    """Append a new variant to its family, or a new family at the character end.

    No source release date is allowed to move an existing costume or variant.
    """
    group_key = costume_group_key(new_ct.get("group") or new_ct.get("name") or "")
    same_group = [i for i, ct in enumerate(local)
                  if costume_group_key(ct.get("group") or ct.get("name") or "") == group_key]
    insert_at = same_group[-1] + 1 if same_group else len(local)
    local.insert(insert_at, new_ct)


def variant_sort_key(ct: Dict[str, Any]) -> Tuple[int, int]:
    # Kept for compatibility with older imports; v275 no longer sorts existing rows.
    return (VARIANT_RANK.get(ct.get("variant", ""), 100), int(ct.get("source_order", 999999)))


def merge_remote_costumes(root: Path, session: requests.Session, remotes: List[Dict[str, Any]], sync_mode: str = "new") -> Dict[str, Any]:
    idx_path = root / "index.html"
    text = idx_path.read_text(encoding="utf-8", errors="ignore")
    data = read_embedded_costumes(text)
    current: Dict[str, List[Dict[str, Any]]] = data.setdefault("costumes", {})
    cmap = local_character_map(root)
    report = {
        "sync_mode": sync_mode,
        "updated_tunings": 0, "updated_rarities": 0, "updated_photos": 0,
        "added": 0, "downloaded_images": 0, "changed_costumes": 0, "changed_fields": 0,
        "merged_ids": [], "unmapped": [], "failed": [], "incomplete_tuning": [], "missing_exact_photo": [], "photo_download_failures": [],
        "duplicates_removed": 0, "misplaced_removed": 0, "bad_bindings_cleared": 0,
        "canonical_ids_bound": 0, "canonical_labels_restored": 0, "canonical_order_restored": 0,
        "canonical_missing_restored": 0, "canonical_generated_duplicates_removed": 0,
        "canonical_bindings_reset": 0, "image_only_bound": 0,
    }

    weekly_locked = sync_mode == "weekly"
    frozen_rows: Dict[Tuple[str, str], Dict[str, Any]] = {}
    if weekly_locked:
        for frozen_cid, frozen_list in current.items():
            for pos, frozen_ct in enumerate(frozen_list):
                frozen_key = str(frozen_ct.get("id") or frozen_ct.get("urId") or f"position:{pos}")
                frozen_rows[(frozen_cid, frozen_key)] = copy.deepcopy(frozen_ct)
        bindings: Dict[str, Dict[str, str]] = {}
        print(f"[COSTUME LOCK] {len(frozen_rows)} anciens costumes figes.", flush=True)
    else:
        # Restore historical names/order, then apply the permanent exact ID map.
        restored = restore_canonical_costume_catalog(root, current, reset_bindings=False)
        report["canonical_labels_restored"] += restored["labels_restored"]
        report["canonical_order_restored"] += restored["order_restored"]
        report["canonical_missing_restored"] += restored["missing_restored"]
        report["canonical_generated_duplicates_removed"] += restored["generated_duplicates_removed"]
        bindings, bound_count = apply_exact_costume_bindings(root, current)
        report["canonical_ids_bound"] += bound_count

    print(f"[COSTUMES MERGE] Verification exacte de {len(remotes)} costume(s)...", flush=True)
    by_char: Dict[str, List[Dict[str, Any]]] = {}
    all_mapped: List[Dict[str, Any]] = []
    for remote in remotes:
        refresh_tuning_from_slot_debug(remote)
        cid = resolve_character_id(remote.get("character_name", ""), cmap, str(remote.get("ur_id", "")))
        if not cid:
            report["unmapped"].append({"ur_id": remote.get("ur_id"), "character": remote.get("character_name"), "title": remote.get("title")})
            continue
        remote["char"] = cid
        by_char.setdefault(cid, []).append(remote)
        all_mapped.append(remote)

    if not weekly_locked:
        cleanup = cleanup_remote_duplicates(current, all_mapped, bindings)
        report["duplicates_removed"] += cleanup["removed"]
        report["misplaced_removed"] += cleanup["misplaced"]
        report["bad_bindings_cleared"] += cleanup["cleared"]

    mapped_total = sum(len(v) for v in by_char.values())
    owner_summary = ", ".join(f"{k}={len(v)}" for k, v in sorted(by_char.items()))
    print(f"[COSTUME OWNER MAP] {owner_summary}", flush=True)
    if mapped_total:
        worst_char, worst_count = max(((k, len(v)) for k, v in by_char.items()), key=lambda x: x[1])
        # The concentration guard is meaningful only for a large/full source set.
        # A targeted value repair may legitimately contain 7 Bakugo rows out of
        # only 15 new costumes.
        if mapped_total >= 100 and (worst_count > 250 or worst_count > mapped_total * 0.35):
            report["mapping_error"] = {"character": worst_char, "count": worst_count, "mapped_total": mapped_total}
            out_dir = root / "data" / "ultrarumble"
            out_dir.mkdir(parents=True, exist_ok=True)
            (out_dir / "costume_update_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"[COSTUMES ERROR] Mapping refused: {worst_char} received {worst_count}/{mapped_total} costumes.", flush=True)
            print("[COSTUMES ERROR] index.html was NOT modified.", flush=True)
            return report

    processed = 0
    tuning_fields = ["spLeft", "spRight", "condition", "normalLeft", "normalRight", "normalCondLeft", "normalCondRight"]

    for cid, remote_list in by_char.items():
        local = current.setdefault(cid, [])
        by_urid = {str(ct.get("urId")): ct for ct in local if ct.get("urId") not in (None, "")}

        for remote in sorted(remote_list, key=lambda x: int(x.get("source_order", 0))):
            rid = str(remote.get("ur_id") or "")
            existing = by_urid.get(rid)
            if existing is None and not weekly_locked:
                existing = bind_unique_unbound_sibling(cid, local, remote, bindings)
                if existing is not None:
                    by_urid[rid] = existing
                    report["image_only_bound"] += 1
                    print(f"[COSTUME EXACT BIND] {cid} / {existing.get('group')} / {existing.get('variant')} -> {rid}", flush=True)

            if existing is not None:
                if weekly_locked:
                    # Absolute rule: an installed costume is never rewritten by
                    # the weekly updater, even if the remote page changed.
                    report["merged_ids"].append(rid)
                    processed += 1
                    continue
                changed_fields: List[str] = []
                existing["urId"] = rid
                existing["sourceUrl"] = remote.get("url") or f"{COSTUME_BASE_URL}/costume/{rid}"
                existing["source_order"] = remote.get("source_order", existing.get("source_order", 0))
                if is_remote_generated_costume(existing) and remote.get("group"):
                    existing["name"] = remote.get("group")
                    existing["group"] = remote.get("group")
                    existing["variant"] = remote.get("variant") or existing.get("variant")

                if sync_mode in {"full", "fast", "values"}:
                    tuning_changed = False
                    for field in tuning_fields:
                        value = remote.get(field)
                        if tuning_field_valid(field, value):
                            if existing.get(field) != value:
                                existing[field] = copy.deepcopy(value)
                                changed_fields.append(field)
                                tuning_changed = True
                        elif sync_mode == "full":
                            report["incomplete_tuning"].append({"ur_id": rid, "field": field, "title": remote.get("title")})
                    if tuning_changed:
                        report["updated_tunings"] += 1
                    if remote.get("rarity") and existing.get("rarity") != remote.get("rarity"):
                        existing["rarity"] = remote.get("rarity")
                        report["updated_rarities"] += 1
                        changed_fields.append("rarity")

                    preferred = str(existing.get("img") or "")
                    # A valid canonical/local photo is preserved. Only missing or
                    # corrupt files are downloaded, preventing thousands of
                    # unnecessary requests and server disconnects.
                    was_placeholder = bool(existing.get("photoPlaceholder"))
                    # Retry a placeholder only when this run really reached the
                    # live costume/character lists. In offline-cache mode the
                    # valid local placeholder is preserved without slow retries.
                    retry_placeholder = was_placeholder and bool(remote.get("discovered_from"))
                    repaired, downloaded_now, photo_error = download_costume_image(
                        session, root, remote, cid, force=retry_placeholder, preferred_rel=preferred
                    )
                    if repaired:
                        if existing.get("img") != repaired:
                            existing["img"] = repaired
                            changed_fields.append("img")
                        if downloaded_now:
                            report["updated_photos"] += 1
                            report["downloaded_images"] += 1
                            if was_placeholder:
                                existing.pop("photoPlaceholder", None)
                                existing.pop("photoPlaceholderReason", None)
                                changed_fields.append("photoPlaceholder")
                    else:
                        report["missing_exact_photo"].append({"ur_id": rid, "title": remote.get("title"), "image_url": remote.get("image_url")})
                    if photo_error:
                        report["photo_download_failures"].append({"ur_id": rid, "title": remote.get("title"), "error": photo_error})
                else:
                    current_img = str(existing.get("img") or "")
                    if not current_img or not validate_costume_image_file(root / current_img):
                        repaired, downloaded_now, photo_error = download_costume_image(
                            session, root, remote, cid, force=False, preferred_rel=current_img
                        )
                        if repaired:
                            existing["img"] = repaired
                            if downloaded_now:
                                report["updated_photos"] += 1
                                report["downloaded_images"] += 1
                        if photo_error:
                            report["photo_download_failures"].append({"ur_id": rid, "title": remote.get("title"), "error": photo_error})

                if changed_fields:
                    report["changed_costumes"] += 1
                    report["changed_fields"] += len(changed_fields)
                    print(f"[COSTUME REPAIRED] {cid} / {existing.get('group')} / {existing.get('variant')} -> {', '.join(changed_fields)}", flush=True)
                report["merged_ids"].append(rid)
                processed += 1
                if processed % 50 == 0 or processed == mapped_total:
                    print(f"[COSTUMES MERGE] {processed}/{mapped_total}", flush=True)
                continue

            # A genuinely new source costume is added only when its tuning and photo are complete.
            if not remote.get("group") or not remote_tuning_complete(remote):
                report["incomplete_tuning"].append({"ur_id": rid, "title": remote.get("title"), "reason": "new costume not complete"})
                processed += 1
                continue
            img, downloaded_now, photo_error = download_costume_image(session, root, remote, cid, force=False)
            if photo_error:
                report["photo_download_failures"].append({"ur_id": rid, "title": remote.get("title"), "error": photo_error})
            if not img:
                report["missing_exact_photo"].append({"ur_id": rid, "title": remote.get("title"), "image_url": remote.get("image_url")})
                processed += 1
                continue

            new_ct = {
                "id": f"ur_{rid}", "char": cid,
                "name": remote.get("group"), "group": remote.get("group"),
                "variant": remote.get("variant") or "Original", "rarity": remote.get("rarity") or "C",
                "img": img, "spLeft": remote.get("spLeft"), "spRight": remote.get("spRight"),
                "condition": remote.get("condition") or "Tous", "normal": None,
                "normalLeft": copy.deepcopy(remote.get("normalLeft")), "normalRight": copy.deepcopy(remote.get("normalRight")),
                "normalCondLeft": copy.deepcopy(remote.get("normalCondLeft")), "normalCondRight": copy.deepcopy(remote.get("normalCondRight")),
                "notes": "", "acquisition": remote.get("acquisition", ""),
                "urId": rid, "sourceUrl": remote.get("url") or f"{COSTUME_BASE_URL}/costume/{rid}",
                "source_order": remote.get("source_order", 0),
            }
            insert_new_costume_preserving_order(local, new_ct)
            by_urid[rid] = new_ct
            report["added"] += 1
            if downloaded_now:
                report["downloaded_images"] += 1
                report["updated_photos"] += 1
            report["merged_ids"].append(rid)
            print(f"[COSTUME ADDED] {cid} / {new_ct['group']} / {new_ct['variant']} ({rid})", flush=True)
            processed += 1
            if processed % 50 == 0 or processed == mapped_total:
                print(f"[COSTUMES MERGE] {processed}/{mapped_total}", flush=True)

    if weekly_locked:
        current_lookup: Dict[Tuple[str, str], Dict[str, Any]] = {}
        for frozen_cid, frozen_list in current.items():
            for pos, frozen_ct in enumerate(frozen_list):
                frozen_key = str(frozen_ct.get("id") or frozen_ct.get("urId") or f"position:{pos}")
                current_lookup[(frozen_cid, frozen_key)] = frozen_ct
        changed_old = [key for key, before in frozen_rows.items() if current_lookup.get(key) != before]
        if changed_old:
            report["frozen_costume_violation"] = [f"{cid}/{key}" for cid, key in changed_old[:20]]
            print(f"[COSTUME LOCK ERROR] {len(changed_old)} ancien(s) costume(s) auraient change. index.html non modifie.", flush=True)
            return report
        report["frozen_costumes_verified"] = len(frozen_rows)
        print(f"[COSTUME LOCK OK] {len(frozen_rows)} anciens costumes strictement inchanges.", flush=True)
    else:
        # Reapply exact bindings and remove any duplicates created by an older version.
        save_costume_bindings(root, bindings)
        apply_exact_costume_bindings(root, current)
        cleanup = cleanup_remote_duplicates(current, all_mapped, bindings)
        report["duplicates_removed"] += cleanup["removed"]
        report["misplaced_removed"] += cleanup["misplaced"]
        report["bad_bindings_cleared"] += cleanup["cleared"]
        restored = restore_canonical_costume_catalog(root, current, reset_bindings=False)
        report["canonical_labels_restored"] += restored["labels_restored"]
        report["canonical_order_restored"] += restored["order_restored"]
        report["canonical_missing_restored"] += restored["missing_restored"]
        report["canonical_generated_duplicates_removed"] += restored["generated_duplicates_removed"]

    print("[COSTUMES MERGE] Writing index.html...", flush=True)
    data["updated_from"] = COSTUME_BASE_URL + "/costumes + character pages"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    idx_path.write_text(write_embedded_costumes(text, data), encoding="utf-8")
    out_dir = root / "data" / "ultrarumble"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "costume_update_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print("[COSTUMES MERGE] index.html saved.", flush=True)
    return report


def update_costumes(root: Path, session: requests.Session, chars: List[Dict[str, Any]], requested_mode: str = "auto") -> Dict[str, Any]:
    """Update costumes quickly and safely.

    The normal repair reads the costume list and character galleries, then opens
    detail pages only for genuinely new IDs.  If UltraRumble is temporarily
    unreachable, the exact local cache is reused instead of aborting or erasing
    data.  The explicit ``full`` mode remains available only for diagnostics.
    """
    out_dir = root / "data" / "ultrarumble"
    out_dir.mkdir(parents=True, exist_ok=True)
    baseline_path = out_dir / "costume_baseline_ids.json"
    cache_path = out_dir / "remote_costumes.json"
    previous_report_path = out_dir / "costume_update_report.json"

    baseline_ids: set[str] = set()
    if baseline_path.exists():
        try:
            baseline = json.loads(baseline_path.read_text(encoding="utf-8"))
            baseline_ids = {str(x) for x in baseline.get("costume_ids", [])}
        except Exception:
            baseline_ids = set()

    old_cache: Dict[str, Any] = {}
    if cache_path.exists():
        try:
            old_cache = {str(x.get("ur_id")): x for x in json.loads(cache_path.read_text(encoding="utf-8")) if x.get("ur_id")}
        except Exception:
            old_cache = {}

    try:
        items = discover_all_costume_items(session, chars)
    except Exception as exc:
        if not old_cache:
            raise
        print(f"[COSTUMES OFFLINE] UltraRumble indisponible: {exc}", flush=True)
        print(f"[COSTUMES OFFLINE] Reparation locale avec le cache exact ({len(old_cache)} costumes).", flush=True)
        items = []
        for pos, cached in enumerate(old_cache.values()):
            # Old V278-V288 caches may contain internal character-page asset
            # IDs. They are not official costumes and must not be checked.
            if str(cached.get("discovered_from") or "") == "character_page":
                continue
            rid = str(cached.get("ur_id") or "")
            if not rid:
                continue
            row = {
                "ur_id": rid,
                "url": cached.get("url") or f"{COSTUME_BASE_URL}/costume/{rid}",
                "list_title": cached.get("list_title") or cached.get("title") or f"Costume {rid}",
                "source_order": cached.get("source_order", pos),
            }
            hint = cached.get("image_url_hint") or cached.get("image_url")
            if hint:
                row["image_url_hint"] = hint
            items.append(row)
        items.sort(key=lambda x: int(x.get("source_order", 0)))

    permanent_unavailable: set[str] = set()
    if previous_report_path.exists():
        try:
            previous_report = json.loads(previous_report_path.read_text(encoding="utf-8"))
            for failed in previous_report.get("failed", []):
                error = str(failed.get("error") or "").lower()
                if "costume detail unavailable" in error or "404" in error or "not found" in error:
                    permanent_unavailable.add(str(failed.get("ur_id") or ""))
        except Exception:
            permanent_unavailable = set()

    if requested_mode == "exact":
        mode = "exact"
    elif requested_mode == "full":
        mode = "full"
    elif requested_mode == "new":
        mode = "new"
    elif requested_mode == "fast":
        mode = "fast"
    elif requested_mode == "values":
        mode = "values"
    elif requested_mode == "weekly":
        mode = "weekly"
    else:
        mode = "fast" if old_cache or baseline_ids else "exact"

    index_path = root / "index.html"
    index_text = index_path.read_text(encoding="utf-8", errors="ignore")
    embedded_payload = read_embedded_costumes(index_text)
    embedded = embedded_payload.get("costumes", {})

    # Restore stable French labels/order and rarity before the cache is reused.
    # T.U.N.I.N.G is restored separately from each exact slot_debug scan.
    pre_restore = {"labels_restored": 0, "order_restored": 0, "values_restored": 0}
    if mode != "weekly":
        pre_restore = restore_canonical_costume_catalog(root, embedded, reset_bindings=False)
    if any(pre_restore.values()):
        embedded_payload["updated_at"] = datetime.now(timezone.utc).isoformat()
        index_text = write_embedded_costumes(index_text, embedded_payload)
        index_path.write_text(index_text, encoding="utf-8")
        print(
            f"[COSTUME VALUES RESTORED] labels={pre_restore.get('labels_restored',0)} "
            f"order={pre_restore.get('order_restored',0)} values={pre_restore.get('values_restored',0)}",
            flush=True,
        )

    canonical_ids_by_char: Dict[str, set[str]] = {}
    canonical_path = root / "data" / CANONICAL_COSTUME_CATALOG
    if canonical_path.exists():
        try:
            canonical_payload = json.loads(canonical_path.read_text(encoding="utf-8"))
            canonical_ids_by_char = {
                cid: {str(row.get("id") or "") for row in rows}
                for cid, rows in canonical_payload.get("costumes", {}).items()
            }
        except Exception:
            canonical_ids_by_char = {}

    # Rebuild cached T.U.N.I.N.G from the exact slot-by-slot scan. This is the
    # critical source of truth and must run before any cached row is reused.
    cache_slot_fields_fixed = 0
    cache_complete_debug = 0
    for cached in old_cache.values():
        fixed = refresh_tuning_from_slot_debug(cached)
        cache_slot_fields_fixed += fixed["fields_changed"]
        cache_complete_debug += fixed["complete"]
    if cache_slot_fields_fixed:
        print(
            f"[TUNING CACHE RESTORED] fields={cache_slot_fields_fixed} "
            f"complete_costumes={cache_complete_debug}",
            flush=True,
        )

    installed_by_id: Dict[str, Tuple[str, Dict[str, Any]]] = {}
    missing_photo_ids: set[str] = set()
    for cid, arr in embedded.items():
        for ct in arr:
            rid = str(ct.get("urId") or "")
            if not rid:
                continue
            installed_by_id[rid] = (cid, ct)
            img = str(ct.get("img") or "")
            if not img or not validate_costume_image_file(root / img):
                missing_photo_ids.add(rid)
    installed_ids = set(installed_by_id)

    # Remove the 226-ish internal image IDs written by older versions. Keep
    # official catalogue rows plus any costume that genuinely exists locally
    # (for example a temporarily unpublished local costume).
    official_ids = {str(x.get("ur_id") or "") for x in items if x.get("ur_id")}
    allowed_cache_ids = official_ids | installed_ids
    removed_internal_cache = sorted(set(old_cache) - allowed_cache_ids)
    if removed_internal_cache:
        old_cache = {rid: row for rid, row in old_cache.items() if rid in allowed_cache_ids}
        print(
            f"[COSTUME CACHE CLEANUP] internal_character_assets_removed={len(removed_internal_cache)}",
            flush=True,
        )

    owner_by_code = character_name_by_costume_code(chars)
    tuning_role_lookup = local_tuning_role_lookup(root, chars)

    def partial_from_hint(item: Dict[str, Any], cached: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        rid = str(item.get("ur_id") or "")
        row = copy.deepcopy(cached or {})
        row.update({k: v for k, v in item.items() if v not in (None, "")})
        row.setdefault("title", item.get("list_title") or f"Costume {rid}")
        row.setdefault("group", "")
        row.setdefault("variant", costume_variant_from_id(rid))
        code = costume_character_code(rid)
        row["character_name"] = owner_by_code.get(code, row.get("character_name", ""))
        row["owner_source"] = "character_id"
        hint = str(item.get("image_url_hint") or "")
        if costume_image_url_is_exact(hint, rid):
            row["image_url_hint"] = hint
            if not costume_image_url_is_exact(str(row.get("image_url") or ""), rid):
                row["image_url"] = hint
        row["partial"] = True
        return row

    def parse_one(item: Dict[str, Any], allow_cache: bool, hint_only: bool = False) -> Dict[str, Any]:
        rid = str(item.get("ur_id") or "")
        cached = old_cache.get(rid, {})
        if hint_only and item.get("image_url_hint"):
            return partial_from_hint(item, cached or None)
        row = None
        detail_errors: List[str] = []
        detail_urls = [str(item.get("url") or f"{COSTUME_BASE_URL}/costume/{rid}")]
        fallback_url = f"{COSTUME_FALLBACK_BASE_URL}/costume/{rid}"
        if fallback_url not in detail_urls:
            detail_urls.append(fallback_url)
        for detail_url in detail_urls:
            try:
                local_session = requests.Session()
                html = fetch(local_session, detail_url)
                candidate_item = dict(item)
                candidate_item["url"] = detail_url
                candidate = parse_costume_detail(candidate_item, html, chars, tuning_role_lookup)
                # The English page is tried only when the first page did not expose
                # the exact rarity/photo markers. T.U.N.I.N.G parsing remains unchanged.
                row = candidate
                complete_visuals = bool(candidate.get("rarity")) and costume_image_url_is_exact(str(candidate.get("image_url") or ""), rid)
                if complete_visuals:
                    break
            except Exception as exc:
                detail_errors.append(f"{detail_url}: {exc}")
        if row is None:
            exc_text = " | ".join(detail_errors) or "costume detail unavailable"
            hint = str(item.get("image_url_hint") or "")
            if hint:
                row = partial_from_hint(item, cached or None)
                row["detail_error"] = exc_text
            elif allow_cache and cached:
                row = copy.deepcopy(cached)
                row["cache_fallback"] = True
                row["detail_error"] = exc_text
            else:
                return {**item, "error": exc_text}
        elif detail_errors:
            row["detail_warning"] = " | ".join(detail_errors)

        code = costume_character_code(rid)
        exact_owner = owner_by_code.get(code, "")
        if exact_owner:
            row["character_name"] = exact_owner
            row["owner_source"] = "character_id"

        # Keep a previously valid field when the live parser returns an incomplete one.
        for field in ("spLeft", "spRight", "condition", "normalLeft", "normalRight", "normalCondLeft", "normalCondRight"):
            if not tuning_field_valid(field, row.get(field)) and tuning_field_valid(field, cached.get(field)):
                row[field] = copy.deepcopy(cached[field])
        if not costume_image_url_is_exact(str(row.get("image_url") or ""), rid):
            for candidate in (str(item.get("image_url_hint") or ""), str(cached.get("image_url") or ""), str(cached.get("image_url_hint") or "")):
                if costume_image_url_is_exact(candidate, rid):
                    row["image_url"] = candidate
                    break
        row["source_order"] = item.get("source_order", row.get("source_order", 0))
        row["url"] = item.get("url") or row.get("url")
        return row

    results_by_id: Dict[str, Dict[str, Any]] = {}
    failures: List[Dict[str, Any]] = []
    network_items: List[Tuple[Dict[str, Any], bool]] = []

    if mode == "values":
        # Historical costumes are restored locally from the trusted catalogue.
        # Only costumes added after that catalogue need a live page check.
        untrusted_urids: set[str] = set()
        for cid, arr in embedded.items():
            trusted_ids = canonical_ids_by_char.get(cid, set())
            for ct in arr:
                local_id = str(ct.get("id") or "")
                rid = str(ct.get("urId") or "")
                if rid and local_id not in trusted_ids:
                    untrusted_urids.add(rid)
        for item in items:
            rid = str(item.get("ur_id") or "")
            if rid in untrusted_urids:
                network_items.append((item, False))
        print(
            f"[COSTUME VALUES] trusted_local={sum(len(x) for x in canonical_ids_by_char.values())} "
            f"live_one_by_one={len(network_items)}",
            flush=True,
        )

    elif mode == "weekly":
        selected = [x for x in items if str(x.get("ur_id") or "") not in installed_ids]
        network_items = [(x, False) for x in selected]
        print(
            f"[COSTUMES WEEKLY] anciens_verrouilles={len(installed_ids)} nouveaux={len(selected)}",
            flush=True,
        )

    elif mode == "fast":
        # Start from the exact cache, enriched with today's source order/images.
        for item in items:
            rid = str(item.get("ur_id") or "")
            cached = old_cache.get(rid)
            if cached:
                results_by_id[rid] = partial_from_hint(item, cached)
                results_by_id[rid].pop("partial", None)

        for item in items:
            rid = str(item.get("ur_id") or "")
            cached = old_cache.get(rid)
            local_exists = rid in installed_ids
            has_hint = costume_image_url_is_exact(str(item.get("image_url_hint") or ""), rid)

            if cached:
                # The previous deep scan already checked this row.  In fast mode
                # incomplete live fields keep the valid local values; they do not
                # trigger another long detail-page pass.
                image_source_missing = rid in missing_photo_ids and not costume_image_url_candidates(results_by_id[rid])
                if image_source_missing:
                    network_items.append((item, False))
                continue

            if local_exists and has_hint:
                # Existing historical costume: the character page is sufficient to
                # repair its exact photo; do not waste time on an unavailable detail page.
                results_by_id[rid] = partial_from_hint(item)
                continue

            if rid in permanent_unavailable and not local_exists:
                # Unpublished/image-only source rows were already proven unavailable.
                # They are remembered in the baseline but are not retried every run.
                continue

            # Truly new ID or an installed row with no usable cache/hint.
            network_items.append((item, False))

        print(
            f"[COSTUMES FAST] cache={len(results_by_id)} network={len(network_items)} "
            f"photos_locales_manquantes={len(missing_photo_ids)} indisponibles_ignores={len(permanent_unavailable)}",
            flush=True,
        )
    elif mode == "new":
        selected = [x for x in items if str(x.get("ur_id") or "") not in baseline_ids]
        network_items = [(x, False) for x in selected]
        print(f"[COSTUMES] Nouveaux identifiants: {len(selected)} costume(s) a traiter.", flush=True)
    else:
        network_items = [(x, False) for x in items]
        if mode == "exact":
            print(f"[COSTUMES] VERIFICATION EXACTE UNE PAR UNE: {len(items)} costume(s) officiels.", flush=True)
        else:
            print(f"[COSTUMES] VERIFICATION PROFONDE: {len(items)} costume(s).", flush=True)

    exact_progress_path = out_dir / "costume_exact_progress.jsonl"
    exact_scan_key = ""
    exact_completed: set[str] = set()

    if mode == "exact":
        ordered_ids = [str(x.get("ur_id") or "") for x in items if x.get("ur_id")]
        exact_scan_key = hashlib.sha256("\n".join(ordered_ids).encode("utf-8")).hexdigest()
        item_by_id = {str(x.get("ur_id") or ""): x for x in items if x.get("ur_id")}

        # A previous interrupted exact scan can be resumed.  One JSON line is
        # appended after every costume, so a network cut or closed window never
        # wastes the whole hour again.
        if exact_progress_path.exists():
            valid_progress = False
            try:
                with exact_progress_path.open("r", encoding="utf-8") as fh:
                    first = fh.readline()
                    header = json.loads(first) if first.strip() else {}
                    valid_progress = header.get("type") == "header" and header.get("scan_key") == exact_scan_key
                    if valid_progress:
                        for line in fh:
                            if not line.strip():
                                continue
                            record = json.loads(line)
                            rid = str(record.get("ur_id") or "")
                            if not rid or rid not in item_by_id:
                                continue
                            if record.get("type") == "result" and isinstance(record.get("row"), dict):
                                row = record["row"]
                                row["source_order"] = item_by_id[rid].get("source_order", row.get("source_order", 0))
                                row["url"] = item_by_id[rid].get("url") or row.get("url")
                                results_by_id[rid] = row
                                exact_completed.add(rid)
                            elif record.get("type") == "failure":
                                failures.append({
                                    "ur_id": rid,
                                    "url": item_by_id[rid].get("url"),
                                    "error": str(record.get("error") or "unknown error"),
                                })
                                exact_completed.add(rid)
            except Exception as exc:
                print(f"[COSTUME RESUME WARNING] progression illisible: {exc}", flush=True)
                valid_progress = False

            if not valid_progress:
                old_progress = exact_progress_path.with_suffix(".ancien.jsonl")
                try:
                    old_progress.unlink(missing_ok=True)
                    exact_progress_path.replace(old_progress)
                except OSError:
                    exact_progress_path.unlink(missing_ok=True)
                exact_completed.clear()
                results_by_id.clear()
                failures.clear()
            elif exact_completed:
                print(
                    f"[COSTUME RESUME] {len(exact_completed)}/{len(ordered_ids)} costume(s) deja verifies; reprise automatique.",
                    flush=True,
                )

        if not exact_progress_path.exists():
            header = {
                "type": "header",
                "scan_key": exact_scan_key,
                "total": len(ordered_ids),
                "started_at": datetime.now(timezone.utc).isoformat(),
            }
            exact_progress_path.write_text(json.dumps(header, ensure_ascii=False) + "\n", encoding="utf-8")

        # Replace the generic list with only unfinished costumes, while keeping
        # the original absolute position for the progress display.
        network_items = [
            (item, hint_only)
            for item, hint_only in network_items
            if str(item.get("ur_id") or "") not in exact_completed
        ]

    if network_items:
        if mode == "weekly":
            total_weekly = len(network_items)
            for pos, (item, hint_only) in enumerate(network_items, start=1):
                rid = str(item.get("ur_id") or "")
                print(f"[NEW COSTUME CHECK] {pos}/{total_weekly} id={rid}", flush=True)
                try:
                    row = parse_one(item, False, hint_only)
                except Exception as exc:
                    row = {**item, "error": str(exc)}
                if row.get("error"):
                    failures.append({"ur_id": rid, "url": item.get("url"), "error": row.get("error")})
                    print(f"[NEW COSTUME FAILED] {rid}: {row.get('error')}", flush=True)
                else:
                    results_by_id[rid] = row
                    print(f"[NEW COSTUME OK] {rid}: {clean(row.get('title') or row.get('list_title') or '')}", flush=True)

        elif mode == "values":
            total_values = len(network_items)
            for pos, (item, hint_only) in enumerate(network_items, start=1):
                rid = str(item.get("ur_id") or "")
                print(f"[COSTUME VALUE CHECK] {pos}/{total_values} id={rid}", flush=True)
                try:
                    local_session = requests.Session()
                    html = fetch(local_session, item["url"])
                    row = parse_costume_detail(item, html, chars, tuning_role_lookup)
                    code = costume_character_code(rid)
                    exact_owner = owner_by_code.get(code, "")
                    if exact_owner:
                        row["character_name"] = exact_owner
                        row["owner_source"] = "character_id"
                    row["source_order"] = item.get("source_order", row.get("source_order", 0))
                    row["url"] = item.get("url") or row.get("url")
                except Exception as exc:
                    # In value-repair mode a failed live page must never reuse the
                    # known-bad cached rarity/T.U.N.I.N.G values. Keep the local
                    # costume unchanged and report the failure.
                    row = {**item, "error": str(exc)}
                if row.get("error"):
                    failures.append({"ur_id": rid, "url": item.get("url"), "error": row.get("error")})
                    print(f"[COSTUME VALUE FAILED] {rid}: {row.get('error')}", flush=True)
                else:
                    results_by_id[rid] = row
                    print(
                        f"[COSTUME VALUE OK] {rid}: rarity={row.get('rarity')} "
                        f"SP={row.get('spLeft')}/{row.get('spRight')}",
                        flush=True,
                    )

        elif mode == "exact":
            item_position = {
                str(item.get("ur_id") or ""): pos
                for pos, item in enumerate(items, start=1)
            }
            total_exact = len(items)
            with exact_progress_path.open("a", encoding="utf-8") as progress_fh:
                for item, hint_only in network_items:
                    rid = str(item.get("ur_id") or "")
                    pos = item_position.get(rid, len(exact_completed) + 1)
                    print(f"[COSTUME CHECK] {pos}/{total_exact} id={rid}", flush=True)
                    try:
                        row = parse_one(item, True, hint_only)
                    except Exception as exc:
                        row = {**item, "error": str(exc)}

                    if row.get("error"):
                        error_text = str(row.get("error"))
                        failures.append({"ur_id": rid, "url": item.get("url"), "error": error_text})
                        record = {"type": "failure", "ur_id": rid, "error": error_text}
                        print(f"[COSTUME CHECK FAILED] {rid}: {error_text}", flush=True)
                    else:
                        results_by_id[rid] = row
                        record = {"type": "result", "ur_id": rid, "row": row}
                        title = clean(row.get("title") or row.get("list_title") or "")
                        if row.get("cache_fallback") or row.get("detail_error") or row.get("partial"):
                            reason = clean(row.get("detail_error") or "page detail indisponible")
                            print(f"[COSTUME CHECK CACHE] {rid}: {title} ({reason})", flush=True)
                        else:
                            print(f"[COSTUME CHECK OK] {rid}: {title}", flush=True)

                    progress_fh.write(json.dumps(record, ensure_ascii=False) + "\n")
                    progress_fh.flush()
                    exact_completed.add(rid)
        else:
            max_workers = 6 if mode != "full" else 5
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                futures = {
                    executor.submit(parse_one, item, True, hint_only): item
                    for item, hint_only in network_items
                }
                done = 0
                for future in as_completed(futures):
                    item = futures[future]
                    rid = str(item.get("ur_id") or "")
                    try:
                        row = future.result()
                    except Exception as exc:
                        row = {**item, "error": str(exc)}
                    if row.get("error"):
                        failures.append({"ur_id": rid, "url": item.get("url"), "error": row.get("error")})
                        print(f"[COSTUME CHECK FAILED] {rid}: {row.get('error')}", flush=True)
                    else:
                        results_by_id[rid] = row
                    done += 1
                    if done % 25 == 0 or done == len(network_items):
                        print(f"[COSTUMES NETWORK] {done}/{len(network_items)}", flush=True)

    results = sorted(results_by_id.values(), key=lambda x: int(x.get("source_order", 0)))

    merged_cache = {rid: row for rid, row in old_cache.items() if rid in (official_ids | installed_ids)}
    for row in results:
        rid = str(row.get("ur_id") or "")
        if rid:
            # Partial image-only rows must not erase complete cached tuning.
            previous = merged_cache.get(rid, {})
            merged = copy.deepcopy(previous)
            merged.update({k: v for k, v in row.items() if v not in (None, "")})
            merged_cache[rid] = merged
    cache_path.write_text(json.dumps(list(merged_cache.values()), ensure_ascii=False, indent=2), encoding="utf-8")

    merge_mode = "full" if mode == "exact" else ("values" if mode == "values" else ("fast" if mode == "fast" else mode))
    report = merge_remote_costumes(root, session, results, sync_mode=merge_mode) if results else {
        "sync_mode": mode, "updated_tunings": 0, "updated_rarities": 0, "updated_photos": 0,
        "added": 0, "downloaded_images": 0, "changed_costumes": 0, "changed_fields": 0,
        "merged_ids": [], "unmapped": [], "failed": failures, "incomplete_tuning": [],
        "missing_exact_photo": [], "photo_download_failures": [],
    }
    report["failed"] = failures
    report["network_pages_requested"] = len(network_items)
    report["cache_rows_reused"] = max(0, len(results) - len(network_items))
    report["permanent_unavailable_skipped"] = sorted(x for x in permanent_unavailable if x)

    # Baseline contains only official remote IDs plus costumes genuinely
    # installed locally. Internal image IDs from character pages are excluded.
    discovered_ids = {str(x.get("ur_id") or "") for x in items if x.get("ur_id")}
    successful_ids = set(report.get("merged_ids", []))
    saved_ids = discovered_ids | installed_ids | successful_ids
    baseline_path.write_text(json.dumps({
        "created_at": datetime.now(timezone.utc).isoformat(),
        "mode_used": mode,
        "costume_ids": sorted(saved_ids, key=lambda x: int(x) if x.isdigit() else x),
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    (out_dir / "costume_update_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    if mode == "exact":
        # Delete the resume file only after the cache, index and report were all
        # written successfully.  If the program is interrupted earlier, the next
        # run resumes exactly where it stopped.
        exact_progress_path.unlink(missing_ok=True)
    print(
        f"[COSTUMES DONE] mode={mode} network={len(network_items)} cache={report.get('cache_rows_reused',0)} "
        f"added={report.get('added',0)} tunings={report.get('updated_tunings',0)} "
        f"rarities={report.get('updated_rarities',0)} photos={report.get('updated_photos',0)} "
        f"changed_costumes={report.get('changed_costumes',0)} "
        f"duplicates_removed={report.get('duplicates_removed',0) + report.get('canonical_generated_duplicates_removed',0)} "
        f"failed={len(failures)} incomplete_tuning={len(report.get('incomplete_tuning',[]))} "
        f"missing_photo={len(report.get('missing_exact_photo',[]))} "
        f"photo_network_failures={len(report.get('photo_download_failures',[]))} "
        f"unmapped={len(report.get('unmapped',[]))}",
        flush=True,
    )
    return report


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--site-root", default=".")
    ap.add_argument("--apply-index", action="store_true")
    ap.add_argument("--limit-characters", type=int, default=0)
    ap.add_argument("--skip-costumes", action="store_true")
    ap.add_argument("--costumes-only", action="store_true",
                    help="reuse cached character data and update only costumes")
    ap.add_argument("--costume-mode", choices=["auto", "fast", "exact", "full", "new", "values", "weekly"], default="auto",
                    help="weekly=freeze every installed costume and add only new IDs; exact=full one-by-one scan; values=restore trusted old values + recheck only new costumes; fast=cache + new/broken only; full=parallel deep scan; new=only unseen IDs")
    args = ap.parse_args()

    root = Path(args.site_root).resolve()
    out_dir = root / "data" / "ultrarumble"
    out_dir.mkdir(parents=True, exist_ok=True)

    session = requests.Session()
    chars: List[Dict[str, Any]] = []

    if args.costumes_only:
        chars_path = out_dir / "characters_exact.json"
        if chars_path.exists():
            try:
                loaded = json.loads(chars_path.read_text(encoding="utf-8"))
                if isinstance(loaded, list):
                    chars = loaded
            except Exception:
                chars = []
        if chars:
            print(f"[FAST] Donnees personnages locales reutilisees: {len(chars)}", flush=True)
        else:
            print("[FAST WARNING] Cache personnages absent; lecture minimale du site.", flush=True)

    if not chars:
        urls = links_from(fetch(session, BASE_URL + "/characters"), r"/character/\d+")
        if args.limit_characters:
            urls = urls[:args.limit_characters]
        for url in urls:
            try:
                c = parse_character(url, fetch(session, url))
                if not args.costumes_only:
                    c = fill_missing_tables_from_locales(session, url, c)
                chars.append(c)
                print(f"[OK] {c['name']} ({c.get('role','')})")
            except Exception as e:
                print(f"[WARN] {url}: {e}")

    if args.costumes_only:
        if not args.skip_costumes:
            update_costumes(root, session, chars, requested_mode=args.costume_mode)
        print(f"[DONE] costumes only; characters_cache={len(chars)}")
        print("[INFO] Ferme index.html puis rouvre-le depuis ce dossier.")
        return 0

    tuning_level_stats = enrich_character_tuning_levels(session, chars)
    generated = ensure_generated_characters(root, session, chars)
    # Final safety: map source character 201 onto the existing local style and
    # remove every obsolete generated Youth-age artifact before writing files.
    young_remote = next((x for x in chars if re.search(r"/character/201(?:#|$)", str(x.get("source_url") or ""))), None)
    generated.get("generated_styles", {}).pop("all_for_one_youth_age_youth_age", None)
    generated.get("generated_tunings", {}).pop("all_for_one_youth_age_youth_age", None)
    generated["generated_characters"] = [x for x in generated.get("generated_characters", []) if x.get("id") != "all_for_one_youth_age"]
    exact = generated.get("exact") or build_exact_by_style(root, chars)
    exact.pop("all_for_one_youth_age_youth_age", None)
    if young_remote:
        exact["all_for_one_young_assault"] = young_remote
    payload = {
        "meta": {
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "updater_version": "v354_afo_young_mapped",
            "source": BASE_URL,
            "new_styles_added": generated.get("new_styles_added", 0),
            "tuning_level_stats": tuning_level_stats,
        },
        "characters": chars,
        "exact_by_style": exact,
        "generated_styles": generated.get("generated_styles", {}),
        "generated_tunings": generated.get("generated_tunings", {}),
        "generated_characters": generated.get("generated_characters", []),
    }
    (out_dir / "site_data_latest.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    (out_dir / "characters_exact.json").write_text(json.dumps(chars, ensure_ascii=False, indent=2), encoding="utf-8")
    (out_dir / "update_report.json").write_text(json.dumps({
        "characters": len(chars),
        "mapped_styles": len(exact),
        "missing_local_styles": [x.get("style_key") for x in load_local_styles(root) if x.get("style_key") not in exact],
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    if args.apply_index:
        apply_index(root, payload)
        print("[OK] index.html updated")
    if not args.skip_costumes:
        update_costumes(root, session, chars, requested_mode=args.costume_mode)
    print(f"[DONE] characters={len(chars)} mapped_styles={len(exact)}")
    print("[INFO] Close this window, close index.html, then reopen index.html from this folder.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
