#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Season 18 compatibility layer for MHUR Nexus.

Runs after the normal synchronizers. It deliberately keeps the historical site
content intact and only repairs data that the new UltraRumble layouts expose in
a different form: bilingual generated character sheets, upcoming costumes,
patch history/UI data, login bonus translations, latest releases, and NEW flags.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup, Tag

BASE = "https://ultrarumble.com/"
FR_BASE = "https://fr.ultrarumble.com/"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "Cache-Control": "no-cache",
}
DATE_RE = re.compile(r"(20\d{2})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})\s*(?:\(?(JST)\)?)?", re.I)
CJK_RE = re.compile(r"[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]")


def configure_stdio() -> None:
    for name in ("stdout", "stderr"):
        stream = getattr(sys, name, None)
        try:
            stream.reconfigure(encoding="utf-8", errors="backslashreplace")
        except (AttributeError, OSError):
            pass


def clean(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def norm(value: Any) -> str:
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")


def without_cjk(value: Any) -> str:
    text = str(value or "")
    text = re.sub(r"\s*[（(][^()（）]*[\u3040-\u30ff\u3400-\u9fff][^()（）]*[）)]", "", text)
    text = CJK_RE.sub("", text)
    return clean(text)


def load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Impossible de charger {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def get(session: requests.Session, url: str, attempts: int = 4) -> str:
    last: Exception | None = None
    for _ in range(attempts):
        try:
            r = session.get(url, headers=HEADERS, timeout=45)
            r.raise_for_status()
            r.encoding = r.apparent_encoding or r.encoding
            return r.text
        except requests.RequestException as exc:
            last = exc
    if last:
        raise last
    raise RuntimeError(url)


def iso_jst(raw: str) -> str | None:
    m = DATE_RE.search(raw or "")
    if not m:
        return None
    return f"{m.group(1)}-{m.group(2)}-{m.group(3)}T{m.group(4)}:{m.group(5)}:{m.group(6)}+09:00"


def section_nodes(soup: BeautifulSoup, title: str) -> list[Tag]:
    heading = next((h for h in soup.find_all(["h1", "h2", "h3", "h4"]) if title.lower() in clean(h.get_text(" ")).lower()), None)
    if heading is None:
        return []
    rank = int(heading.name[1])
    out: list[Tag] = []
    for node in heading.find_all_next():
        if node is heading:
            continue
        if node.name in {"h1", "h2", "h3", "h4"} and int(node.name[1]) <= rank:
            break
        out.append(node)
    return out


def nearest_single_card(node: Tag) -> Tag:
    best = node
    cur: Tag | None = node
    for _ in range(10):
        if not isinstance(cur, Tag):
            break
        count = len(DATE_RE.findall(clean(cur.get_text(" "))))
        links = len(cur.find_all("a", href=True))
        images = len(cur.find_all("img"))
        if 1 <= count <= 2 and links <= 3 and images <= 3:
            best = cur
        if count > 2 or links > 6 or images > 6:
            break
        cur = cur.parent if isinstance(cur.parent, Tag) else None
    return best


JP_NAMES = {
    "トガヒミコ": ("Himiko Toga", "Himiko Toga"),
    "エンデヴァー": ("Endeavor", "Endeavor"),
    "Mt.レディ": ("Mt. Lady", "Mt. Lady"),
    "飯田天哉": ("Tenya Iida", "Tenya Iida"),
    "ジェントル・クリミナル": ("Gentle Criminal", "Gentle Criminal"),
    "塩崎茨": ("Ibara Shiozaki", "Ibara Shiozaki"),
    "拳藤一佳": ("Itsuka Kendo", "Itsuka Kendo"),
    "八百万百": ("Momo Yaoyorozu", "Momo Yaoyorozu"),
}


def bonus_titles(raw: str) -> tuple[str, str]:
    title = clean(raw)
    if "2000万ダウンロード" in title:
        return "Bonus de connexion — 20 millions de téléchargements", "20 Million Downloads Login Bonus"
    m = re.search(r"シーズン\s*(\d+)[-ー]?スペシャルログインボーナス[-ー]?vol\.?\s*(\d+)", title, re.I)
    if m:
        return f"Bonus de connexion spécial — Saison {m.group(1)} Vol. {m.group(2)}", f"Special Login Bonus — Season {m.group(1)} Vol. {m.group(2)}"
    for jp, (fr_name, en_name) in JP_NAMES.items():
        if jp in title and "誕生日" in title:
            year = (re.search(r"20\d{2}", title) or [""])[0]
            return clean(f"Campagne anniversaire {fr_name} {year}"), clean(f"{en_name} Birthday Campaign {year}")
    # English source fallback.
    m = re.match(r"(.+?)\s+Birthday Campaign\s*(20\d{2})?", title, re.I)
    if m:
        name, year = clean(m.group(1)), clean(m.group(2))
        return clean(f"Campagne anniversaire {name} {year}"), clean(f"{name} Birthday Campaign {year}")
    if CJK_RE.search(title):
        safe = without_cjk(title)
        return safe or "Bonus de connexion", safe or "Login Bonus"
    return title, title


def download_image(session: requests.Session, root: Path, url: str, rel_base: str) -> str:
    if not url:
        return ""
    ext = Path(urlparse(url).path).suffix.lower()
    if ext not in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"}:
        ext = ".webp"
    rel = Path(rel_base + ext)
    dst = root / rel
    if dst.exists() and dst.stat().st_size > 500:
        return rel.as_posix()
    try:
        r = session.get(url, headers={**HEADERS, "Accept": "image/avif,image/webp,image/*,*/*;q=0.8"}, timeout=45)
        r.raise_for_status()
        if len(r.content) < 500:
            return ""
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_bytes(r.content)
        return rel.as_posix()
    except requests.RequestException as exc:
        print(f"[S18 IMAGE WARNING] {url}: {exc}", flush=True)
        return ""


def parse_login_bonuses(session: requests.Session, root: Path, soup: BeautifulSoup) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for node in section_nodes(soup, "Login Bonuses"):
        if not isinstance(node, Tag):
            continue
        img = node if node.name == "img" else node.find("img")
        if img is None:
            continue
        alt = clean(img.get("alt"))
        if not alt or alt.lower() in {"image", "background image"}:
            continue
        card = nearest_single_card(node)
        text = clean(card.get_text(" "))
        dates = DATE_RE.findall(text)
        if len(dates) < 2:
            continue
        date_matches = list(DATE_RE.finditer(text))
        start = iso_jst(date_matches[0].group(0))
        end = iso_jst(date_matches[1].group(0))
        if not start or not end or (start, end) in seen:
            continue
        seen.add((start, end))
        fr, en = bonus_titles(alt)
        src = urljoin(BASE, img.get("src") or img.get("data-src") or img.get("data-lazy-src") or "")
        local = download_image(session, root, src, f"assets/home/bonuses/s18_{norm(en)[:64]}")
        prefix = clean(text[: date_matches[0].start()]).upper()
        kind_en = "Birthday" if "BIRTHDAY" in prefix or "anniversaire" in fr.lower() else "Login"
        kind_fr = "Anniversaire" if kind_en == "Birthday" else "Connexion"
        rows.append({
            "title": fr, "title_fr": fr, "title_en": en,
            "type": kind_fr, "type_fr": kind_fr, "type_en": kind_en,
            "start": start, "end": end, "image": local or src,
        })
    rows.sort(key=lambda x: x.get("start") or "")
    return rows


def heading_image(tag: Tag, *, skill: bool = False) -> str:
    img = tag.find("img")
    if img:
        src = img.get("src") or img.get("data-src") or img.get("data-lazy-src") or ""
        low = src.lower()
        if skill and ("unique" in low or "skill" in low):
            return urljoin(BASE, src)
        if not skill and ("chara" in low or "character" in low or "face" in low):
            return urljoin(BASE, src)
    return ""


def patch_tone(before: list[str], after: list[str]) -> str:
    try:
        b = sum(float(x) for x in before) / max(1, len(before))
        a = sum(float(x) for x in after) / max(1, len(after))
        return "buff" if a > b else "nerf" if a < b else "adjust"
    except (TypeError, ValueError):
        return "adjust"


def parse_patch_structured(session: requests.Session, root: Path, url: str, old: dict[str, Any] | None = None) -> dict[str, Any]:
    html = get(session, url)
    soup = BeautifulSoup(html, "lxml")
    pid = (re.search(r"/patch/(\d+)", url) or ["", str(int(datetime.now().timestamp()))])[1]
    title = clean((soup.find("h1") or soup.title).get_text(" "))
    date_text = clean(soup.get_text(" "))
    dm = re.search(r"(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2}\s+at\s+\d{1,2}:\d{2}\s+(?:AM|PM)", date_text, re.I)
    date = datetime.fromtimestamp(int(pid), tz=timezone.utc).isoformat()
    if dm:
        try:
            date = datetime.strptime(dm.group(0), "%B %d, %Y at %I:%M %p").replace(tzinfo=timezone.utc).isoformat()
        except ValueError:
            pass

    categories: list[dict[str, Any]] = []
    current_category: dict[str, Any] | None = None
    current_character = ""
    current_style = "Original"
    portrait = ""
    current_skill = ""
    skill_image = ""
    texts: list[str] = []
    char_texts: list[str] = []

    def flush_skill() -> None:
        nonlocal texts, current_skill, skill_image
        if current_category is None or not current_character or not texts:
            texts = []
            return
        metrics: dict[str, tuple[list[str], list[str]]] = {}
        bullets: list[str] = []
        for value in texts:
            value = re.sub(r"^\d+\.\s*", "", clean(value))
            found = False
            for label, before, after in re.findall(r"([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ /+\-]+?):\s*(-?\d+(?:\.\d+)?)\s*(?:->|→)\s*(-?\d+(?:\.\d+)?)", value):
                label = clean(label)
                if norm(label) == "down_power":
                    continue
                metrics.setdefault(label, ([], []))[0].append(before)
                metrics.setdefault(label, ([], []))[1].append(after)
                found = True
            if not found and "changes found" not in value.lower():
                bullets.append(value)
        if not metrics and bullets:
            current_category["changes"].append({
                "character": current_character, "style": current_style, "role": "",
                "portrait": portrait, "skill_name": current_skill or "Ajustement",
                "skill_image": skill_image, "tone": "adjust", "bullets": bullets[:12],
            })
        for label, (before, after) in metrics.items():
            current_category["changes"].append({
                "character": current_character, "style": current_style, "role": "",
                "portrait": portrait, "skill_name": current_skill or label,
                "skill_image": skill_image, "label": label,
                "before": before if len(before) > 1 else before[0],
                "after": after if len(after) > 1 else after[0],
                "tone": patch_tone(before, after),
            })
        texts = []

    def flush_character() -> None:
        nonlocal char_texts
        if current_category is None or not current_character or not char_texts:
            char_texts = []
            return
        local = char_texts[:]
        char_texts = []
        for value in local:
            m = re.search(r"([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ /+\-]+?):\s*(-?\d+(?:\.\d+)?)\s*(?:->|→)\s*(-?\d+(?:\.\d+)?)", value)
            if not m or norm(m.group(1)) == "down_power":
                continue
            before, after = m.group(2), m.group(3)
            current_category["changes"].append({
                "character": current_character, "style": current_style, "role": "",
                "portrait": portrait, "skill_name": m.group(1), "skill_image": "",
                "label": m.group(1), "before": before, "after": after,
                "tone": patch_tone([before], [after]),
            })

    first_h1 = soup.find("h1")
    started = False
    for tag in soup.find_all(["h1", "h2", "h3", "p", "li", "img"]):
        if tag.name == "h1":
            if tag is first_h1:
                started = True
                continue
            if not started:
                continue
            flush_skill(); flush_character()
            text = clean(tag.get_text(" "))
            if text.lower().startswith("balance changes"):
                current_category = {"title": text, "accent": norm(text.split(":", 1)[-1]), "changes": []}
                categories.append(current_category)
            continue
        if not started or current_category is None:
            continue
        if tag.name == "h2":
            flush_skill(); flush_character()
            text = clean(tag.get_text(" "))
            current_character = re.sub(r"^Image\s*", "", text, flags=re.I)
            q = re.match(r'(.+?)\s+["“](.+?)["”]\s*$', current_character)
            if q:
                current_character, current_style = clean(q.group(1)), clean(q.group(2))
            else:
                current_style = "Original"
            src = heading_image(tag)
            portrait = download_image(session, root, src, f"assets/home/patches/{pid}/portrait_{norm(current_character)}") if src else ""
            current_skill = ""; skill_image = ""; texts = []; char_texts = []
            continue
        if tag.name == "h3":
            flush_skill()
            current_skill = clean(tag.get_text(" "))
            current_skill = re.sub(r"^(?:Quirk Skill|Special Action)\s*", "", current_skill, flags=re.I)
            src = heading_image(tag, skill=True)
            skill_image = download_image(session, root, src, f"assets/home/patches/{pid}/skill_{norm(current_character)}_{norm(current_skill)}") if src else ""
            continue
        if tag.name == "img":
            src = urljoin(BASE, tag.get("src") or tag.get("data-src") or tag.get("data-lazy-src") or "")
            low = src.lower()
            if current_skill and not skill_image and ("unique" in low or "skill" in low):
                skill_image = download_image(session, root, src, f"assets/home/patches/{pid}/skill_{norm(current_character)}_{norm(current_skill)}")
            elif current_character and not portrait and ("chara" in low or "face" in low):
                portrait = download_image(session, root, src, f"assets/home/patches/{pid}/portrait_{norm(current_character)}")
            continue
        text = clean(tag.get_text(" "))
        if not text or any(skip in text.lower() for skip in ("buff + value", "nerf + value", "main menu", "official patch notes")):
            continue
        (texts if current_skill else char_texts).append(text)
    flush_skill(); flush_character()
    categories = [c for c in categories if c.get("changes")]
    out = {"id": pid, "title": title, "date": date, "url": url, "details": categories, "internal": True}
    if not categories:
        # Preserve the old rich parser as a safe display fallback.
        if old:
            for key in ("details", "rich_blocks", "sections"):
                if old.get(key):
                    out[key] = old[key]
        else:
            out["sections"] = [{"title": "Changes", "items": [clean(x.get_text(" ")) for x in soup.find_all("li")[:100]]}]
    return out


def parse_entry_discounts(session: requests.Session, root: Path, soup: BeautifulSoup) -> list[dict[str, Any]]:
    """Read the current Entry Cost Discounts directly from UltraRumble.

    The homepage markup changes occasionally, so the parser looks for point
    labels inside the dedicated section instead of depending on fragile CSS
    classes. Card portraits are downloaded locally to avoid slow remote images.
    """
    heading = next(
        (
            h for h in soup.find_all(["h1", "h2", "h3", "h4"])
            if any(token in clean(h.get_text(" ")).lower() for token in (
                "entry cost discounts", "réductions de coût", "reductions de cout"
            ))
        ),
        None,
    )
    if heading is None:
        return []

    rank = int(heading.name[1])
    tags: list[Tag] = []
    for node in heading.find_all_next():
        if node is heading:
            continue
        if isinstance(node, Tag) and node.name in {"h1", "h2", "h3", "h4"} and int(node.name[1]) <= rank:
            break
        if isinstance(node, Tag):
            tags.append(node)

    rows: list[dict[str, Any]] = []
    seen: set[tuple[str, int]] = set()
    point_re = re.compile(r"\b(\d{1,3})\s*Pts?\.?\s*$", re.I)
    for node in tags:
        raw = clean(node.get_text(" "))
        match = point_re.fullmatch(raw)
        if not match:
            continue
        points = int(match.group(1))
        card: Tag | None = node
        for _ in range(8):
            if not isinstance(card, Tag):
                break
            card_text = clean(card.get_text(" "))
            images = card.find_all("img")
            if point_re.search(card_text) and images and len(card_text) <= 180:
                break
            card = card.parent if isinstance(card.parent, Tag) else None
        if not isinstance(card, Tag):
            continue

        card_text = clean(card.get_text(" "))
        name = clean(point_re.sub("", card_text))
        name = re.sub(r"\bImage\b", "", name, flags=re.I)
        name = clean(name)
        if not name or len(name) > 90:
            candidates = [
                clean(x.get_text(" ")) for x in card.find_all(["b", "strong", "span", "p", "div"])
                if clean(x.get_text(" ")) and not point_re.search(clean(x.get_text(" ")))
            ]
            candidates = [x for x in candidates if 1 < len(x) <= 70 and x.lower() not in {"image", "entry cost discounts"}]
            name = candidates[0] if candidates else ""
        key = (norm(name), points)
        if not name or key in seen:
            continue

        image_url = ""
        image_candidates: list[str] = []
        for image in card.find_all("img"):
            src = image.get("src") or image.get("data-src") or image.get("data-lazy-src") or ""
            if src:
                image_candidates.append(urljoin(BASE, src))
        preferred = [u for u in image_candidates if re.search(r"charaimage|character|faceicon|variation|thumb", u, re.I)]
        if preferred:
            image_url = preferred[-1]
        elif image_candidates:
            image_url = image_candidates[-1]
        local = download_image(session, root, image_url, f"assets/home/discounts/{norm(name) or len(rows)}") if image_url else ""
        rows.append({"name": name, "points": points, "image": local or image_url})
        seen.add(key)

    return rows[:8]


def patch_home(root: Path, session: requests.Session) -> None:
    data_path = root / "data/home_data.json"
    data = json.loads(data_path.read_text(encoding="utf-8")) if data_path.exists() else {}
    soup = BeautifulSoup(get(session, BASE), "lxml")
    bonuses = parse_login_bonuses(session, root, soup)
    if bonuses or any("login bonuses" in clean(h.get_text(" ")).lower() for h in soup.find_all(["h1", "h2", "h3"])):
        data["login_bonuses"] = bonuses

    discounts = parse_entry_discounts(session, root, soup)
    if discounts:
        data["discounts"] = discounts

    links: list[str] = []
    for a in soup.find_all("a", href=True):
        href = urljoin(BASE, a.get("href", ""))
        if re.search(r"/patch/\d+", href) and href not in links:
            links.append(href)
    old_by_id = {str(x.get("id")): x for x in data.get("patch_notes", []) if isinstance(x, dict)}
    latest: list[dict[str, Any]] = []
    for url in links[:6]:
        pid = (re.search(r"/patch/(\d+)", url) or ["", ""])[1]
        try:
            latest.append(parse_patch_structured(session, root, url, old_by_id.get(pid)))
        except Exception as exc:
            print(f"[S18 PATCH WARNING] {url}: {exc}", flush=True)
            if pid in old_by_id:
                latest.append(old_by_id[pid])
    known = {str(x.get("id")) for x in latest}
    latest.extend(x for x in data.get("patch_notes", []) if str(x.get("id")) not in known)
    data["patch_notes"] = latest[:12]

    data_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    (root / "data/home_data.js").write_text("window.MHUR_HOME_DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"[S18 HOME] bonus={len(data.get('login_bonuses', []))} discounts={len(data.get('discounts', []))} patches={len(data.get('patch_notes', []))}", flush=True)


def extract_lines(module: Any, html: str, url: str) -> list[str]:
    return module.lines_from_text(module.extract_character_variant_text(module.soup_text(html), url))


def character_rich(lines: list[str]) -> dict[str, str]:
    out = {"description": "", "role_desc": "", "special_name": "", "special_desc": ""}
    for i, line in enumerate(lines):
        if line in {"HERO", "VILLAIN"}:
            if i + 1 < len(lines):
                out["description"] = clean(lines[i + 1])
            # First team effect sentence after the role block.
            for candidate in lines[i + 2 : i + 16]:
                low = candidate.lower()
                if "team" in low or "équipe" in low:
                    out["role_desc"] = clean(candidate)
                    break
            break
    try:
        start = next(i for i, x in enumerate(lines) if clean(x).lower() == "special action")
    except StopIteration:
        return out
    stop = len(lines)
    for i in range(start + 1, len(lines)):
        low = clean(lines[i]).lower()
        if "special values" in low or (i > start + 3 and low == "stats"):
            stop = i
            break
    parts = [clean(x) for x in lines[start + 1 : stop] if clean(x) and clean(x).lower() not in {"image"}]
    names: list[str] = []
    descs: list[str] = []
    i = 0
    while i < len(parts):
        name = parts[i]
        if i + 1 < len(parts):
            desc = parts[i + 1]
            if len(desc) > 25 and not re.match(r"^(Damage|Ammo|Level|Type)\b", desc, re.I):
                names.append(name); descs.append(desc); i += 2; continue
        i += 1
    out["special_name"] = " / ".join(names[:2])
    out["special_desc"] = "<br><br>".join(descs[:2])
    return out


def clean_table(table: dict[str, Any], lang: str) -> dict[str, Any]:
    cols = list(table.get("columns") or table.get("cols") or [])
    rows = [list(r) for r in (table.get("rows") or [])]
    drop = [i for i, c in enumerate(cols) if norm(c) == "down_power"]
    for idx in reversed(drop):
        cols.pop(idx)
        for row in rows:
            if idx < len(row):
                row.pop(idx)
    labels_fr = {"level": "Niveau", "damage": "Dégâts", "ammo": "Munitions", "use_ammo": "Consommation", "reload": "Recharge", "type": "Type", "level_up_effect": "Effet"}
    labels_en = {"level": "Level", "damage": "Damage", "ammo": "Ammo", "use_ammo": "Use Ammo", "reload": "Reload", "type": "Type", "level_up_effect": "Level Up Effect"}
    labels = labels_en if lang == "en" else labels_fr
    cols = [labels.get(norm(c), without_cjk(c)) for c in cols]
    rows = [[without_cjk(x) for x in row] for row in rows]
    return {"columns": cols, "rows": rows}


def parse_flexible_table(lines: list[str], marker: str, additional: bool = False) -> dict[str, Any]:
    idx = next((i for i, x in enumerate(lines) if marker.lower() in clean(x).lower()), -1)
    if idx < 0:
        return {"columns": [], "rows": []}
    stop_words = ("base α", "base β", "base γ", "additional α", "additional β", "additional γ", "quirk skill", "special action", "stats", "tuning skills")
    body: list[str] = []
    for x in lines[idx + 1 :]:
        low = clean(x).lower()
        if body and any(w in low for w in stop_words):
            break
        if clean(x):
            body.append(clean(x))
    if not body:
        return {"columns": [], "rows": []}
    header = body.pop(0)
    # Normalize multi-word headings before splitting.
    header = re.sub(r"Use\s+Ammo", "Use_Ammo", header, flags=re.I)
    header = re.sub(r"Down\s+Power", "Down_Power", header, flags=re.I)
    header = re.sub(r"Level\s+Up\s+Effect", "Level_Up_Effect", header, flags=re.I)
    cols = [x.replace("_", " ") for x in header.split()]
    rows: list[list[str]] = []
    if additional:
        for line in body:
            m = re.match(r"(.+?)\s+(Lv\.\d+)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)$", line)
            if m:
                rows.append([m.group(1), m.group(2), m.group(3), m.group(4)])
    else:
        for line in body:
            if not re.match(r"^Lv\.\d+\b", line):
                continue
            parts = line.split()
            if len(parts) >= len(cols):
                rows.append(parts[: len(cols)])
    return {"columns": cols, "rows": rows}


def parse_special_table(lines: list[str]) -> dict[str, Any]:
    idx = next((i for i, x in enumerate(lines) if "special values" in clean(x).lower()), -1)
    if idx < 0 or idx + 2 >= len(lines):
        return {"columns": [], "rows": []}
    header = clean(lines[idx + 1])
    header = re.sub(r"Use\s+Ammo", "Use_Ammo", header, flags=re.I)
    header = re.sub(r"Down\s+Power", "Down_Power", header, flags=re.I)
    cols = [x.replace("_", " ") for x in header.split()]
    for line in lines[idx + 2 : idx + 8]:
        parts = clean(line).split()
        if len(parts) >= len(cols) and any(re.search(r"\d", x) for x in parts):
            return {"columns": cols, "rows": [parts[: len(cols)]]}
    return {"columns": [], "rows": []}


def display_name(value: Any) -> str:
    return re.sub(r"^[|:—–-]+\s*", "", without_cjk(value))


def bilingual_table(title_fr: str, title_en: str, fr_table: dict[str, Any], en_table: dict[str, Any]) -> dict[str, Any] | None:
    ft = clean_table(fr_table, "fr")
    et = clean_table(en_table, "en")
    chosen = ft if ft.get("rows") else et
    if not chosen.get("rows"):
        return None
    return {
        "title": {"fr": title_fr, "en": title_en},
        "cols": {
            "fr": ft.get("columns") or clean_table(chosen, "fr")["columns"],
            "en": et.get("columns") or clean_table(chosen, "en")["columns"],
        },
        # Some text tables (notably level-up effects) differ by language.
        # The browser compatibility layer selects the correct row set.
        "rows": {
            "fr": ft.get("rows") or et.get("rows") or [],
            "en": et.get("rows") or ft.get("rows") or [],
        },
    }


def role_description(role: str) -> tuple[str, str]:
    values = {
        "technical": ("Augmente la vitesse de rechargement de toute l'équipe. Plus il y a de membres avec le même rôle dans l'équipe, plus l'effet est amplifié.", "Gives your entire team Reload Speed UP! The more teammates with the same role, the stronger the effect!"),
        "strike": ("Augmente la puissance d'attaque de toute l'équipe. Plus il y a de membres avec le même rôle dans l'équipe, plus l'effet est amplifié.", "Gives your entire team Attack Power UP! The more teammates with the same role, the stronger the effect!"),
        "assault": ("Augmente la défense de toute l'équipe. Plus il y a de membres avec le même rôle dans l'équipe, plus l'effet est amplifié.", "Gives your entire team Defense UP! The more teammates with the same role, the stronger the effect!"),
        "rapid": ("Augmente la vitesse de déplacement de toute l'équipe. Plus il y a de membres avec le même rôle dans l'équipe, plus l'effet est amplifié.", "Gives your entire team Movement Speed UP! The more teammates with the same role, the stronger the effect!"),
        "support": ("Améliore les capacités de récupération de toute l'équipe. Plus il y a de membres avec le même rôle dans l'équipe, plus l'effet est amplifié.", "Improves your team's recovery abilities. The more teammates with the same role, the stronger the effect!"),
    }
    return values.get(role, values["support"])


def localized_generated_style(module: Any, row_en: dict[str, Any], row_fr: dict[str, Any], html_en: str, html_fr: str, paths: dict[str, str]) -> dict[str, Any]:
    role = module.ROLE_MAP.get(norm(row_en.get("role")), norm(row_en.get("role")) or "support")
    lines_en, lines_fr = extract_lines(module, html_en, row_en.get("source_url", "")), extract_lines(module, html_fr, row_fr.get("source_url", ""))
    rich_en, rich_fr = character_rich(lines_en), character_rich(lines_fr)
    rfr, ren = role_description(role)
    skills: list[dict[str, Any]] = []
    for sym, asset_key in (("α", "alpha"), ("β", "beta"), ("γ", "gamma")):
        en = (row_en.get("skills") or {}).get(sym) or {}
        fr = (row_fr.get("skills") or {}).get(sym) or {}
        # Flexible parser repairs skills whose base table has no Damage/Down Power columns.
        base_en = parse_flexible_table(lines_en, f"Base {sym} Values")
        base_fr = parse_flexible_table(lines_fr, f"Base {sym} Values")
        add_en = parse_flexible_table(lines_en, f"Additional {sym}", True)
        add_fr = parse_flexible_table(lines_fr, f"Additional {sym}", True)
        if not base_en.get("rows"):
            base_en = en.get("base_values") or {}
        if not base_fr.get("rows"):
            base_fr = fr.get("base_values") or {}
        if not add_en.get("rows"):
            add_en = en.get("additional_values") or {}
        if not add_fr.get("rows"):
            add_fr = fr.get("additional_values") or {}
        tables: list[dict[str, Any]] = []
        level = bilingual_table(f"Effets de montée {sym}", f"Level-up effects {sym}", fr.get("level_up_effects") or {}, en.get("level_up_effects") or {})
        base = bilingual_table(f"Valeurs {sym}", f"{sym} values", base_fr, base_en)
        additional = bilingual_table(f"Valeurs supplémentaires {sym}", f"Additional {sym} values", add_fr, add_en)
        tables.extend(x for x in (level, base, additional) if x)
        skills.append({
            "letter": sym,
            "name": {"fr": display_name(fr.get("name") or en.get("name") or f"Alter {sym}"), "en": display_name(en.get("name") or f"Quirk Skill {sym}")},
            "img": paths.get(asset_key, ""),
            "desc": {"fr": without_cjk(fr.get("description") or en.get("description") or ""), "en": without_cjk(en.get("description") or "")},
            "tables": tables,
        })
    special_tables: list[dict[str, Any]] = []
    special_en = parse_special_table(lines_en)
    special_fr = parse_special_table(lines_fr)
    if not special_en.get("rows"):
        special_en = row_en.get("special_action", {}).get("values", {})
    if not special_fr.get("rows"):
        special_fr = row_fr.get("special_action", {}).get("values", {})
    sv = bilingual_table("Valeurs Action spéciale", "Special Action values", special_fr, special_en)
    if sv:
        special_tables.append(sv)
    return {
        "name": {"fr": without_cjk(row_fr.get("style_name") or row_en.get("style_name") or "Original"), "en": without_cjk(row_en.get("style_name") or "Original")},
        "role": role,
        "portrait": paths.get("portrait", ""),
        "pv": module.health_from_stats(row_en.get("stats") or {}),
        "description": {"fr": rich_fr.get("description") or rfr, "en": rich_en.get("description") or ren},
        "roleDesc": {"fr": rich_fr.get("role_desc") or rfr, "en": rich_en.get("role_desc") or ren},
        "special": {
            "name": {"fr": without_cjk(rich_fr.get("special_name") or "Action spéciale"), "en": without_cjk(rich_en.get("special_name") or "Special Action")},
            "img": paths.get("special", ""),
            "desc": {"fr": without_cjk(rich_fr.get("special_desc") or ""), "en": without_cjk(rich_en.get("special_desc") or "")},
            "tables": special_tables,
        },
        "skills": skills,
        "__generated": True,
        "__sourceUrl": row_en.get("source_url", ""),
    }


def localized_tunings(row_en: dict[str, Any], row_fr: dict[str, Any], paths: dict[str, str]) -> list[dict[str, Any]]:
    role = norm(row_en.get("role")) or "support"
    out: list[dict[str, Any]] = []
    en_sp, fr_sp = row_en.get("special_tuning") or {}, row_fr.get("special_tuning") or {}
    if en_sp.get("name") or fr_sp.get("name"):
        out.append({
            "role": role, "img": paths.get("tuning", ""), "type": "SP",
            "name": {"fr": display_name(fr_sp.get("name") or en_sp.get("name")), "en": display_name(en_sp.get("name"))},
            "desc": {"fr": without_cjk(fr_sp.get("description") or en_sp.get("description")), "en": without_cjk(en_sp.get("description"))},
            "levels": en_sp.get("levels") or fr_sp.get("levels") or [],
        })
    en_norm, fr_norm = row_en.get("normal_tuning") or [], row_fr.get("normal_tuning") or []
    if en_norm or fr_norm:
        effects: list[dict[str, Any]] = []
        for i in range(max(len(en_norm), len(fr_norm))):
            en = en_norm[i] if i < len(en_norm) else {}
            fr = fr_norm[i] if i < len(fr_norm) else {}
            effects.append({
                "name": {"fr": display_name(fr.get("name") or en.get("name")), "en": display_name(en.get("name"))},
                "desc": {"fr": without_cjk(fr.get("description") or en.get("description")), "en": without_cjk(en.get("description"))},
                "levels": en.get("levels") or fr.get("levels") or [],
            })
        out.append({"role": role, "type": "normal", "name": {"fr": "Compétences normales", "en": "Normal T.U.N.I.N.G Skills"}, "desc": {"fr": "", "en": ""}, "effects": effects})
    return out


def parse_costume_listing(html: str, base: str) -> dict[str, dict[str, Any]]:
    soup = BeautifulSoup(html, "lxml")
    result: dict[str, dict[str, Any]] = {}
    section = "available"
    for node in soup.find_all(["h1", "h2", "h3", "a"]):
        if node.name in {"h1", "h2", "h3"}:
            text = clean(node.get_text(" ")).lower()
            if "upcoming costumes" in text:
                section = "upcoming"
            elif text == "costumes" or text.endswith(" costumes") and "upcoming" not in text:
                section = "available"
            continue
        href = urljoin(base, node.get("href", ""))
        m = re.search(r"/costume/(\d+)", href)
        if not m:
            continue
        text = clean(node.get_text(" "))
        date_m = DATE_RE.search(text)
        date = iso_jst(date_m.group(0)) if date_m else None
        title_part = text[: date_m.start()].strip() if date_m else text
        after = text[date_m.end() :].strip() if date_m else ""
        group, variant = split_title(title_part)
        result[m.group(1)] = {
            "title": title_part, "group": group, "variant": variant,
            "releaseDate": date, "upcoming": section == "upcoming" and bool(date),
            "acquisition": after, "url": href,
        }
    return result


def split_title(title: str) -> tuple[str, str]:
    title = clean(title)
    m = re.match(r"^(.*?)\s*\(([^()]*)\)\s*$", title)
    if not m:
        return title, "Original"
    return clean(m.group(1)), clean(m.group(2)) or "Original"


def character_source_map(root: Path, payload: dict[str, Any]) -> dict[str, tuple[str, str]]:
    out: dict[str, tuple[str, str]] = {}
    for row in json.loads((root / "data/local_style_map.json").read_text(encoding="utf-8")):
        url = str(row.get("source_url") or "")
        if url:
            out[url] = (str(row.get("character_id") or ""), str(row.get("style_key") or ""))
    return out


def parse_latest_releases(session: requests.Session, root: Path, payload: dict[str, Any]) -> list[dict[str, Any]]:
    soup = BeautifulSoup(get(session, BASE), "lxml")
    source_map = character_source_map(root, payload)
    local_rows = json.loads((root / "data/local_style_map.json").read_text(encoding="utf-8"))
    local_by_style = {str(x.get("style_key") or ""): x for x in local_rows}
    by_character_number: dict[str, list[tuple[str, str, str]]] = {}
    for url, (cid, style) in source_map.items():
        m = re.search(r"/character/(\d+)", url)
        if m:
            by_character_number.setdefault(m.group(1), []).append((url, cid, style))
    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    for node in section_nodes(soup, "Latest Releases"):
        if node.name != "a" or not node.get("href"):
            continue
        href = urljoin(BASE, node.get("href"))
        m = re.search(r"/character/(\d+)(?:#Variant-(\d+))?", href, re.I)
        if not m or href in seen:
            continue
        seen.add(href)
        candidates = by_character_number.get(m.group(1), [])
        variant = int(m.group(2) or 0)
        match = next((x for x in candidates if (int((re.search(r"#Variant-(\d+)", x[0], re.I) or ["", "0"])[1]) == variant)), None)
        cid, style_id = (match[1], match[2]) if match else ("", "")
        title = ""
        subtitle = ""
        local_info = local_by_style.get(style_id) or {}
        if local_info:
            title = clean(local_info.get("character_name"))
            subtitle = clean(local_info.get("style_name"))
        if cid and not title:
            char = next((x for x in payload.get("generated_characters", []) if x.get("id") == cid), None)
            if char:
                title = char.get("name", "")
        if style_id and not subtitle:
            st = payload.get("generated_styles", {}).get(style_id) or {}
            name = st.get("name")
            subtitle = name.get("fr") if isinstance(name, dict) else str(name or "")
        if not title:
            title = clean(node.get("aria-label") or node.get("title") or node.get_text(" "))
        img = node.find("img")
        src = urljoin(BASE, (img.get("src") or img.get("data-src") or "")) if img else ""
        art = download_image(session, root, src, f"assets/home/releases/s18_{m.group(1)}_{variant}") if src else ""
        rows.append({
            "title": title or f"Character {m.group(1)}",
            "subtitle": subtitle or ("Personnage jouable" if variant == 0 else "Nouveau style"),
            "subtitle_fr": subtitle or ("Personnage jouable" if variant == 0 else "Nouveau style"),
            "subtitle_en": ("Playable character" if variant == 0 else (subtitle or "New battle style")),
            "character_id": cid, "style_id": style_id, "source_url": href,
            "release_kind": "character" if variant == 0 else "style", "art": art or src, "word": "NEW!",
        })
    return rows[:8]


def ensure_assets_in_index(root: Path) -> None:
    """Install the Season 18 layer in a deterministic order.

    The homepage release renderer must be replaced *before* the first layout()
    call, otherwise visitors briefly see the old empty red cards.  Character
    data and the exact UltraRumble payload are available later in the page, so
    the heavier compatibility layer remains just before </body>.
    """
    idx = root / "index.html"
    text = idx.read_text(encoding="utf-8", errors="ignore")
    version = "14000"
    css = f'<link rel="stylesheet" href="css/season18-fixes.css?v={version}">'
    early = f'<script src="data/season18_sync.js?v={version}"></script>\n<script src="js/season18-early.js?v={version}"></script>'
    late = f'<script src="js/season18-fixes.js?v={version}"></script>\n<script src="js/season18-v12.js?v={version}"></script>'

    # Remove every previous injection so repeated updates stay idempotent.
    patterns = (
        r'\s*<link rel="stylesheet" href="css/season18-fixes\.css[^>]*>\s*',
        r'\s*<script src="data/season18_sync\.js[^>]*></script>\s*',
        r'\s*<script src="js/season18-early\.js[^>]*></script>\s*',
        r'\s*<script src="js/season18-fixes\.js[^>]*></script>\s*',
        r'\s*<script src="js/season18-v12\.js[^>]*></script>\s*',
    )
    for pattern in patterns:
        text = re.sub(pattern, "\n", text)

    # Header idempotent: remove every old Notes button left by prior updates
    # and every moderation launcher from the header before inserting one button.
    text = re.sub(
        r'<button\b[^>]*(?:id=["\'][^"\']*(?:mhurAdminButton|mhurPatchDevButton)[^"\']*["\']|class=["\'][^"\']*(?:mhurAdminTopButton|mhurPatchDevButton)[^"\']*["\'])[^>]*>[\s\S]*?</button>\s*',
        '',
        text,
        flags=re.I,
    )
    # Also remove duplicated notes launchers identified by their visible label.
    text = re.sub(
        r'<button\b[^>]*>[\s\S]{0,500}?(?:Notes de patch|Patch Notes)[\s\S]{0,500}?</button>\s*',
        '',
        text,
        flags=re.I,
    )
    patch_button = (
        '<button id="mhurPatchDevButtonV14" data-s18-notes-button="1" '
        'class="nexusHeaderBtn mhurPatchDevButtonV10 mhurPatchDevButtonV14" '
        'type="button" '
        'onclick="window.MHUR_S18_V14?.openNotes?.() || window.MHUR_S18_OPEN_NOTES_EARLY?.()">'
        '<span class="mhurPatchDevIconV12">📝</span>'
        '<span>Notes de patch / Notes des développeurs</span>'
        '</button>\n'
    )
    account_match = re.search(r'<button\b[^>]*id=["\']mhurAccountButton["\']', text, flags=re.I)
    if account_match:
        text = text[:account_match.start()] + patch_button + text[account_match.start():]

    preload = "\n".join([
        '<link rel="preload" as="image" href="assets/home/season18/gentle_s18_banner.webp">',
        '<link rel="preload" as="image" href="assets/home/season18/twice_s18_banner.webp">',
        '<link rel="preload" as="image" href="assets/home/season18/tsuyu_profile.webp">',
        '<link rel="preload" as="image" href="assets/home/icons/new_badge_custom.png">',
    ])
    text = re.sub(r'\s*<link rel="preload" as="image" href="assets/home/season18/[^"]+">', '', text)
    text = re.sub(r'\s*<link rel="preload" as="image" href="assets/home/icons/new_badge_custom\.png">', '', text)

    if "</head>" in text:
        text = text.replace("</head>", f"\n{preload}\n{css}\n</head>", 1)
    else:
        text = preload + "\n" + css + "\n" + text

    home_script = re.search(r'<script src="js/home\.js[^>]*></script>', text)
    if home_script:
        pos = home_script.end()
        text = text[:pos] + "\n" + early + text[pos:]
    elif "</body>" in text:
        text = text.replace("</body>", early + "\n</body>", 1)

    if "</body>" in text:
        text = text.replace("</body>", f"\n<!-- Season 18 v14 compatibility layer. -->\n{late}\n</body>", 1)
    else:
        text += "\n" + late
    idx.write_text(text, encoding="utf-8")


def official_portrait_candidates(row: dict[str, Any]) -> list[str]:
    """Return likely UltraRumble Database portrait URLs for a battle style.

    Original styles expose the portrait directly. Some variant pages only
    expose skill assets, so derive the FaceIcon path and keep several filename
    patterns before falling back to the site's existing local portrait.
    """
    assets = row.get("assets") or {}
    out: list[str] = []
    if assets.get("portrait"):
        out.append(str(assets["portrait"]))
    alpha = str(assets.get("alpha") or "")
    if alpha:
        base = alpha.replace("/GUI/Skill/", "/GUI/FaceIcon/")
        m = re.search(r"T_ui_Skill_(Ch\d+)_Unique1\.png", base, re.I)
        if m:
            code = m.group(1)
            out.extend([
                re.sub(r"T_ui_Skill_Ch\d+_Unique1\.png", f"T_ui_{code}_CharaImage.png", base, flags=re.I),
                re.sub(r"T_ui_Skill_Ch\d+_Unique1\.png", f"T_ui_{code}_CharaImage_01.png", base, flags=re.I),
            ])
            variant = int(row.get("variant_index") or 0)
            if variant:
                out.extend([
                    re.sub(r"T_ui_Skill_Ch\d+_Unique1\.png", f"T_ui_{code}_{variant:02d}_CharaImage.png", base, flags=re.I),
                    re.sub(r"T_ui_Skill_Ch\d+_Unique1\.png", f"T_ui_{code}_Var{variant:02d}_CharaImage.png", base, flags=re.I),
                ])
    return list(dict.fromkeys(x for x in out if x))


def download_official_portraits(session: requests.Session, root: Path, exact: dict[str, Any]) -> dict[str, str]:
    result: dict[str, str] = {}
    for style_key, row in exact.items():
        for url in official_portrait_candidates(row or {}):
            try:
                response = session.get(url, headers={**HEADERS, "Accept": "image/avif,image/webp,image/*,*/*;q=0.8"}, timeout=30)
                response.raise_for_status()
                if len(response.content) < 500:
                    continue
                ext = Path(urlparse(url).path).suffix.lower()
                if ext not in {".png", ".jpg", ".jpeg", ".webp", ".avif"}:
                    ext = ".png"
                rel = Path("assets/characters/official_portraits") / f"{style_key}{ext}"
                dst = root / rel
                dst.parent.mkdir(parents=True, exist_ok=True)
                dst.write_bytes(response.content)
                result[str(style_key)] = rel.as_posix()
                break
            except requests.RequestException:
                continue
    print(f"[S18 PORTRAITS] officiels={len(result)}/{len(exact)}", flush=True)
    return result


def patch_full(root: Path, session: requests.Session) -> None:
    tools = Path(__file__).resolve().parent
    updater = load_module(tools / "update_ultrarumble_data.py", "mhur_update_s18")
    payload_path = root / "data/ultrarumble/site_data_latest.json"
    payload = json.loads(payload_path.read_text(encoding="utf-8"))
    exact = payload.get("exact_by_style") or {}
    official_portraits = download_official_portraits(session, root, exact)
    generated_styles = payload.get("generated_styles") or {}
    generated_tunings = payload.get("generated_tunings") or {}
    local_rows = json.loads((root / "data/local_style_map.json").read_text(encoding="utf-8"))
    generated_records = [x for x in local_rows if x.get("generated")]

    new_style_keys: list[str] = []
    known_path = root / "data/ultrarumble/season18_known_content.json"
    known = json.loads(known_path.read_text(encoding="utf-8")) if known_path.exists() else {"styles": [], "costumes": []}
    known_styles = set(known.get("styles") or [])

    for local in generated_records:
        style_key = str(local.get("style_key") or "")
        row_en = exact.get(style_key)
        if not style_key or not row_en:
            continue
        source = str(row_en.get("source_url") or local.get("source_url") or "")
        try:
            html_en = get(session, source)
            fr_url = source.replace(BASE.rstrip("/"), FR_BASE.rstrip("/"), 1)
            html_fr = get(session, fr_url)
            row_fr = updater.parse_character(fr_url, html_fr)
            paths = {}
            existing = generated_styles.get(style_key) or {}
            paths["portrait"] = existing.get("portrait", "")
            paths["special"] = (existing.get("special") or {}).get("img", "")
            for skill, key in zip(existing.get("skills") or [], ("alpha", "beta", "gamma")):
                paths[key] = skill.get("img", "")
            existing_tuning = generated_tunings.get(style_key) or []
            paths["tuning"] = next((x.get("img", "") for x in existing_tuning if x.get("img")), "")
            generated_styles[style_key] = localized_generated_style(updater, row_en, row_fr, html_en, html_fr, paths)
            generated_tunings[style_key] = localized_tunings(row_en, row_fr, paths)
            if style_key not in known_styles:
                new_style_keys.append(style_key)
            print(f"[S18 CHARACTER] {style_key} bilingue, descriptions et tableaux corrigés", flush=True)
        except Exception as exc:
            print(f"[S18 CHARACTER WARNING] {style_key}: {exc}", flush=True)

    payload["generated_styles"] = generated_styles
    payload["generated_tunings"] = generated_tunings
    payload.setdefault("meta", {})["season18_postprocess"] = datetime.now(timezone.utc).isoformat()
    payload_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    updater.apply_index(root, payload)

    # Bilingual release-aware costume metadata.
    en_list = parse_costume_listing(get(session, urljoin(BASE, "costumes")), BASE)
    fr_list = parse_costume_listing(get(session, urljoin(FR_BASE, "costumes")), FR_BASE)
    costume_meta: dict[str, dict[str, Any]] = {}
    ids = sorted(set(en_list) | set(fr_list), key=lambda x: int(x))
    now = datetime.now(timezone.utc)
    for rid in ids:
        en, fr = en_list.get(rid, {}), fr_list.get(rid, {})
        date = en.get("releaseDate") or fr.get("releaseDate")
        future = False
        if date:
            try:
                future = datetime.fromisoformat(date).astimezone(timezone.utc) > now
            except ValueError:
                future = bool(en.get("upcoming") or fr.get("upcoming"))
        costume_meta[rid] = {
            "id": rid,
            "group_fr": fr.get("group") or en.get("group") or "Costume",
            "group_en": en.get("group") or fr.get("group") or "Costume",
            "variant_fr": fr.get("variant") or en.get("variant") or "Original",
            "variant_en": en.get("variant") or fr.get("variant") or "Original",
            "acquisition_fr": fr.get("acquisition") or "",
            "acquisition_en": en.get("acquisition") or "",
            "releaseDate": date,
            "upcoming": future,
        }

    report_path = root / "data/ultrarumble/costume_update_report.json"
    report = json.loads(report_path.read_text(encoding="utf-8")) if report_path.exists() else {}
    added_costumes = [str(x) for x in report.get("added_ids", [])]
    if not added_costumes and report.get("added"):
        # Fallback for the first run with the older updater: mark only future IDs,
        # never the whole historical catalogue.
        added_costumes = [rid for rid, x in costume_meta.items() if x.get("upcoming")]

    releases = parse_latest_releases(session, root, payload)
    home_path = root / "data/home_data.json"
    home = json.loads(home_path.read_text(encoding="utf-8")) if home_path.exists() else {}
    if releases:
        home["latest_releases"] = releases
        home_path.write_text(json.dumps(home, ensure_ascii=False, indent=2), encoding="utf-8")
        (root / "data/home_data.js").write_text("window.MHUR_HOME_DATA = " + json.dumps(home, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")

    release_style_keys = {
        str(x.get("style_id") or "") for x in releases
        if str(x.get("release_kind") or "").lower() == "style" and str(x.get("style_id") or "")
    }
    release_character_ids = {
        str(x.get("character_id") or "") for x in releases
        if str(x.get("release_kind") or "").lower() == "character" and str(x.get("character_id") or "")
    }
    # The homepage is the safest source for the current season's newly released
    # characters/styles. Keep these flags until the next synchronization, even
    # when the historical known-content file was already written by a prior run.
    new_style_keys = sorted(set(new_style_keys) | release_style_keys)
    generated_new_characters = {
        str(x.get("character_id")) for x in generated_records
        if str(x.get("style_key")) in set(new_style_keys) and str(x.get("character_id") or "")
    }
    sync_data = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "costumes": costume_meta,
        "official_portraits": official_portraits,
        "new_content": {
            "styles": new_style_keys,
            "characters": sorted(generated_new_characters | release_character_ids),
            "costumes": added_costumes,
        },
    }
    (root / "data/season18_sync.js").write_text("window.MHUR_SEASON18_DATA = " + json.dumps(sync_data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    known_path.write_text(json.dumps({"styles": sorted({str(x.get('style_key')) for x in generated_records}), "costumes": ids, "updated_at": sync_data["updated_at"]}, ensure_ascii=False, indent=2), encoding="utf-8")
    ensure_assets_in_index(root)
    print(f"[S18 FULL] styles_new={len(new_style_keys)} costumes={len(costume_meta)} upcoming={sum(1 for x in costume_meta.values() if x.get('upcoming'))}", flush=True)


def main() -> int:
    configure_stdio()
    ap = argparse.ArgumentParser()
    ap.add_argument("--site-root", default=".")
    ap.add_argument("--phase", choices=["home", "full"], required=True)
    args = ap.parse_args()
    root = Path(args.site_root).resolve()
    # Install the lightweight frontend layer without replacing the user's large
    # index.html. Existing generated characters/costumes therefore stay intact.
    ensure_assets_in_index(root)
    session = requests.Session()
    session.headers.update(HEADERS)
    if args.phase == "home":
        patch_home(root, session)
    else:
        patch_full(root, session)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
