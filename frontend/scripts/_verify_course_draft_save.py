# -*- coding: utf-8 -*-
"""Verify course 441089 second-edit save with plan ids no longer fails."""
from __future__ import annotations

import json
import urllib.request
from pathlib import Path

OUT = Path(r"d:\JavaStudy\taokev2-mono\frontend\scripts\.course-441089-fix-verify.txt")
lines: list[str] = []


def req(method: str, url: str, token: str | None = None, payload=None):
    data = None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            return resp.status, json.load(resp)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"raw": body}


login_status, login = req(
    "POST",
    "http://localhost:8080/auth/login",
    payload={"phone": "18675796459", "password": "123456"},
)
assert login_status == 200 and login.get("code") == 0, login
token = login["data"]["accessToken"]
lines.append("LOGIN_OK")

st, detail_wrap = req("GET", "http://localhost:8080/courses/me/441089", token=token)
assert st == 200 and detail_wrap.get("code") == 0, detail_wrap
detail = detail_wrap["data"]
lines.append(f"before status={detail.get('status')} hasPlan={detail.get('hasPlan')} plans={len(detail.get('plans') or [])}")

# Bug repro payload: include plan ids (as frontend previously did)
plans = []
for p in detail.get("plans") or []:
    plans.append(
        {
            "id": p.get("id"),
            "startTime": p.get("startTime"),
            "endTime": p.get("endTime"),
            "provinceId": p.get("provinceId"),
            "cityId": p.get("cityId"),
            "districtId": p.get("districtId"),
            "address": p.get("address"),
            "onlineUrl": p.get("onlineUrl") or "",
            "sortOrder": p.get("sortOrder") or 0,
        }
    )

payload = {
    "title": detail["title"],
    "draft": False,
    "type": detail["type"],
    "categoryId": detail.get("categoryId"),
    "subCategoryId": detail.get("subCategoryId"),
    "coverUrl": detail.get("coverUrl"),
    "intro": detail.get("intro") or "<p>1</p>",
    "syllabus": "<p>111-fixed</p>",
    "durationDays": detail.get("durationDays") or 1,
    "totalHours": detail.get("totalHours") or 6,
    "price": detail.get("price") or 0,
    "originalPrice": detail.get("originalPrice") or 0,
    "isFree": detail.get("isFree") or 0,
    "isFeatured": detail.get("isFeatured") or 0,
    "hasPlan": 1,
    "plans": plans,
}

st2, put_res = req("PUT", "http://localhost:8080/courses/441089", token=token, payload=payload)
lines.append(f"PUT_WITH_PLAN_IDS status={st2} code={put_res.get('code')} msg={put_res.get('message')}")
assert st2 == 200 and put_res.get("code") == 0, put_res
assert (put_res.get("data") or {}).get("syllabus") == "<p>111-fixed</p>"
lines.append("PUT_SUBMIT_PASS")

# Also verify save-as-draft rejected clearly for PENDING (status=1), not busy
payload_draft = {**payload, "draft": True, "syllabus": "<p>draft-try</p>"}
st3, draft_res = req("PUT", "http://localhost:8080/courses/441089", token=token, payload=payload_draft)
lines.append(f"PUT_DRAFT_ON_PENDING status={st3} code={draft_res.get('code')} msg={draft_res.get('message')}")
assert draft_res.get("code") != 99999
assert "草稿" in (draft_res.get("message") or "")
lines.append("DRAFT_ON_PENDING_CLEAR_ERROR_PASS")

# Create a true draft open course, then second-edit save draft with plan ids
create_payload = {
    "title": "二次编辑草稿回归测试课",
    "draft": True,
    "type": "OPEN_OFFLINE",
    "categoryId": detail.get("categoryId"),
    "subCategoryId": detail.get("subCategoryId"),
    "coverUrl": detail.get("coverUrl"),
    "intro": "<p>intro</p>",
    "syllabus": "<p>s1</p>",
    "durationDays": 1,
    "totalHours": 6,
    "price": 0,
    "isFree": 1,
    "hasPlan": 1,
    "plans": [
        {
            "startTime": "2026-09-01T10:00:00",
            "endTime": "2026-09-01T18:00:00",
            "provinceId": 15,
            "cityId": 176,
            "districtId": 1875,
            "address": "测试地址",
            "onlineUrl": "",
            "sortOrder": 0,
        }
    ],
}
stc, created = req("POST", "http://localhost:8080/courses", token=token, payload=create_payload)
lines.append(f"CREATE_DRAFT status={stc} code={created.get('code')}")
assert stc == 200 and created.get("code") == 0, created
new_id = created["data"]["id"]
lines.append(f"created_draft_id={new_id} status={created['data'].get('status')}")

# reload and second save draft with plan ids
st4, d2 = req("GET", f"http://localhost:8080/courses/me/{new_id}", token=token)
detail2 = d2["data"]
plans2 = []
for p in detail2.get("plans") or []:
    plans2.append(
        {
            "id": p.get("id"),
            "startTime": p.get("startTime"),
            "endTime": p.get("endTime"),
            "provinceId": p.get("provinceId"),
            "cityId": p.get("cityId"),
            "districtId": p.get("districtId"),
            "address": p.get("address"),
            "onlineUrl": "",
            "sortOrder": p.get("sortOrder") or 0,
        }
    )
save_draft = {
    "title": detail2["title"] + "-改",
    "draft": True,
    "type": "OPEN_OFFLINE",
    "categoryId": detail2.get("categoryId"),
    "coverUrl": detail2.get("coverUrl"),
    "intro": "<p>intro2</p>",
    "syllabus": "<p>s2</p>",
    "durationDays": 1,
    "totalHours": 6,
    "isFree": 1,
    "hasPlan": 1,
    "plans": plans2,
}
st5, saved = req("PUT", f"http://localhost:8080/courses/{new_id}", token=token, payload=save_draft)
lines.append(f"SECOND_DRAFT_SAVE status={st5} code={saved.get('code')} msg={saved.get('message')}")
assert st5 == 200 and saved.get("code") == 0, saved
assert saved["data"].get("status") == 0
assert saved["data"].get("title").endswith("-改")
lines.append("SECOND_DRAFT_SAVE_PASS")

# submit for review
save_submit = {**save_draft, "draft": False, "title": saved["data"]["title"]}
# refresh plan ids again
st6, d3 = req("GET", f"http://localhost:8080/courses/me/{new_id}", token=token)
plans3 = []
for p in d3["data"].get("plans") or []:
    plans3.append(
        {
            "id": p.get("id"),
            "startTime": p.get("startTime"),
            "endTime": p.get("endTime"),
            "provinceId": p.get("provinceId"),
            "cityId": p.get("cityId"),
            "districtId": p.get("districtId"),
            "address": p.get("address"),
            "onlineUrl": "",
            "sortOrder": 0,
        }
    )
save_submit["plans"] = plans3
st7, submitted = req("PUT", f"http://localhost:8080/courses/{new_id}", token=token, payload=save_submit)
lines.append(f"SUBMIT_REVIEW status={st7} code={submitted.get('code')} msg={submitted.get('message')} courseStatus={(submitted.get('data') or {}).get('status')}")
assert st7 == 200 and submitted.get("code") == 0, submitted
assert submitted["data"].get("status") == 1
lines.append("SUBMIT_REVIEW_PASS")

# cleanup test course if still deletable? status=1 pending cannot delete; leave it

OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
print("WROTE", OUT)
