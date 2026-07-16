#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import annotations

import argparse, copy, json, re
from collections import Counter, defaultdict
from pathlib import Path

from update_ultrarumble_data import TUNING_FIELDS, refresh_tuning_from_slot_debug, tuning_field_valid


def valid_image(path: Path) -> bool:
    try:
        if not path.exists() or path.stat().st_size < 5000:
            return False
        head = path.read_bytes()[:16]
        return head.startswith(b"\x89PNG") or head[:3] == b"\xff\xd8\xff" or head.startswith(b"RIFF")
    except Exception:
        return False


def costume_code(value: object) -> int:
    try:
        n = int(str(value or ""))
    except (TypeError, ValueError):
        return 0
    return n // 1_000_000 if n >= 1_000_000 else 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--site-root", default=str(Path(__file__).resolve().parents[1]))
    args = ap.parse_args()
    root = Path(args.site_root).resolve()
    index = root / "index.html"
    text = index.read_text(encoding="utf-8", errors="ignore")
    m = re.search(r'<script id="v249-local-costumes-data" type="application/json">\s*([\s\S]*?)\s*</script>', text)
    if not m:
        print("[ERROR] Donnees costumes introuvables dans index.html")
        return 1

    data = json.loads(m.group(1)).get("costumes", {})
    valid_colors = {"red", "yellow", "green", "cyan", "violet"}
    source_owner = {1: "midoriya", 16: "all_for_one", 201: "all_for_one_young", 202: "midoriya_ofa"}
    problems, owner_problems, repeated, unbound, photo_warnings, canonical_value_problems, source_tuning_problems = [], [], [], [], [], [], []
    total = 0
    urid_occurrences = defaultdict(list)

    canonical_by_char = {}
    canonical_path = root / "data" / "costume_catalog_canonical_v273.json"
    if canonical_path.exists():
        try:
            canonical_payload = json.loads(canonical_path.read_text(encoding="utf-8"))
            canonical_by_char = {
                cid: {str(row.get("id") or ""): row for row in rows}
                for cid, rows in canonical_payload.get("costumes", {}).items()
            }
        except Exception:
            canonical_by_char = {}

    remote_by_urid = {}
    remote_path = root / "data" / "ultrarumble" / "remote_costumes.json"
    if remote_path.exists():
        try:
            remote_rows = json.loads(remote_path.read_text(encoding="utf-8"))
            for remote in remote_rows:
                refresh_tuning_from_slot_debug(remote)
                rid = str(remote.get("ur_id") or "")
                if rid:
                    remote_by_urid[rid] = remote
        except Exception:
            remote_by_urid = {}

    bindings = {}
    bp = root / "data" / "costume_source_bindings_v278.json"
    if bp.exists():
        try:
            bindings = json.loads(bp.read_text(encoding="utf-8")).get("bindings", {})
        except Exception:
            bindings = {}

    for cid, arr in data.items():
        ids = Counter(str(x.get("id", "")) for x in arr)
        groups = {}
        row_by_id = {str(x.get("id") or ""): x for x in arr}
        for local_id, expected_urid in bindings.get(cid, {}).items():
            row = row_by_id.get(str(local_id))
            if row is None or str(row.get("urId") or "") != str(expected_urid):
                owner_problems.append({"type": "binding_mismatch", "char": cid, "id": local_id, "expected_urId": str(expected_urid), "actual_urId": str((row or {}).get("urId") or "")})

        for order, ct in enumerate(arr):
            total += 1
            missing = []
            for key in ("spLeft", "spRight"):
                if ct.get(key) not in valid_colors:
                    missing.append(key)
            for key in ("normalLeft", "normalRight"):
                value = ct.get(key)
                if not isinstance(value, list) or len(value) != 5:
                    missing.append(key + " length")
                elif any(x not in valid_colors for x in value):
                    missing.append(key + " colors")
            for key in ("normalCondLeft", "normalCondRight"):
                value = ct.get(key)
                if not isinstance(value, list) or len(value) != 5:
                    missing.append(key + " length")
                elif any(x not in {"", "Héros", "Vilain"} for x in value):
                    missing.append(key + " values")
            if ct.get("condition") not in {"", "Tous", "Héros", "Vilain"}:
                missing.append("condition")

            img = str(ct.get("img") or "")
            if not img or not valid_image(root / img):
                missing.append("photo")

            duplicate_id = ids[str(ct.get("id", ""))] > 1
            fatal_missing = [x for x in missing if x != "photo"]
            if duplicate_id or fatal_missing:
                problems.append({
                    "char": cid, "order": order, "id": ct.get("id"),
                    "group": ct.get("group"), "variant": ct.get("variant"),
                    "duplicate_id": duplicate_id, "missing": missing,
                })
            elif "photo" in missing:
                photo_warnings.append({
                    "char": cid, "order": order, "id": ct.get("id"),
                    "group": ct.get("group"), "variant": ct.get("variant"),
                    "urId": str(ct.get("urId") or ""), "img": img,
                })

            canonical = canonical_by_char.get(cid, {}).get(str(ct.get("id") or ""))
            if canonical:
                expected_rarity = canonical.get("rarity")
                if expected_rarity in {"C", "R", "SR", "PUR"} and ct.get("rarity") != expected_rarity:
                    canonical_value_problems.append({
                        "char": cid, "id": ct.get("id"), "field": "rarity",
                        "expected": expected_rarity, "actual": ct.get("rarity"),
                    })

            urid = str(ct.get("urId") or "")
            remote = remote_by_urid.get(urid)
            if remote and all(tuning_field_valid(field, remote.get(field)) for field in TUNING_FIELDS):
                for field in TUNING_FIELDS:
                    expected = remote.get(field)
                    if ct.get(field) != expected:
                        source_tuning_problems.append({
                            "char": cid, "id": ct.get("id"), "urId": urid, "field": field,
                            "expected": expected, "actual": ct.get(field),
                        })
            if urid:
                urid_occurrences[urid].append({"char": cid, "order": order, "id": ct.get("id"), "group": ct.get("group"), "variant": ct.get("variant")})
                expected = source_owner.get(costume_code(urid))
                if expected and cid != expected:
                    owner_problems.append({"type": "wrong_owner", "urId": urid, "expected": expected, "actual": cid, "id": ct.get("id")})
            else:
                unbound.append({"char": cid, "id": ct.get("id"), "group": ct.get("group"), "variant": ct.get("variant")})

            sig = "|".join(map(str, [ct.get("spLeft"), ct.get("spRight"), ct.get("condition"), *(ct.get("normalLeft") or []), *(ct.get("normalRight") or []), *(ct.get("normalCondLeft") or []), *(ct.get("normalCondRight") or [])]))
            groups.setdefault(ct.get("group") or ct.get("name") or "Costume", []).append((ct.get("variant"), sig, ct.get("id")))

        for group, rows in groups.items():
            counts = Counter(sig for _, sig, _ in rows)
            for variant, sig, local_id in rows:
                if counts[sig] > 1:
                    repeated.append({"char": cid, "group": group, "variant": variant, "id": local_id, "same_signature_count": counts[sig]})

    for urid, rows in urid_occurrences.items():
        if len(rows) > 1:
            owner_problems.append({"type": "duplicate_urId", "urId": urid, "occurrences": rows})

    report = {
        "total_costumes": total,
        "problems": problems,
        "owner_problems": owner_problems,
        "unbound_costumes": unbound,
        "photo_warnings": photo_warnings,
        "canonical_value_problems": canonical_value_problems,
        "source_tuning_problems": source_tuning_problems,
        "repeated_tuning_signatures": repeated,
    }
    out = root / "data" / "ultrarumble" / "costume_local_check.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[CHECK] total={total} problems={len(problems)} owner_problems={len(owner_problems)} rarity_problems={len(canonical_value_problems)} tuning_source_problems={len(source_tuning_problems)} photo_warnings={len(photo_warnings)} unbound={len(unbound)} repeated_signatures={len(repeated)}")
    print(f"[CHECK] report: {out.relative_to(root)}")
    for x in problems[:30]:
        print("[PROBLEM]", x)
    for x in owner_problems[:30]:
        print("[OWNER PROBLEM]", x)
    for x in unbound[:10]:
        print("[UNBOUND SOURCE]", x)
    for x in canonical_value_problems[:30]:
        print("[RARITY PROBLEM]", x)
    for x in source_tuning_problems[:30]:
        print("[TUNING SOURCE PROBLEM]", x)
    for x in photo_warnings[:30]:
        print("[PHOTO WARNING]", x)
    for x in repeated[:15]:
        print("[SAME TUNING]", x)
    if problems or owner_problems or canonical_value_problems or source_tuning_problems:
        return 1
    if photo_warnings:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
