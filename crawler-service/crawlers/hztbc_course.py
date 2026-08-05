"""时代光华课程爬虫适配器。"""
import asyncio
import logging
import re
import ssl
import time
import urllib.request
from datetime import date, datetime, timedelta
from html import unescape
from typing import Any, AsyncGenerator, Dict, Iterable, List
from urllib.parse import urljoin

from crawlers.course_utils import append_diagnostic, detect_content_type, enrich_course_record, set_price_fields
from crawlers.media import apply_content_block, media_asset
from crawlers.rich_content import apply_syllabus_rich_content


BASE_URL = "https://www.hztbc.com"
OPEN_SCHEDULE_URL = f"{BASE_URL}/public/lesson_2026.html"
OPEN_LIST_URL = f"{BASE_URL}/public/"
INTERNAL_LIST_URLS = [
    f"{BASE_URL}/lesson/list_0_0_0_0_1.html",
    f"{BASE_URL}/lesson/list_185_0_0_0_1.html",
    f"{BASE_URL}/lesson/list_0_194_0_0_1.html",
    f"{BASE_URL}/lesson/list_0_192_0_0_1.html",
    f"{BASE_URL}/lesson/list_0_45_0_0_1.html",
]
ONLINE_ENTRY_URL = f"{BASE_URL}/e-learning/"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
MISSING = "暂无"
logger = logging.getLogger(__name__)

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

SECTION_STOPS = (
    "课程收益",
    "课程特色",
    "课程大纲",
    "课程目标",
    "课程介绍",
    "课程背景",
    "培训对象",
    "适用对象",
    "课程对象",
    "现场图片",
    "学员评价",
    "相关课程",
    "近期热门公开课程",
    "热门相关内训课程",
    "相关讲师",
    "热门相关资讯",
    "姓 名",
    "注意事项",
    "时代光华",
)

CITY_PROVINCES = {
    "杭州": ("浙江省", "杭州市"),
    "杭州市": ("浙江省", "杭州市"),
    "广州": ("广东省", "广州市"),
    "广州市": ("广东省", "广州市"),
    "深圳": ("广东省", "深圳市"),
    "深圳市": ("广东省", "深圳市"),
    "东莞": ("广东省", "东莞市"),
    "东莞市": ("广东省", "东莞市"),
    "佛山": ("广东省", "佛山市"),
    "佛山市": ("广东省", "佛山市"),
    "成都": ("四川省", "成都市"),
    "成都市": ("四川省", "成都市"),
    "苏州": ("江苏省", "苏州市"),
    "苏州市": ("江苏省", "苏州市"),
    "厦门": ("福建省", "厦门市"),
    "厦门市": ("福建省", "厦门市"),
    "义乌": ("浙江省", "义乌市"),
    "义乌市": ("浙江省", "义乌市"),
    "嘉兴": ("浙江省", "嘉兴市"),
    "嘉兴市": ("浙江省", "嘉兴市"),
    "海宁": ("浙江省", "海宁市"),
    "海宁市": ("浙江省", "海宁市"),
}


def fetch_text(url: str, timeout: int = 25, retries: int = 3) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout, context=SSL_CTX) as resp:
                charset = resp.headers.get_content_charset() or "utf-8"
                return resp.read().decode(charset, errors="ignore")
        except Exception as exc:
            last_error = exc
            if attempt >= retries:
                break
            time.sleep(0.4 * attempt)
    raise RuntimeError(f"request failed after {retries} retries: {url}; {last_error}")


def clean_html(value: Any, default: str = "") -> str:
    if value is None:
        return default
    text = str(value)
    text = re.sub(r"<script[\s\S]*?</script>", " ", text, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<!--[\s\S]*?-->", " ", text)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"</(?:p|div|li|tr|h[1-6])\s*>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text).replace("&nbsp;", " ")
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\n\s+", "\n", text)
    text = " ".join(text.split())
    return text or default


def absolute_url(value: str) -> str:
    return urljoin(BASE_URL + "/", value or "")


def source_id_from_url(url: str) -> str:
    match = re.search(r"info_(\d+)\.html", url)
    if match:
        return match.group(1)
    return url.rstrip("/").rsplit("/", 1)[-1]


def meta_content(html: str, name: str) -> str:
    match = re.search(
        rf'<meta[^>]+name=["\']{re.escape(name)}["\'][^>]+content=["\'](.*?)["\']',
        html,
        flags=re.I | re.S,
    )
    return clean_html(match.group(1), MISSING) if match else MISSING


def extract_title(html: str, fallback: str = MISSING) -> str:
    for pattern in (
        r'<h1[^>]*>([\s\S]*?)</h1>',
        r'<div[^>]+class=["\'][^"\']*(?:Course_title|title|name)[^"\']*["\'][^>]*>([\s\S]*?)</div>',
        r"<title[^>]*>([\s\S]*?)</title>",
    ):
        match = re.search(pattern, html, flags=re.I | re.S)
        if not match:
            continue
        title = clean_html(match.group(1), fallback)
        title = re.sub(r"\s*[-_].*时代光华.*$", "", title).strip()
        title = re.sub(r"（第\d+期）", "", title).strip()
        if title and len(title) <= 180 and title not in {"公开课详情", "内训"}:
            return title
    return fallback


def extract_detail_text(html: str) -> str:
    text = clean_html(html)
    anchors = ["公开课详情", "课程收益", "课程介绍", "课程目标", "课程背景", "培训对象", "领 域"]
    positions = [text.find(anchor) for anchor in anchors if text.find(anchor) >= 0]
    if positions:
        text = text[min(positions):]
    for stop in ("姓 名", "注意事项", "时代光华 |", "Copyright"):
        pos = text.find(stop)
        if pos > 800:
            text = text[:pos]
    return text


def extract_after_labels(text: str, labels: Iterable[str], limit: int = 1800) -> str:
    candidates: list[tuple[int, str, str]] = []
    for label in labels:
        for match in re.finditer(re.escape(label), text):
            candidates.append((match.start(), label, text[match.end():]))
    if not candidates:
        return MISSING
    for _, label, tail in sorted(candidates, key=lambda item: item[0]):
        segment = tail.lstrip(" ：:")
        stops = []
        for stop in SECTION_STOPS:
            if stop in labels:
                continue
            pos = segment.find(stop)
            if pos > 0:
                stops.append(pos)
        if stops:
            segment = segment[: min(stops)]
        segment = segment.strip(" ：:")[:limit]
        if segment and segment not in {"更多", "相关课程"}:
            return segment
    return MISSING


def extract_label_value(text: str, label: str, limit: int = 220) -> str:
    value = extract_after_labels(text, (label,), limit)
    if value == MISSING:
        return MISSING
    for stop in ("结束时间", "课程价格", "授课讲师", "开课地点", "课程类别", "推荐指数", "咨询热线", "适用对象", "课程时长", "近期开课", "课程收益"):
        pos = value.find(stop)
        if pos > 0:
            value = value[:pos].strip()
    return value or MISSING


def valid_section(value: str) -> str:
    text = clean_html(value)
    if text in {MISSING, "更多", "相关课程", "课程大纲", "课程收益", "课程特色", "热门相关内训课程"}:
        return MISSING
    if text.startswith("相关课程") or text.startswith("近期热门公开课程") or text.startswith("热门相关内训课程"):
        return MISSING
    return text


def clean_trainer(value: Any) -> str:
    text = clean_html(value, MISSING)
    if text == MISSING:
        return MISSING
    for stop in ("专长领域", "行业领域", "擅长解决的问题", "适用对象", "课程收益"):
        pos = text.find(stop)
        if pos > 0:
            text = text[:pos]
    text = re.split(r"[|,，/]\s*", text)[0].strip()
    return text[:80] or MISSING


def parse_duration_days(*values: Any) -> int:
    text = " ".join(clean_html(value) for value in values if value)
    match = re.search(r"(\d+(?:\.\d+)?)\s*天", text)
    if match:
        return max(1, int(float(match.group(1))))
    return 0


def parse_annual_date_range(date_text: str, year: int = 2026) -> tuple[str, str, str]:
    text = clean_html(date_text)
    dates = re.findall(r"(\d{1,2})月(\d{1,2})日", text)
    if not dates:
        return "", "", text
    start_m, start_d = dates[0]
    end_m, end_d = dates[-1]
    start = f"{year:04d}-{int(start_m):02d}-{int(start_d):02d}"
    end = f"{year:04d}-{int(end_m):02d}-{int(end_d):02d}"
    return start, end, text


def parse_full_datetime(value: str) -> str:
    text = clean_html(value)
    match = re.search(r"(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s+(\d{1,2}):(\d{2}))?", text)
    if not match:
        return ""
    y, m, d, hh, mm = match.groups()
    result = f"{int(y):04d}-{int(m):02d}-{int(d):02d}"
    if hh and mm:
        result = f"{result} {int(hh):02d}:{mm}"
    return result


def normalize_location(value: Any) -> dict[str, str]:
    raw = clean_html(value)
    if not raw:
        return {}
    city_key = ""
    for city in CITY_PROVINCES:
        if city in raw:
            city_key = city
            break
    if city_key:
        province, city_name = CITY_PROVINCES[city_key]
        return {
            "province_name_raw": province,
            "city_name_raw": city_name,
            "city": city_name,
            "location": raw,
            "address": raw,
            "sourceLocationText": raw,
        }
    return {"city_name_raw": raw, "city": raw, "location": raw, "address": raw, "sourceLocationText": raw}


def parse_open_plan_rows(html: str, *, limit: int | None = None) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    current_month = ""
    for row_html in re.findall(r"<tr[^>]*>([\s\S]*?)</tr>", html, flags=re.I):
        if "课程名称" in clean_html(row_html) and "非会员价" in clean_html(row_html):
            continue
        cells = [clean_html(cell) for cell in re.findall(r"<t[dh][^>]*>([\s\S]*?)</t[dh]>", row_html, flags=re.I)]
        if len(cells) < 9:
            continue
        if re.fullmatch(r"\d+月", cells[0]):
            current_month = cells[0]
            cells = cells[1:]
        if len(cells) < 9:
            continue
        date_text, category, title_cell, trainer, trainer_intro, audience, price_raw, member_ticket, location = cells[:9]
        link_match = re.search(r'<a[^>]+href=["\']([^"\']*info_\d+\.html)["\'][^>]*>([\s\S]*?)</a>', row_html, flags=re.I)
        if not link_match:
            continue
        url = absolute_url(link_match.group(1))
        if url in seen:
            continue
        seen.add(url)
        title = clean_html(link_match.group(2), title_cell)
        start_date, end_date, source_date = parse_annual_date_range(date_text)
        plan = {
            "startDate": start_date,
            "start_date": start_date,
            "endDate": end_date,
            "end_date": end_date,
            "sourceDateText": source_date,
            "priceRaw": price_raw,
            "signupUrl": url,
            "type": "OFFLINE",
        }
        plan.update(normalize_location(location))
        rows.append(
            {
                "url": url,
                "source_course_id": source_id_from_url(url),
                "title": title,
                "category_name_raw": category or "公开课",
                "date_text": date_text,
                "month": current_month,
                "trainer_name_raw": trainer,
                "trainer_intro_raw": trainer_intro,
                "audience": audience,
                "price_raw": price_raw,
                "member_ticket_raw": member_ticket,
                "location_text": location,
                "plans_json": [{key: value for key, value in plan.items() if value not in {"", None}}],
                "type": "OPEN_OFFLINE",
                "source_entry": "public_annual_schedule",
            }
        )
        if limit and len(rows) >= limit:
            break
    return rows


def parse_internal_list_rows(html: str, *, limit: int | None = None) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    for href, body in re.findall(r'<a[^>]+href=["\']([^"\']*info_\d+\.html)["\'][^>]*>([\s\S]*?)</a>', html, flags=re.I):
        url = absolute_url(href)
        if "/lesson/" not in url and not href.startswith("info_"):
            continue
        if url in seen:
            continue
        title = clean_html(body, MISSING).strip("· ")
        if not title or title in {"更多", "更多>>", MISSING} or len(title) < 4:
            continue
        seen.add(url)
        rows.append(
            {
                "url": url,
                "source_course_id": source_id_from_url(url),
                "title": title,
                "category_name_raw": MISSING,
                "type": "INTERNAL",
                "source_entry": "lesson_internal_list",
            }
        )
        if limit and len(rows) >= limit:
            break
    return rows


def extract_cover_url(html: str) -> str:
    match = re.search(r'<img[^>]+src=["\']([^"\']+)["\'][^>]*(?:alt=["\'][^"\']*["\'])?', html, flags=re.I)
    if match:
        src = match.group(1)
        if "logo" not in src.lower() and "Navigation" not in src:
            return absolute_url(src)
    return ""


def normalize_detail_image_url(src: str) -> str:
    value = (src or "").strip()
    protocol_positions = [match.start() for match in re.finditer(r"https?://", value, flags=re.I)]
    if len(protocol_positions) > 1:
        value = value[protocol_positions[-1]:]
    return absolute_url(value)


def extract_h2_section_html(html: str, heading: str) -> str:
    pattern = rf"<h2[^>]*>\s*{re.escape(heading)}\s*</h2>\s*(<div[^>]+class=[\"'][^\"']*gkkin03_xx[^\"']*[\"'][^>]*>[\s\S]*?</div>)"
    match = re.search(pattern, html, flags=re.I)
    return match.group(1) if match else ""


def extract_syllabus_image_assets(html: str) -> list[dict[str, str]]:
    section_html = extract_h2_section_html(html, "课程大纲")
    assets: list[dict[str, str]] = []
    seen: set[str] = set()
    for src in re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', section_html, flags=re.I):
        url = normalize_detail_image_url(src)
        if not url or url in seen:
            continue
        seen.add(url)
        assets.append(media_asset("syllabus_image", url, "课程大纲图片"))
    return assets


def extract_h3_section_html(html: str, heading: str) -> str:
    pattern = rf"<h3[^>]*>\s*{re.escape(heading)}[\s\S]*?</h3>\s*(<h2[^>]*>[\s\S]*?</h2>)"
    match = re.search(pattern, html, flags=re.I)
    return match.group(1) if match else ""


def extract_internal_section_image_assets(html: str, heading: str, kind: str, label: str) -> list[dict[str, str]]:
    section_html = extract_h3_section_html(html, heading)
    assets: list[dict[str, str]] = []
    seen: set[str] = set()
    for src in re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', section_html, flags=re.I):
        url = normalize_detail_image_url(src)
        lower_url = url.lower()
        if not url or url in seen:
            continue
        if any(skip in lower_url for skip in ("/images/house-courses/", "/images/index/", "but_", "logo")):
            continue
        seen.add(url)
        assets.append(media_asset(kind, url, label))
    return assets


def extract_internal_syllabus_image_assets(html: str) -> list[dict[str, str]]:
    return extract_internal_section_image_assets(html, "课程内容", "syllabus_image", "课程内容图片")


def extract_site_photo_assets(html: str) -> list[dict[str, str]]:
    return extract_internal_section_image_assets(html, "现场图片", "site_photo", "现场图片")


def build_plan_from_detail(item: dict[str, Any], text: str) -> dict[str, Any]:
    start_raw = extract_label_value(text, "开课时间", 120)
    end_raw = extract_label_value(text, "结束时间", 120)
    location_raw = extract_label_value(text, "开课地点", 220)
    if start_raw == MISSING:
        start_raw = item.get("date_text", "")
    start = parse_full_datetime(start_raw) or (item.get("plans_json") or [{}])[0].get("startDate", "")
    end = parse_full_datetime(end_raw) or (item.get("plans_json") or [{}])[0].get("endDate", "")
    plan = {
        "startDate": start[:10] if start else "",
        "start_date": start[:10] if start else "",
        "endDate": end[:10] if end else "",
        "end_date": end[:10] if end else "",
        "startTime": start,
        "endTime": end,
        "sourceDateText": f"{start_raw} {end_raw}".strip(),
        "priceRaw": item.get("price_raw") or extract_label_value(text, "课程价格", 160),
        "signupUrl": item.get("url"),
        "type": "OFFLINE",
    }
    plan.update(normalize_location(location_raw if location_raw != MISSING else item.get("location_text", "")))
    return {key: value for key, value in plan.items() if value not in {"", None, MISSING}}


def parse_open_detail_html(item: dict[str, Any], html: str) -> Dict[str, Any]:
    text = extract_detail_text(html)
    syllabus_html = extract_h2_section_html(html, "课程大纲")
    syllabus_images = extract_syllabus_image_assets(html)
    title = extract_title(html, item.get("title") or MISSING)
    category = extract_label_value(text, "课程类别", 120)
    if category == MISSING:
        category = item.get("category_name_raw") or MISSING
    price_raw = item.get("price_raw") or extract_label_value(text, "课程价格", 180)
    trainer = extract_label_value(text, "授课讲师", 100)
    if trainer == MISSING:
        trainer = item.get("trainer_name_raw") or MISSING
    audience = extract_label_value(text, "适用对象", 800)
    if audience == MISSING:
        audience = item.get("audience") or MISSING
    duration_days = parse_duration_days(extract_label_value(text, "课程时长", 80), item.get("date_text"))
    plan = build_plan_from_detail(item, text)
    record: Dict[str, Any] = {
        "source_course_id": item.get("source_course_id") or source_id_from_url(item["url"]),
        "source_url": item["url"],
        "title": title,
        "type": "OPEN_OFFLINE",
        "category_name_raw": category,
        "cover_url": extract_cover_url(html),
        "intro": valid_section(extract_after_labels(text, ("课程介绍", "课程背景"), 1200)),
        "summary": meta_content(html, "description")[:500],
        "syllabus": valid_section(extract_after_labels(text, ("课程大纲",), 5000)),
        "audience": audience,
        "target_audience": "",
        "learning_outcomes": valid_section(extract_after_labels(text, ("课程收益", "课程目标"), 1800)),
        "highlights": valid_section(extract_after_labels(text, ("课程特色",), 1200)),
        "duration_days": duration_days,
        "total_hours": float(duration_days * 6) if duration_days else 0,
        "original_price": 0,
        "keywords": meta_content(html, "keywords"),
        "trainer_name_raw": clean_trainer(trainer),
        "plans_json": [plan] if plan else item.get("plans_json", []),
        "services_json": syllabus_images.copy(),
        "raw_json": {
            "source_entry": item.get("source_entry", "public_annual_schedule"),
            "source_entry_name": "公开课/年度排期表",
            "content_type": "COURSE",
            "type_evidence": "hztbc_public_schedule_has_date_location_price",
            "category_evidence": "公开课详情课程类别或年度排期课程模块",
            "field_sources": {
                "plans_json": "2026年公开课排期表和公开课详情页开课时间/地点",
                "price": "年度排期非会员价或详情页课程价格",
                "trainer_name_raw": "年度排期讲师或详情页授课讲师",
                "learning_outcomes": "详情页课程收益/课程目标",
                "audience": "年度排期培训对象或详情页适用对象",
                "syllabus": "详情页课程大纲",
            },
            "coverage_notes": coverage_notes(),
            "diagnostics": [],
        },
    }
    if syllabus_images:
        apply_content_block(
            record,
            "syllabus",
            plain_text="" if record["syllabus"] == MISSING else record["syllabus"],
            images=syllabus_images,
        )
    apply_syllabus_rich_content(
        record,
        syllabus_html,
        plain_text="" if record["syllabus"] == MISSING else record["syllabus"],
        images=syllabus_images,
        base_url=BASE_URL,
    )
    set_price_fields(record, price_raw)
    for plan_item in record["plans_json"]:
        start = plan_item.get("startDate")
        if not start:
            append_diagnostic(record, "plans_json.startDate", "source_schedule_date_missing_or_unparsed", plan_item.get("sourceDateText", ""))
        else:
            try:
                if datetime.strptime(start, "%Y-%m-%d").date() < date.today():
                    append_diagnostic(record, "plans_json.startDate", "source_schedule_date_is_in_past", start)
            except ValueError:
                append_diagnostic(record, "plans_json.startDate", "source_schedule_date_missing_or_unparsed", start)
        if not plan_item.get("province_name_raw"):
            append_diagnostic(record, "plans_json.province_name_raw", "source_location_needs_manual_province_mapping", plan_item.get("sourceLocationText"))
    if record["learning_outcomes"] == MISSING and record["syllabus"] == MISSING:
        append_diagnostic(record, "detail_content", "public_detail_has_schedule_only_or_content_hidden")
    enrich_course_record(record, fallback_type="OPEN_OFFLINE")
    record["type"] = "OPEN_OFFLINE"
    record["raw_json"]["content_type"] = "COURSE"
    record["raw_json"]["type_evidence"] = "hztbc_public_schedule_has_date_location_price"
    return record


def parse_internal_detail_html(item: dict[str, Any], html: str) -> Dict[str, Any]:
    text = extract_detail_text(html)
    syllabus_html = extract_h3_section_html(html, "课程内容")
    syllabus_images = extract_internal_syllabus_image_assets(html)
    site_photo_images = extract_site_photo_assets(html)
    title = extract_title(html, item.get("title") or MISSING)
    category = extract_after_labels(text, ("领 域",), 160)
    if category != MISSING:
        category = re.sub(r"培训对象.*$", "", category).strip()
    else:
        category = item.get("category_name_raw") or MISSING
    audience = extract_label_value(text, "培训对象", 1000)
    if audience == MISSING:
        audience = extract_label_value(text, "适用对象", 1000)
    duration_days = parse_duration_days(extract_label_value(text, "课程时长", 80), title, text[:800])
    trainer = clean_trainer(extract_label_value(text, "讲师", 180))
    record: Dict[str, Any] = {
        "source_course_id": item.get("source_course_id") or source_id_from_url(item["url"]),
        "source_url": item["url"],
        "title": title,
        "type": "INTERNAL",
        "category_name_raw": category,
        "cover_url": extract_cover_url(html),
        "intro": valid_section(extract_after_labels(text, ("课程介绍", "课程背景"), 1200)),
        "summary": meta_content(html, "description")[:500],
        "syllabus": valid_section(extract_after_labels(text, ("课程大纲",), 5000)),
        "audience": audience,
        "target_audience": "",
        "learning_outcomes": valid_section(extract_after_labels(text, ("课程收益", "课程目标"), 1800)),
        "highlights": valid_section(extract_after_labels(text, ("课程特色",), 1200)),
        "duration_days": duration_days,
        "total_hours": float(duration_days * 6) if duration_days else 0,
        "original_price": 0,
        "keywords": meta_content(html, "keywords"),
        "trainer_name_raw": trainer,
        "plans_json": [],
        "services_json": syllabus_images.copy() + site_photo_images.copy(),
        "raw_json": {
            "source_entry": item.get("source_entry", "lesson_internal_list"),
            "source_entry_name": "企业内训",
            "content_type": "COURSE",
            "type_evidence": "hztbc_lesson_internal_course_detail",
            "category_evidence": "内训详情页领域或内训分类列表",
            "field_sources": {
                "plans_json": "企业内训课程无公开固定排期",
                "price": "内训按企业需求咨询/面议",
                "trainer_name_raw": "详情页讲师信息，如未显示则人工补填",
                "learning_outcomes": "详情页课程收益/课程目标",
                "audience": "详情页培训对象",
                "syllabus": "详情页课程大纲",
            },
            "coverage_notes": coverage_notes(),
            "diagnostics": [],
        },
    }
    if syllabus_images:
        apply_content_block(
            record,
            "syllabus",
            plain_text="" if record["syllabus"] == MISSING else record["syllabus"],
            images=syllabus_images,
        )
    apply_syllabus_rich_content(
        record,
        syllabus_html,
        plain_text="" if record["syllabus"] == MISSING else record["syllabus"],
        images=syllabus_images,
        base_url=BASE_URL,
    )
    if site_photo_images:
        apply_content_block(record, "site_photos", images=site_photo_images)
    set_price_fields(record, "内训咨询")
    append_diagnostic(record, "plans_json", "internal_course_has_no_public_schedule")
    enrich_course_record(record, fallback_type="INTERNAL")
    record["type"] = "INTERNAL"
    record["raw_json"]["content_type"] = "COURSE"
    record["raw_json"]["type_evidence"] = "hztbc_lesson_internal_course_detail"
    return record


def parse_online_entry(html: str, url: str = ONLINE_ENTRY_URL) -> Dict[str, Any]:
    text = clean_html(html)
    return {
        "source_course_id": "e-learning",
        "source_url": url,
        "title": extract_title(html, "时代光华ELN网络学院"),
        "content_type": "RECORDED_VIDEO",
        "reason": "e_learning_platform_not_imported_to_courses",
        "evidence": "源站 E-learning 为企业在线学习/网络学院平台，当前不进入 courses 流程。",
        "raw_text_sample": text[:500],
    }


def coverage_notes() -> list[str]:
    return [
        "OPEN_OFFLINE 已覆盖：公开课年度排期表提供开课日期、课程模块、讲师、对象、价格、地点，详情页补充开课时间和详细地址。",
        "INTERNAL 已覆盖：lesson 内训课程库提供内训课程详情，价格按咨询/面议，排期留空并写诊断。",
        "OPEN_ONLINE 未导入 courses：E-learning/ELN 为企业在线学习平台，疑似录播/在线课件资源，应进入后续 video/online 独立流程。",
    ]


def discover_open_items(limit: int) -> list[dict[str, Any]]:
    rows = parse_open_plan_rows(fetch_text(OPEN_SCHEDULE_URL))
    future_rows = []
    past_rows = []
    for row in rows:
        start = (row.get("plans_json") or [{}])[0].get("startDate")
        try:
            target = datetime.strptime(start, "%Y-%m-%d").date()
        except Exception:
            target = None
        if target and target >= date.today():
            future_rows.append(row)
        else:
            past_rows.append(row)
    return (future_rows or past_rows)[:limit]


def discover_internal_items(limit: int) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    seen: set[str] = set()
    for url in INTERNAL_LIST_URLS:
        try:
            page_items = parse_internal_list_rows(fetch_text(url), limit=limit)
        except Exception as exc:
            logger.warning("hztbc internal list failed url=%s error=%s", url, exc)
            continue
        for item in page_items:
            if item["url"] in seen:
                continue
            seen.add(item["url"])
            items.append(item)
            if len(items) >= limit:
                return items
    return items


def iter_hztbc_courses(max_items: int | None = None):
    limit = max_items or 100
    open_quota = max(1, (limit + 1) // 2)
    internal_quota = max(1, limit - open_quota)
    candidates = discover_open_items(open_quota) + discover_internal_items(internal_quota)
    seen: set[str] = set()
    for item in candidates[:limit]:
        key = f"{item.get('source_course_id')}:{item.get('type')}"
        if key in seen:
            continue
        seen.add(key)
        try:
            html = fetch_text(item["url"])
            record = parse_internal_detail_html(item, html) if item.get("type") == "INTERNAL" else parse_open_detail_html(item, html)
            if record.get("raw_json", {}).get("content_type") in {"RECORDED_VIDEO", "DOCUMENT", "AUDIO"}:
                continue
            yield record
        except Exception as exc:
            logger.warning("hztbc course detail failed, skip url=%s error=%s", item.get("url"), exc)
        time.sleep(0.1)


def crawl_hztbc_courses(max_items: int | None = None) -> List[Dict[str, Any]]:
    return list(iter_hztbc_courses(max_items))


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class HztbcCourseSpider:
    """时代光华课程爬虫适配器，供 JobManager 调用。"""

    name = "hztbc_course"
    source = "hztbc"
    data_type = "COURSE"
    max_items = None
    supported_course_types = ("OPEN_OFFLINE", "INTERNAL")
    coverage_note = (
        "公开课年度排期表覆盖 OPEN_OFFLINE；lesson 内训课程库覆盖 INTERNAL；E-learning 为在线学习平台，当前不导入 courses。"
    )

    def pause(self) -> None:
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_hztbc_courses(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
