#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup, NavigableString, Tag

BASE = "https://ultrarumble.com/"
PATCH_ARCHIVE_IDS = ['1783497169', '1782273704', '1781064165', '1780384366', '1779934289', '1779836241', '1776813970', '1775599507', '1774397314', '1770177919', '1768924815', '1767762097', '1764737973', '1763569564', '1762315281', '1761105736', '1759896564', '1759294389', '1758686428', '1756872004', '1755663674', '1750221960', '1750219260', '1749054000', '1747813500', '1747799940', '1742966220']

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 Chrome/126 Safari/537.36"
    )
}
ITEM_ROUTES = (
    "character", "costume", "appeal", "voice", "gallery", "emblem",
    "nameplate", "currency", "item", "mission", "tuning"
)
_tls = threading.local()


def clean(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def absolute(url: str) -> str:
    return urljoin(BASE, clean(url)) if url else ""


def slug(value: str, limit: int = 80) -> str:
    out = re.sub(r"[^a-z0-9]+", "_", clean(value).lower()).strip("_")
    return (out or "asset")[:limit]


def parse_dates(text: str):
    values = re.findall(r"(20\d{2}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})", text)
    found = [(v.replace(" ", "T") + "+09:00") for v in values[:2]]
    return tuple(found + [None] * (2 - len(found)))


def request_session() -> requests.Session:
    session = getattr(_tls, "session", None)
    if session is None:
        session = requests.Session()
        session.headers.update(HEADERS)
        _tls.session = session
    return session


def get(session: requests.Session, url: str, retries: int = 5):
    error = None
    for attempt in range(retries):
        try:
            response = session.get(url, headers=HEADERS, timeout=60)
            response.raise_for_status()
            return response
        except Exception as exc:  # network failures must not destroy the local site
            error = exc
            if attempt + 1 < retries:
                time.sleep(1.4 * (attempt + 1))
    raise error


def existing_asset(root: Path, rel_stem: str) -> str:
    stem = root / rel_stem
    for candidate in stem.parent.glob(stem.name + ".*"):
        if candidate.is_file() and candidate.stat().st_size >= 600:
            return candidate.relative_to(root).as_posix()
    return ""


def download_asset(root: Path, url: str, rel_stem: str, retries: int = 4) -> str:
    if not url:
        return ""
    cached = existing_asset(root, rel_stem)
    if cached:
        return cached
    try:
        response = get(request_session(), url, retries)
        ctype = (response.headers.get("content-type") or "").lower()
        extension = Path(urlparse(url).path).suffix.lower()
        if extension not in (".webp", ".png", ".jpg", ".jpeg", ".gif"):
            extension = mimetypes.guess_extension(ctype.split(";")[0]) or ".webp"
        if len(response.content) < 500:
            raise ValueError("fichier image trop petit")
        rel = Path(rel_stem + extension)
        output = root / rel
        output.parent.mkdir(parents=True, exist_ok=True)
        temp = output.with_suffix(output.suffix + ".tmp")
        temp.write_bytes(response.content)
        temp.replace(output)
        return rel.as_posix()
    except Exception as exc:
        print(f"[HOME IMAGE WARNING] {url}: {exc}", flush=True)
        return ""


def section_after_heading(soup: BeautifulSoup, needle: str):
    heading = next(
        (
            tag for tag in soup.find_all(["h1", "h2", "h3", "h4", "h5"])
            if needle.lower() in clean(tag.get_text(" ")).lower()
        ),
        None,
    )
    if not heading:
        return []
    output = []
    for tag in heading.find_all_next():
        if tag is not heading and tag.name in ("h1", "h2"):
            break
        output.append(tag)
    return output


def anchors_in_section(soup: BeautifulSoup, needle: str, href_re: str | None = None):
    output, seen = [], set()
    for tag in section_after_heading(soup, needle):
        if tag.name != "a":
            continue
        href = absolute(tag.get("href"))
        if href_re and not re.search(href_re, href):
            continue
        if href in seen:
            continue
        seen.add(href)
        output.append(tag)
    return output


def route_link(node: Tag | None) -> Tag | None:
    if not isinstance(node, Tag):
        return None
    candidates = []
    if node.name == "a" and node.get("href"):
        candidates.append(node)
    candidates.extend(node.find_all("a", href=True))
    for link in candidates:
        href = absolute(link.get("href"))
        if any(f"/{route}/" in href for route in ITEM_ROUTES):
            return link
    return None


def kind_from_href(href: str, image_url: str = "", alt: str = "") -> str:
    """
    Détermine d'abord le type avec le véritable visuel de la récompense.
    Cela évite qu'un lien de personnage présent dans un conteneur parent
    transforme un costume, une emote ou une voix en personnage.
    """
    image_value = (image_url + " " + alt).lower()
    href_value = (href or "").lower()

    if "/gui/costume/" in image_value or "/costume/" in image_value:
        return "Costume"
    if "/gui/appeal/" in image_value or "/appeal/" in image_value or " emote" in image_value:
        return "Emote"
    if "/gui/voice/" in image_value or "/voice/" in image_value or " voice [" in image_value:
        return "Voix"
    if "/gui/gallery/" in image_value or "/gallery/" in image_value:
        return "Illustration"
    if "/gui/emblem/" in image_value or "/emblem/" in image_value:
        return "Emblème"
    if "/gui/nameplate/" in image_value or "/nameplate/" in image_value:
        return "Plaque"

    if "/costume/" in href_value:
        return "Costume"
    if "/appeal/" in href_value:
        return "Emote"
    if "/voice/" in href_value:
        return "Voix"
    if "/gallery/" in href_value:
        return "Illustration"
    if "/emblem/" in href_value:
        return "Emblème"
    if "/nameplate/" in href_value:
        return "Plaque"
    if "/tuning/" in href_value:
        return "T.U.N.I.N.G"
    if "/character/" in href_value:
        return "Personnage / Alter"
    return "Objet"

def image_urls(node: Tag | None):
    if not isinstance(node, Tag):
        return []
    output = []
    for image in node.find_all("img"):
        raw = image.get("src") or image.get("data-src") or image.get("data-lazy-src") or ""
        if not raw and image.get("srcset"):
            raw = image.get("srcset").split(",")[0].strip().split(" ")[0]
        url = absolute(raw)
        if not url:
            continue
        low = url.lower()
        if any(
            token in low
            for token in (
                "frame", "rarity", "star", "blocker", "logo", "arrow",
                "icon_role", "gashathumb_bg", "common_bg", "loading"
            )
        ):
            continue
        output.append((url, clean(image.get("alt"))))
    return output


def best_image(node: Tag | None, name: str = "", id_hint: str = "") -> str:
    candidates = image_urls(node)
    if not candidates:
        return ""
    normalized_name = slug(name, 120)
    ranked = []
    for index, (url, alt) in enumerate(candidates):
        low = url.lower()
        score = 0
        if id_hint and id_hint in low:
            score += 30
        if "/character/" in low:
            score += 12
        if "thumb" in low or "/gui/" in low:
            score += 10
        if "_ll" in low or "_s." in low:
            score += 4
        if normalized_name and normalized_name in slug(alt, 120):
            score += 7
        if any(token in low for token in ("banner", "gasha_", "header")):
            score -= 8
        ranked.append((score, -index, url))
    ranked.sort(reverse=True)
    return ranked[0][2]


def nearest_single_record(parent: Tag, token_regex: str) -> Tag:
    best = parent
    current: Tag | None = parent
    for _ in range(12):
        if not isinstance(current, Tag):
            break
        text = clean(current.get_text(" "))
        count = len(re.findall(token_regex, text, re.I))
        if count == 1:
            best = current
            if route_link(current) is not None or image_urls(current):
                return current
        elif count > 1:
            break
        current = current.parent if isinstance(current.parent, Tag) else None
    return best


def marker(soup: BeautifulSoup, predicate) -> Tag | None:
    for names in (("h1", "h2", "h3", "h4", "h5"), ("a", "button", "div")):
        for tag in soup.find_all(list(names)):
            text = clean(tag.get_text(" "))
            if len(text) <= 180 and predicate(text.lower()):
                return tag
    return None


def gacha_heading(soup: BeautifulSoup, mode: str) -> Tag | None:
    """Trouve le vrai titre H1/H2/H3, jamais le bouton d'onglet."""
    for tag in soup.find_all(["h1", "h2", "h3", "h4", "h5"]):
        text = clean(tag.get_text(" ")).lower()
        if mode == "exchange" and text == "exchange":
            return tag
        if mode == "normal" and "normal" in text and "10x" in text and "9 of" in text:
            return tag
        if mode == "guaranteed" and "10x" in text and (
            "or higher" in text or "ou plus" in text or "以上" in text
        ):
            return tag
    return None


def position_range(soup: BeautifulSoup, start: Tag | None, end: Tag | None):
    tags, positions = ordered_tag_positions(soup)
    return tags, positions, positions.get(id(start), -1), (
        positions.get(id(end), 10**12) if end is not None else 10**12
    )


def record_container(node: Tag, token_regex: str) -> Tag:
    current = node
    best = node
    for _ in range(16):
        if not isinstance(current, Tag):
            break
        text = clean(current.get_text(" "))
        count = len(re.findall(token_regex, text, re.I))
        if count == 1:
            best = current
            if image_urls(current) and route_link(current) is not None:
                return current
        elif count > 1:
            break
        if not isinstance(current.parent, Tag):
            break
        current = current.parent
    return best


def kind_from_card(href: str, card: Tag, image_url: str = "") -> str:
    kind = kind_from_href(href, image_url)
    if kind != "Objet":
        return kind
    text = clean(card.get_text(" ")).lower()
    alts = " ".join(clean(img.get("alt")).lower() for img in card.find_all("img"))
    merged = text + " " + alts
    if " voice [" in merged or "voix" in merged:
        return "Voix"
    if " emote" in merged or " appeal" in merged:
        return "Emote"
    if " costume" in merged or "tenue" in merged:
        return "Costume"
    if " character" in merged or "personnage" in merged:
        return "Personnage / Alter"
    if " gallery" in merged or "illustration" in merged:
        return "Illustration"
    if " emblem" in merged or "emblème" in merged:
        return "Emblème"
    if " nameplate" in merged or "plaque" in merged:
        return "Plaque"
    return "Objet"


def normalized_item_name(value: str) -> str:
    text = clean(value)
    text = re.sub(r"\s+Drop Rate:\s*[0-9.]+\s*%.*$", "", text, flags=re.I)
    text = re.sub(r"\s+x\d+\s+\d+\s+Pts\.?\s*$", "", text, flags=re.I)
    text = re.sub(r"^Image:\s*", "", text, flags=re.I)
    text = re.sub(r"^[★☆\s]+", "", text)
    return clean(text)


def item_name(card: Tag, link: Tag | None, rate_parent: Tag | None = None) -> str:
    if link is not None:
        value = normalized_item_name(link.get_text(" "))
        if value and value.lower() not in ("image", "details"):
            return value
    for image in card.find_all("img"):
        raw_alt = clean(image.get("alt") or "")
        voice = re.search(r"^(.*?)\s+Voice\s*\[(.*?)\]\s*$", raw_alt, re.I)
        if voice:
            return clean(f"{voice.group(1)} — {voice.group(2)}")
        alt = normalized_item_name(raw_alt)
        if alt and alt.lower() not in ("image", "event background image"):
            alt = re.sub(r"^(?:Image:\s*)?", "", alt, flags=re.I)
            return clean(alt)
    text = normalized_item_name(card.get_text(" "))
    text = re.sub(r"(?:Normal \(|★★.*$)", "", text, flags=re.I)
    return clean(text)[:180]


def ordered_tag_positions(soup: BeautifulSoup):
    tags = list(soup.find_all(True))
    return tags, {id(tag): index for index, tag in enumerate(tags)}


def records_between(soup: BeautifulSoup, start: Tag | None, end: Tag | None, token_regex: str):
    if start is None:
        return []
    _, positions = ordered_tag_positions(soup)
    start_pos = positions.get(id(start), -1)
    end_pos = positions.get(id(end), 10**12) if end is not None else 10**12
    found = []
    seen_strings = set()
    for string in soup.find_all(string=re.compile(token_regex, re.I)):
        if not isinstance(string, NavigableString):
            continue
        parent = string.parent
        pos = positions.get(id(parent), -1)
        if not (start_pos < pos < end_pos):
            continue
        text = clean(string)
        signature = (pos, text)
        if signature in seen_strings:
            continue
        seen_strings.add(signature)
        found.append((string, parent))
    return found



def raw_image_url(image: Tag | None) -> str:
    if not isinstance(image, Tag) or image.name != "img":
        return ""
    raw = (
        image.get("src")
        or image.get("data-src")
        or image.get("data-lazy-src")
        or ""
    )
    if not raw and image.get("srcset"):
        raw = image.get("srcset").split(",")[0].strip().split(" ")[0]
    return absolute(raw)


def is_reward_visual(image: Tag | None) -> bool:
    url = raw_image_url(image).lower()
    if not url:
        return False
    blocked = (
        "frame", "rarity", "star", "blocker", "logo", "arrow",
        "icon_role", "gashathumb_bg", "common_bg", "loading",
        "new_icon", "attribute", "role_", "type_icon",
    )
    return not any(token in url for token in blocked)


def rarity_from_window(
    window: list[Tag],
    kind: str,
    rate: float | None = None,
) -> str:
    evidence = " ".join(
        (
            raw_image_url(tag)
            + " "
            + clean(tag.get("alt"))
            + " "
            + " ".join(tag.get("class", []))
        ).lower()
        for tag in window
        if isinstance(tag, Tag) and tag.name == "img"
    )

    if any(token in evidence for token in (
        "gasha_ssr_frame", "gasha_pur_frame", "rarity_3",
        "3star", "3_star", "star_3", "rare3",
    )):
        return "PUR"
    if any(token in evidence for token in (
        "gasha_sr_frame", "rarity_2", "2star", "2_star",
        "star_2", "rare2",
    )):
        return "SR"
    if any(token in evidence for token in (
        "gasha_r_frame", "rarity_1", "1star", "1_star",
        "star_1", "rare1",
    )):
        return "R"
    if any(token in evidence for token in (
        "gasha_c_frame", "common_frame", "rarity_0", "common",
    )):
        return "C"

    # Secours fondé sur les catégories de taux du portail.
    # Les personnages/Alters sont des récompenses 3 étoiles.
    if kind == "Personnage / Alter":
        return "PUR"
    value = float(rate or 0)
    if value >= 0.5:
        return "PUR"
    if value >= 0.2:
        return "SR"
    if value >= 0.08:
        return "R"
    return "C"


def clean_item_alt(value: str) -> str:
    text = clean(value)
    text = re.sub(r"^Image:\s*", "", text, flags=re.I)
    voice = re.match(r"^(.*?)\s+Voice\s*\[(.*?)\]\s*$", text, re.I)
    if voice:
        return clean(f"{voice.group(1)} — {voice.group(2)}")
    text = re.sub(r"\s+Drop Rate:\s*[0-9.]+\s*%.*$", "", text, flags=re.I)
    return clean(text)


def item_record_from_token_window(
    tags: list[Tag],
    positions: dict[int, int],
    parent: Tag,
    lower_pos: int,
    upper_pos: int,
    value_regex: str,
    value_key: str,
):
    """
    Une récompense est reconstruite avec les éléments placés depuis le taux/prix
    précédent jusqu'au taux/prix courant. Le dernier vrai visuel de cette
    fenêtre appartient donc à cette récompense, et non au premier objet du bloc.
    """
    window = [
        tag for tag in tags[lower_pos + 1:upper_pos + 1]
        if isinstance(tag, Tag)
    ]

    text = clean(parent.get_text(" "))
    match = re.search(value_regex, text, re.I)
    if not match:
        # Le nombre peut être dans le parent direct ou un petit ancêtre.
        current = parent
        for _ in range(5):
            if not isinstance(current, Tag):
                break
            text = clean(current.get_text(" "))
            match = re.search(value_regex, text, re.I)
            if match:
                break
            current = current.parent if isinstance(current.parent, Tag) else None
    if not match:
        return None

    visual_tags = [
        tag for tag in window
        if tag.name == "img" and is_reward_visual(tag)
    ]
    visual = visual_tags[-1] if visual_tags else None
    remote = raw_image_url(visual)
    alt = clean_item_alt(visual.get("alt") if visual else "")

    # Le lien qui contient directement le visuel est le plus fiable.
    link = None
    if visual is not None:
        ancestor = visual.parent
        for _ in range(5):
            if isinstance(ancestor, Tag) and ancestor.name == "a" and ancestor.get("href"):
                link = ancestor
                break
            ancestor = ancestor.parent if isinstance(ancestor, Tag) else None

    # Sinon, prendre le dernier lien d'objet avant le taux courant.
    if link is None:
        anchors = [
            tag for tag in window
            if tag.name == "a" and tag.get("href")
        ]
        item_anchors = []
        for anchor in anchors:
            href_candidate = absolute(anchor.get("href"))
            if (
                any(f"/{route}/" in href_candidate for route in ITEM_ROUTES)
                or raw_image_url(anchor.find("img"))
            ):
                item_anchors.append(anchor)
        if item_anchors:
            link = item_anchors[-1]

    href = absolute(link.get("href")) if link is not None else ""
    kind = kind_from_href(href, remote, alt)

    name = ""
    if link is not None:
        name = normalized_item_name(link.get_text(" "))
    if not name or name.lower() in ("image", "details"):
        name = alt
    if not name:
        # Chercher le dernier petit texte descriptif de la fenêtre.
        candidates = []
        for tag in window:
            if tag.name not in ("span", "p", "b", "strong", "small", "div"):
                continue
            value = normalized_item_name(tag.get_text(" "))
            if not value or "drop rate:" in value.lower() or "pts." in value.lower():
                continue
            if len(value) <= 180:
                candidates.append(value)
        if candidates:
            name = candidates[-1]
    if not name:
        return None

    numeric_value = (
        float(match.group(1)) if value_key == "rate"
        else int(match.group(1))
    )
    rarity = rarity_from_window(
        window,
        kind,
        numeric_value if value_key == "rate" else None,
    )

    identity_hint = (
        href
        or remote
        or f"{kind}|{name}|{positions.get(id(parent), upper_pos)}"
    )
    return {
        "name": clean(name),
        value_key: numeric_value,
        "kind": kind,
        "rarity": rarity,
        "url": href,
        "_remote_image": remote,
        "_dom_key": hashlib.sha1(identity_hint.encode("utf-8")).hexdigest()[:16],
    }


def dedupe(items: list[dict], mode: str) -> list[dict]:
    output, seen = [], set()
    for item in items:
        identity = (
            item.get("_dom_key"),
            item.get("url", ""),
            item.get("_remote_image", ""),
            clean(item.get("name")).lower(),
            item.get("points") if mode == "exchange" else item.get("rate"),
        )
        if identity in seen:
            continue
        seen.add(identity)
        output.append(item)
    return output


def parse_token_section(
    soup: BeautifulSoup,
    start: Tag | None,
    end: Tag | None,
    token_regex: str,
    value_regex: str,
    value_key: str,
):
    if start is None:
        return []

    tags, positions = ordered_tag_positions(soup)
    records = records_between(soup, start, end, token_regex)
    start_pos = positions.get(id(start), -1)
    output = []
    previous_pos = start_pos

    for _, parent in records:
        current_pos = positions.get(id(parent), -1)
        if current_pos < 0:
            continue
        item = item_record_from_token_window(
            tags,
            positions,
            parent,
            previous_pos,
            current_pos,
            value_regex,
            value_key,
        )
        if item:
            output.append(item)
        previous_pos = current_pos

    return dedupe(output, "exchange" if value_key == "points" else "rate")


def parse_exchange(
    soup: BeautifulSoup,
    exchange_heading: Tag | None,
    normal_heading: Tag | None,
):
    output = parse_token_section(
        soup,
        exchange_heading,
        normal_heading,
        r"\bx1\s+\d+\s*Pts\.",
        r"\bx1\s+(\d+)\s*Pts\.",
        "points",
    )
    expected = len(records_between(
        soup, exchange_heading, normal_heading, r"\bx1\s+\d+\s*Pts\."
    ))
    if expected == 0 or len(output) != expected:
        print(
            f"[HOME EXCHANGE REFUSED] lignes_source={expected} lignes_lues={len(output)}",
            flush=True,
        )
        return []
    return output


def parse_rate_section(
    soup: BeautifulSoup,
    start: Tag | None,
    end: Tag | None,
):
    output = parse_token_section(
        soup,
        start,
        end,
        r"Drop Rate:\s*[0-9.]+\s*%",
        r"Drop Rate:\s*([0-9.]+)\s*%",
        "rate",
    )
    expected = len(records_between(
        soup, start, end, r"Drop Rate:\s*[0-9.]+\s*%"
    ))
    if expected == 0 or len(output) != expected:
        print(
            f"[HOME RATES REFUSED] lignes_source={expected} lignes_lues={len(output)}",
            flush=True,
        )
        return []
    return output

def derived_item_image(href: str) -> str:
    match = re.search(r"/costume/(\d+)", href or "")
    if match:
        costume_id = match.group(1).zfill(9)
        return (
            f"{BASE}assets/Character/Ch{costume_id[:3]}/GUI/Costume/LL/"
            f"T_ui_Thumb_4_{costume_id}_LL.png"
        )
    return ""


def previous_item_map(fallback: dict | None):
    output = {}
    if not fallback:
        return output
    for section in ("featured", "exchange"):
        for item in fallback.get(section, []):
            if item.get("image"):
                output[("url", item.get("url", ""))] = item["image"]
                output[("name", clean(item.get("name")).lower(), clean(item.get("kind")).lower())] = item["image"]
                output[("name", clean(item.get("name")).lower(), "")] = item["image"]
    for mode in ("normal", "guaranteed"):
        for item in fallback.get("rates", {}).get(mode, []):
            if item.get("image"):
                output[("url", item.get("url", ""))] = item["image"]
                output[("name", clean(item.get("name")).lower(), clean(item.get("kind")).lower())] = item["image"]
                output[("name", clean(item.get("name")).lower(), "")] = item["image"]
    return output


def asset_stem(item: dict) -> str:
    remote = item.get("_remote_image", "")
    identity = "|".join((
        remote,
        item.get("url", ""),
        clean(item.get("name")),
        clean(item.get("kind")),
        clean(item.get("rarity")),
    ))
    digest = hashlib.sha1(identity.encode("utf-8")).hexdigest()[:16]
    return f"assets/home/gacha_items_v302/item_{digest}_{slug(item.get('name', ''))}"

def resolve_items(root: Path, groups: list[list[dict]], previous: dict | None):
    previous_map = previous_item_map(previous)
    all_items = [item for group in groups for item in group]
    jobs = {}
    for item in all_items:
        remote = item.get("_remote_image") or derived_item_image(item.get("url", ""))
        if remote:
            jobs[(remote, asset_stem(item))] = None
    if jobs:
        print(f"[HOME IMAGES] {len(jobs)} image(s) unique(s) à contrôler", flush=True)
        with ThreadPoolExecutor(max_workers=8) as executor:
            futures = {
                executor.submit(download_asset, root, url, stem, 4): (url, stem)
                for url, stem in jobs
            }
            done = 0
            for future in as_completed(futures):
                key = futures[future]
                try:
                    jobs[key] = future.result()
                except Exception:
                    jobs[key] = ""
                done += 1
                if done % 50 == 0 or done == len(jobs):
                    print(f"[HOME IMAGES] {done}/{len(jobs)}", flush=True)
    for item in all_items:
        remote = item.pop("_remote_image", "") or derived_item_image(item.get("url", ""))
        local = jobs.get((remote, asset_stem(item)), "") if remote else ""
        old = (
            previous_map.get(("url", item.get("url", "")))
            or previous_map.get(("name", clean(item.get("name")).lower(), clean(item.get("kind")).lower()))
            or previous_map.get(("name", clean(item.get("name")).lower(), ""))
        )
        if remote:
            item["image"] = local or item.get("image", "")
        else:
            item["image"] = old or item.get("image", "")
        item.pop("_dom_key", None)


def parse_gacha_summary(
    root: Path,
    anchor: Tag,
    previous: dict | None = None,
):
    url = absolute(anchor.get("href"))
    match = re.search(r"/gasha/(\d+)", url)
    if not match:
        return None
    gacha_id = match.group(1)
    text = clean(anchor.get_text(" "))
    start, end = parse_dates(text)
    title = re.sub(
        r"20\d{2}-\d{2}-\d{2}.*$",
        "",
        text,
    ).strip()
    remote = best_image(anchor, id_hint=gacha_id)
    if not remote:
        remote = f"{BASE}assets/Gasha/gasha_{gacha_id}.webp"
    local = download_asset(root, remote, f"assets/home/gachas/gasha_{gacha_id}")
    old = previous or {}
    title = title or old.get("title") or f"Tirage {gacha_id}"
    return {
        "id": gacha_id,
        "title": title,
        "type": (
            "Costume" if "costume" in title.lower()
            else "Alter" if any(x in title.lower() for x in ("alter", "alternative", "quirk"))
            else "Personnage"
        ),
        "start": start or old.get("start"),
        "end": end or old.get("end"),
        "url": url,
        "image": local or old.get("image") or remote,
        "banner_source": remote,
    }

def patch_image_allowed(url: str) -> bool:
    low = (url or "").lower()
    if not low:
        return False
    blocked = (
        "logo", "favicon", "twitter", "discord", "language",
        "arrow", "menu", "loading", "advert", "banner_ad",
    )
    return not any(token in low for token in blocked)


def parse_patch(
    session: requests.Session,
    root: Path,
    url: str,
    previous: dict | None = None,
):
    soup = BeautifulSoup(get(session, url).text, "lxml")
    title = clean((soup.find("h1") or soup.title).get_text(" "))
    patch_id = re.search(r"/patch/(\d+)", url).group(1)
    first_h1 = soup.find("h1")
    started = False
    sections, current = [], None
    rich_blocks = []
    image_index = 0

    for tag in soup.find_all(["h1", "h2", "h3", "p", "li", "img"]):
        if tag.name == "h1":
            if tag is first_h1:
                started = True
                continue
            if not started:
                continue
        elif not started:
            continue

        if tag.name in ("h1", "h2", "h3"):
            text = clean(tag.get_text(" "))
            if not text:
                continue
            current = {"title": text, "items": []}
            sections.append(current)
            rich_blocks.append({
                "type": "heading",
                "level": 2 if tag.name in ("h1", "h2") else 3,
                "text": text,
            })
            continue

        if tag.name == "img":
            remote = absolute(
                tag.get("src")
                or tag.get("data-src")
                or tag.get("data-lazy-src")
                or ""
            )
            if not patch_image_allowed(remote):
                continue
            image_index += 1
            local = download_asset(
                root,
                remote,
                f"assets/home/patches/{patch_id}/image_{image_index:03d}",
            )
            if local:
                rich_blocks.append({
                    "type": "image",
                    "src": local,
                    "alt": clean(tag.get("alt")),
                })
            continue

        text = clean(tag.get_text(" "))
        if not text:
            continue
        if any(skip in text.lower() for skip in (
            "buff + value", "nerf + value", "main menu",
            "official patch notes", "language",
        )):
            continue
        if current is None:
            current = {"title": "Résumé", "items": []}
            sections.append(current)
        if text not in current["items"]:
            current["items"].append(text)
        rich_blocks.append({"type": "text", "text": text})

    page_text = clean(soup.get_text(" "))
    date_value = None
    date_match = re.search(
        r"(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2}\s+at\s+\d{1,2}:\d{2}\s+(?:AM|PM)",
        page_text,
        re.I,
    )
    if date_match:
        try:
            date_value = datetime.strptime(
                date_match.group(0),
                "%B %d, %Y at %I:%M %p",
            ).replace(tzinfo=timezone.utc).isoformat()
        except ValueError:
            pass

    output = {
        "id": patch_id,
        "title": title,
        "date": date_value or datetime.fromtimestamp(
            int(patch_id), tz=timezone.utc
        ).isoformat(),
        "url": url,
        "sections": [s for s in sections if s["items"]][:100],
        "rich_blocks": rich_blocks[:500],
        "internal": True,
    }
    # La note actuelle a une mise en page manuelle encore meilleure.
    if previous and previous.get("details"):
        output["details"] = previous["details"]
    return output

def official_event_image(session: requests.Session, root: Path, anchor: Tag, event_id: str, old: dict):
    # The image inside the home event card is preferred because it is exactly the
    # thumbnail used by UltraRumble. The event page background is the fallback.
    remote = best_image(anchor, id_hint=event_id)
    if not remote:
        try:
            event_url = f"{BASE}event/{event_id}"
            event_soup = BeautifulSoup(get(session, event_url, 3).text, "lxml")
            for image in event_soup.find_all("img"):
                alt = clean(image.get("alt")).lower()
                src = absolute(image.get("src") or image.get("data-src") or "")
                if "event background image" in alt or event_id in src:
                    remote = src
                    break
        except Exception as exc:
            print(f"[HOME EVENT WARNING] {event_id}: {exc}", flush=True)
    if not remote:
        remote = f"{BASE}assets/Event/T_ui_Bg_{event_id}.webp"
    local = download_asset(root, remote, f"assets/home/events/event_{event_id}")
    old_image = old.get("image", "")
    old_source = old.get("image_source", "")
    old_is_official = (
        old.get("official_image") is True
        and "ultrarumble.com/" in (old_source or old_image)
    )
    return local or remote or (old_image if old_is_official else ""), remote


def parse_home(session: requests.Session, root: Path, previous: dict):
    soup = BeautifulSoup(get(session, BASE).text, "lxml")
    text = clean(soup.get_text(" "))
    season = previous.get("season", {})
    season_match = re.search(
        r"Season\s+(\d+).*?Start:\s*(20\d{2}-[^•]+).*?End:\s*(20\d{2}-[^*]+)",
        text,
        re.I,
    )
    if season_match:
        start, end = parse_dates(season_match.group(2) + " " + season_match.group(3))
        season = {"number": int(season_match.group(1)), "start": start, "end": end}

    previous_gachas = {str(item.get("id")): item for item in previous.get("gachas", [])}
    gachas = []
    for anchor in anchors_in_section(soup, "Current Gacha Rolls", r"/gasha/\d+"):
        match = re.search(r"/gasha/(\d+)", absolute(anchor.get("href")))
        if not match:
            continue
        gacha_id = match.group(1)
        try:
            print(f"[HOME] Tirage disponible {gacha_id}", flush=True)
            item = parse_gacha_summary(root, anchor, previous_gachas.get(gacha_id))
            if item:
                gachas.append(item)
        except Exception as exc:
            print(f"[HOME WARNING] {gacha_id}: {exc}", flush=True)
            if gacha_id in previous_gachas:
                gachas.append(previous_gachas[gacha_id])
    if not gachas:
        gachas = previous.get("gachas", [])

    previous_events = {str(item.get("id")): item for item in previous.get("events", [])}
    events = []
    for anchor in anchors_in_section(soup, "Current Events", r"/event/\d+"):
        url = absolute(anchor.get("href"))
        event_id = re.search(r"/event/(\d+)", url).group(1)
        raw_text = clean(anchor.get_text(" "))
        start, end = parse_dates(raw_text)
        title = re.sub(r"20\d{2}-\d{2}-\d{2}.*$", "", raw_text).strip()
        old = previous_events.get(event_id, {})
        image, source = official_event_image(session, root, anchor, event_id, old)
        events.append(
            {
                "id": event_id,
                "type": old.get("type", "Événement"),
                "title": title or old.get("title", "Événement"),
                "start": start,
                "end": end,
                "url": url,
                "image": image,
                "image_source": source,
                "official_image": True,
            }
        )
    if not events:
        events = previous.get("events", [])

    previous_latest = (
        previous.get("patch_notes", [None])[0]
        if previous.get("patch_notes")
        else None
    )
    latest_patch = None
    recent_patch_links = anchors_in_section(
        soup,
        "Recent Patch Notes",
        r"/patch/\d+",
    )
    if recent_patch_links:
        latest_url = absolute(recent_patch_links[0].get("href"))
        latest_id_match = re.search(r"/patch/(\d+)", latest_url)
        latest_id = latest_id_match.group(1) if latest_id_match else ""
        old = (
            previous_latest
            if previous_latest and str(previous_latest.get("id")) == latest_id
            else None
        )
        try:
            print(f"[HOME] Dernière patch note {latest_id}", flush=True)
            latest_patch = parse_patch(session, root, latest_url, old)
            recent_date, _ = parse_dates(clean(recent_patch_links[0].get_text(" ")))
            if recent_date:
                latest_patch["date"] = recent_date
        except Exception as exc:
            print(f"[HOME PATCH WARNING] {latest_id}: {exc}", flush=True)
            latest_patch = old or previous_latest
    else:
        latest_patch = previous_latest
    patches = [latest_patch] if latest_patch else []

    previous_releases = previous.get("latest_releases", [])
    releases = []
    for index, anchor in enumerate(anchors_in_section(soup, "Latest Releases", r"/character/\d+")):
        remote = best_image(anchor)
        old = previous_releases[index] if index < len(previous_releases) else {}
        local = download_asset(root, remote, f"assets/home/releases/release_{index + 1}") if remote else ""
        title = clean(anchor.get_text(" ")) or old.get("title", "Nouvelle sortie")
        releases.append(
            {
                "title": old.get("title", title),
                "subtitle": old.get("subtitle", "Nouveauté du roster"),
                "type": old.get("type", "Nouvelle sortie"),
                "release_kind": old.get("release_kind", "style"),
                "character_id": old.get("character_id", ""),
                "style_id": old.get("style_id", ""),
                "image": local or old.get("image", "") or remote,
                "banner": local or old.get("banner", "") or remote,
                "art": old.get("art", local or remote),
                "word": old.get("word", ""),
                "theme": old.get("theme", ""),
                "url": absolute(anchor.get("href")),
            }
        )

    return {
        **previous,
        "meta": {
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "source": "UltraRumble.com",
            "version": "v303-active-gachas-latest-full-patch",
        },
        "season": season,
        "latest_releases": releases or previous_releases,
        "gachas": gachas,
        "events": events,
        "patch_notes": patches,
    }


def save_data(root: Path, data: dict):
    json_path = root / "data/home_data.json"
    js_path = root / "data/home_data.js"
    json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    js_path.write_text(
        "window.MHUR_HOME_DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--site-root", default=".")
    args = parser.parse_args()
    root = Path(args.site_root).resolve()
    data_path = root / "data/home_data.json"
    previous = json.loads(data_path.read_text(encoding="utf-8")) if data_path.exists() else {}
    session = requests.Session()
    session.headers.update(HEADERS)
    try:
        new_data = parse_home(session, root, previous)
    except Exception as exc:
        print(f"[HOME ERROR] {exc}", flush=True)
        return 1
    save_data(root, new_data)
    print(
        f"[HOME DONE] gachas={len(new_data.get('gachas', []))} "
        f"patches={len(new_data.get('patch_notes', []))} "
        f"events={len(new_data.get('events', []))}",
        flush=True,
    )
    for gacha in new_data.get("gachas", []):
        print(
            f"  - tirage {gacha.get('id')}: {gacha.get('title')} "
            f"jusqu'au {gacha.get('end')}",
            flush=True,
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
