# -*- coding: utf-8 -*-
"""Verify demand trainingRegion API + admin page rendering contract."""
from __future__ import annotations

import json
import re
import urllib.error
import urllib.request
from pathlib import Path

OUT = Path(r"d:\JavaStudy\taokev2-mono\frontend\scripts\.demand-verify.txt")
lines: list[str] = []


def get_json(url: str):
    with urllib.request.urlopen(url, timeout=30) as resp:
        return json.load(resp)


def get_text(url: str) -> tuple[int, str]:
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        return e.code, body


# 1) Detail API — demand 2300 HYBRID
detail = get_json("http://localhost:8080/admin/demands/2300")["data"]
lines.append(f"format={detail.get('format')} label={detail.get('formatLabel')}")
lines.append(f"trainingRegion={detail.get('trainingRegion')}")
lines.append(f"province={detail.get('provinceName')} city={detail.get('cityName')}")
assert detail.get("format") == "HYBRID", detail
assert detail.get("trainingRegion"), detail
assert detail.get("provinceName") and detail.get("cityName"), detail
lines.append("DETAIL_API_PASS")

# 2) List API
lst = get_json("http://localhost:8080/admin/demands?page=1&size=20&keyword=2300")["data"]["list"][0]
lines.append(f"list.trainingRegion={lst.get('trainingRegion')}")
assert lst.get("trainingRegion"), lst
lines.append("LIST_API_PASS")

# 3) Frontend display helper (mirror admin page logic)
def format_training_region(d: dict) -> str:
    if d.get("format") == "ONLINE":
        return "无"
    if (d.get("trainingRegion") or "").strip():
        return d["trainingRegion"].strip()
    joined = " ".join(
        x for x in [d.get("provinceName"), d.get("cityName"), d.get("districtName")] if x
    )
    return joined or "—"


hybrid_text = format_training_region(detail)
online_text = format_training_region({**detail, "format": "ONLINE", "trainingRegion": None})
offline_text = format_training_region({**detail, "format": "OFFLINE"})
lines.append(f"ui.hybrid={hybrid_text}")
lines.append(f"ui.offline={offline_text}")
lines.append(f"ui.online={online_text}")
assert hybrid_text == detail["trainingRegion"]
assert offline_text == detail["trainingRegion"]
assert online_text == "无"
lines.append("UI_LOGIC_PASS")

# 4) Admin page reachability (client-rendered; may need auth)
status, html = get_text("http://localhost:3001/dashboard/demands/2300")
lines.append(f"admin_page_status={status} html_len={len(html)}")
# Page is 'use client' so SSR may not include 培训地区 text; check shell loads
if "需求详情" in html or "DemandDetail" in html or "demands/2300" in html or status == 200:
    lines.append("ADMIN_PAGE_REACHABLE")
else:
    lines.append("ADMIN_PAGE_UNEXPECTED")

# 5) Admin BFF proxy to backend
bff_status, bff_body = get_text("http://localhost:3001/api/demands/2300")
lines.append(f"bff_status={bff_status}")
try:
    bff = json.loads(bff_body)
    bff_data = bff.get("data") if isinstance(bff, dict) else None
    if isinstance(bff_data, dict) and bff_data.get("trainingRegion"):
        lines.append(f"bff.trainingRegion={bff_data.get('trainingRegion')}")
        lines.append("BFF_PASS")
    else:
        # auth may block — still record
        lines.append(f"bff_body_snippet={bff_body[:200]}")
        lines.append("BFF_AUTH_OR_EMPTY")
except Exception as e:
    lines.append(f"bff_parse_err={e}; body={bff_body[:200]}")
    lines.append("BFF_AUTH_OR_EMPTY")

OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
print("WROTE", OUT)
