"""健峰企管集团课程爬虫适配器。"""
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


BASE_URL = "https://www.vmta.com"
OPEN_LIST_URL = f"{BASE_URL}/xk/"
STUDY_TOUR_URLS = [
    f"{BASE_URL}/rc/kc/34.html",
    f"{BASE_URL}/rc/kc/35.html",
    f"{BASE_URL}/rc/kc/36.html",
    f"{BASE_URL}/rc/kc/37.html",
]
INTERNAL_SERIES_URLS = [
    f"{BASE_URL}/rc/tx/tx2/",
    f"{BASE_URL}/rc/tx/tx3/",
    f"{BASE_URL}/rc/tx/tx4/",
    f"{BASE_URL}/rc/tx/tx5/",
    f"{BASE_URL}/rc/tx/tx6/",
    f"{BASE_URL}/rc/tx/tx7/",
    f"{BASE_URL}/rc/tx/tx8/",
    f"{BASE_URL}/rc/tx/tx9/",
    f"{BASE_URL}/rc/tx/tx10/",
    f"{BASE_URL}/rc/tx/tx11/",
    f"{BASE_URL}/rc/tx/tx12/",
    f"{BASE_URL}/rc/tx/tx13/",
    f"{BASE_URL}/rc/tx/tx14/",
    f"{BASE_URL}/rc/tx/tx15/",
]
ONLINE_ENTRY_URL = "https://elearning.vmta.com/"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
MISSING = "暂无"
logger = logging.getLogger(__name__)

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

SECTION_STOPS = (
    "课程日程表",
    "课程详情",
    "课程视频",
    "课程宗旨",
    "课程效益",
    "课程收益",
    "课程内容",
    "课程大纲",
    "上课精彩画面",
    "参加对象",
    "参加费用",
    "获取定制化课程大纲",
    "返回顶部",
    "关于健峰",
    "研学详情",
    "研学特色",
    "参访企业",
    "课程学习",
    "课纲",
    "关于我们",
)


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
    match = re.search(r"/(?:pxckx1/|kc/)(\d+)\.html", url)
    if match:
        return match.group(1)
    match = re.search(r"/rc/tx/(tx\d+)/?", url)
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
        r"<title[^>]*>([\s\S]*?)</title>",
    ):
        match = re.search(pattern, html, flags=re.I | re.S)
        if not match:
            continue
        title = clean_html(match.group(1), fallback)
        title = re.sub(r"\s*[_-].*健峰企管.*$", "", title).strip()
        title = re.sub(r"^首页\s*>\s*.*?>\s*", "", title).strip()
        if title and len(title) <= 180:
            return title
    return fallback


def extract_cover_url(html: str) -> str:
    for pattern in (
        r'<a[^>]+class=["\'][^"\']*img0[^"\']*["\'][\s\S]*?<img[^>]+src=["\']([^"\']+)["\']',
        r'<img[^>]+src=["\']([^"\']+)["\'][^>]+alt=["\'][^"\']+["\']',
    ):
        match = re.search(pattern, html, flags=re.I)
        if match:
            return absolute_url(match.group(1))
    return ""


def extract_detail_text(html: str) -> str:
    text = clean_html(html)
    positions = [text.find(anchor) for anchor in ("课程日程表", "课程详情", "研学详情", "课程宗旨", "课程体系规划") if text.find(anchor) >= 0]
    if positions:
        text = text[min(positions):]
    for stop in ("获取定制化课程大纲", "关于健峰", "Copyright"):
        pos = text.find(stop)
        if pos > 800:
            text = text[:pos]
    return text


def extract_detail_rich_html(html: str) -> str:
    starts = [html.find(label) for label in ("课程日程表", "课程详情", "研学详情", "课程宗门", "课程体系规划") if html.find(label) >= 0]
    start = min(starts) if starts else 0
    end = len(html)
    for marker in ("获取定制化课程大纲", "关于健峰", "Copyright"):
        pos = html.find(marker, start + 1)
        if pos > start:
            end = min(end, pos)
    return html[start:end]


def extract_after_labels(text: str, labels: Iterable[str], limit: int = 1800) -> str:
    candidates: list[tuple[int, str, str]] = []
    for label in labels:
        for match in re.finditer(re.escape(label), text):
            candidates.append((match.start(), label, text[match.end():]))
    if not candidates:
        return MISSING
    best_bad = MISSING
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
        if not segment:
            continue
        if best_bad == MISSING:
            best_bad = segment
        if segment in {"返回顶部", "课程视频", "课程详情", "参加对象", "开课安排"}:
            continue
        if segment.startswith(("返回顶部", "参加对象", "课程视频", "课程详情")):
            continue
        return segment
    return best_bad


def parse_duration_days(*values: Any) -> int:
    text = " ".join(clean_html(value) for value in values if value)
    match = re.search(r"(\d+(?:\.\d+)?)\s*(?:天|天\d*夜)", text)
    if match:
        return max(1, int(float(match.group(1))))
    return 0


def parse_date_range(value: Any) -> tuple[str, str, str]:
    text = clean_html(value)
    match = re.search(r"(\d{4})[-/年.](\d{1,2})[-/月.](\d{1,2})\s*(?:日)?(?:\s*(?:至|-|—|~)\s*(?:(\d{4})[-/年.])?(\d{1,2})[-/月.](\d{1,2}))?", text)
    if not match:
        return "", "", text
    y1, m1, d1, y2, m2, d2 = match.groups()
    start = f"{int(y1):04d}-{int(m1):02d}-{int(d1):02d}"
    if m2 and d2:
        end = f"{int(y2 or y1):04d}-{int(m2):02d}-{int(d2):02d}"
    else:
        end = start
    return start, end, text


def normalize_location(value: Any) -> dict[str, str]:
    raw = clean_html(value)
    if not raw:
        return {}
    if "健峰培训城" in raw:
        return {
            "province_name_raw": "浙江省",
            "city_name_raw": "余姚市",
            "city": "余姚市",
            "location": "健峰培训城",
            "address": "浙江省余姚市梁弄镇健峰城路8号",
            "sourceLocationText": raw,
        }
    if "苏州" in raw:
        return {
            "province_name_raw": "江苏省",
            "city_name_raw": "苏州市",
            "city": "苏州市",
            "location": raw,
            "address": raw,
            "sourceLocationText": raw,
        }
    if "上海" in raw:
        return {
            "province_name_raw": "上海市",
            "city_name_raw": "上海市",
            "city": "上海市",
            "location": raw,
            "address": raw,
            "sourceLocationText": raw,
        }
    parts = [part.strip() for part in re.split(r"[·/\-＞>]", raw) if part.strip()]
    city = parts[-1] if parts else raw
    return {"city_name_raw": city, "city": city, "location": raw, "address": raw, "sourceLocationText": raw}


def parse_schedule_table(html: str, fallback_url: str = "") -> list[dict[str, Any]]:
    plans: list[dict[str, Any]] = []
    for table in re.findall(r"<table[\s\S]*?</table>", html, flags=re.I):
        header = clean_html(table)
        if "开课时间" not in header or "价格" not in header:
            continue
        rows = re.findall(r"<tr[^>]*>([\s\S]*?)</tr>", table, flags=re.I)
        for row_html in rows[1:]:
            cells = [clean_html(cell) for cell in re.findall(r"<td[^>]*>([\s\S]*?)</td>", row_html, flags=re.I)]
            if len(cells) < 3:
                continue
            start, end, date_text = parse_date_range(cells[0])
            plan = {
                "startDate": start,
                "start_date": start,
                "endDate": end,
                "end_date": end,
                "sourceDateText": date_text,
                "priceRaw": cells[2],
                "signupUrl": fallback_url,
                "type": "OFFLINE",
            }
            plan.update(normalize_location(cells[1]))
            plans.append({key: value for key, value in plan.items() if value not in {"", None}})
    return plans


def parse_text_schedule(text: str, fallback_url: str = "", fallback_location: str = "", fallback_price: str = "") -> list[dict[str, Any]]:
    plans: list[dict[str, Any]] = []
    pattern = r"(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}(?:日)?(?:\s*(?:至|-|—|~)\s*(?:\d{4}[-/年])?\d{1,2}[-/月]\d{1,2}(?:日)?)?)\s+([^\s]+(?:市|城|培训城)?)\s+([0-9,]+)"
    for date_text, location_text, price_text in re.findall(pattern, text):
        start, end, source_date = parse_date_range(date_text)
        plan = {
            "startDate": start,
            "start_date": start,
            "endDate": end,
            "end_date": end,
            "sourceDateText": source_date,
            "priceRaw": price_text,
            "signupUrl": fallback_url,
            "type": "OFFLINE",
        }
        plan.update(normalize_location(location_text))
        plans.append({key: value for key, value in plan.items() if value not in {"", None}})
    if not plans and ("开课时间" in text or fallback_location):
        start, end, source_date = parse_date_range(text)
        plan = {
            "startDate": start,
            "start_date": start,
            "endDate": end,
            "end_date": end,
            "sourceDateText": source_date if start else "",
            "priceRaw": clean_html(fallback_price),
            "signupUrl": fallback_url,
            "type": "OFFLINE",
        }
        plan.update(normalize_location(fallback_location))
        if plan.get("sourceDateText") or plan.get("location"):
            plans.append({key: value for key, value in plan.items() if value not in {"", None}})
    return plans


def parse_card_fields(card_html: str) -> dict[str, str]:
    fields: dict[str, str] = {}
    for label, value in re.findall(r'<div[^>]+class=["\'][^"\']*span[^"\']*["\'][^>]*>\s*<span[^>]*>([\s\S]*?)</span>\s*<em[^>]*>([\s\S]*?)</em>', card_html, flags=re.I):
        fields[clean_html(label)] = clean_html(value)
    return fields


def parse_open_list_rows(html: str, *, limit: int | None = None) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    for card in re.findall(r'<div[^>]+class=["\'][^"\']*li1[^"\']*["\'][^>]*>([\s\S]*?)(?=<div[^>]+class=["\'][^"\']*li1[^"\']*["\']|<div[^>]+class=["\'][^"\']*pages|</div>\s*</div>\s*</div>\s*<div[^>]+class=["\']fo)', html, flags=re.I):
        link_match = re.search(r'<a[^>]+href=["\']([^"\']*/xk/pxckx1/\d+\.html)["\'][^>]*>[\s\S]*?<strong[^>]*>([\s\S]*?)</strong>', card, flags=re.I)
        if not link_match:
            link_match = re.search(r'<a[^>]+href=["\']([^"\']*/xk/pxckx1/\d+\.html)["\'][^>]*>[\s\S]*?<img[^>]+alt=["\']([^"\']+)["\']', card, flags=re.I)
        if not link_match:
            continue
        url = absolute_url(link_match.group(1))
        if url in seen:
            continue
        seen.add(url)
        fields = parse_card_fields(card)
        table_plans = parse_schedule_table(card, url)
        preview = extract_after_labels(clean_html(card), ("课程预览",), 900)
        audience = extract_after_labels(clean_html(card), ("参加对象",), 700)
        location = fields.get("开课区域", "")
        price_raw = fields.get("价 格") or (table_plans[0].get("priceRaw") if table_plans else "")
        plans = table_plans or parse_text_schedule(clean_html(card), url, location, price_raw)
        rows.append(
            {
                "url": url,
                "source_course_id": source_id_from_url(url),
                "title": clean_html(link_match.group(2), MISSING),
                "category_name_raw": "开班计划",
                "duration_days": fields.get("天 数", ""),
                "price_raw": price_raw,
                "location_text": location,
                "plans_json": plans,
                "intro": preview,
                "audience": audience,
                "type": "OPEN_OFFLINE",
                "source_entry": "open_schedule_list",
            }
        )
        if limit and len(rows) >= limit:
            break
    return rows


def build_open_record(item: dict[str, Any], html: str) -> Dict[str, Any]:
    text = extract_detail_text(html)
    rich_html = extract_detail_rich_html(html)
    full_text = clean_html(html)
    fields = parse_card_fields(html)
    duration_days = parse_duration_days(item.get("duration_days"), fields.get("天 数"), text)
    plans = parse_schedule_table(html, item["url"]) or item.get("plans_json") or parse_text_schedule(
        full_text,
        item["url"],
        item.get("location_text") or fields.get("开课区域", ""),
        item.get("price_raw") or fields.get("价 格", ""),
    )
    if duration_days and plans:
        for plan in plans:
            if plan.get("startDate") and not plan.get("endDate"):
                plan["endDate"] = (datetime.strptime(plan["startDate"], "%Y-%m-%d").date() + timedelta(days=duration_days - 1)).isoformat()
                plan["end_date"] = plan["endDate"]
    summary = meta_content(html, "description")
    intro = extract_after_labels(text, ("课程宗旨", "课程背景", "课程预览"), 1500)
    outcomes = extract_after_labels(text, ("课程效益", "课程收益", "课程目的"), 1800)
    syllabus = extract_after_labels(text, ("课程内容", "课程大纲", "课纲"), 5000)
    audience = extract_after_labels(text, ("参加对象", "培训对象", "适合对象"), 1000)
    if audience == MISSING:
        audience = item.get("audience") or MISSING
    record: Dict[str, Any] = {
        "source_course_id": item.get("source_course_id") or source_id_from_url(item["url"]),
        "source_url": item["url"],
        "title": extract_title(html, item.get("title") or MISSING),
        "type": "OPEN_OFFLINE",
        "category_name_raw": item.get("category_name_raw") or "开班计划",
        "cover_url": extract_cover_url(html),
        "intro": intro if intro != MISSING else item.get("intro") or summary,
        "summary": (summary if summary != MISSING else (intro if intro != MISSING else item.get("intro") or ""))[:500],
        "syllabus": syllabus,
        "audience": audience,
        "target_audience": "",
        "learning_outcomes": outcomes,
        "highlights": extract_after_labels(text, ("课程特色", "上课精彩画面"), 1200),
        "duration_days": duration_days,
        "total_hours": float(duration_days * 6) if duration_days else 0,
        "original_price": 0,
        "keywords": meta_content(html, "keywords"),
        "trainer_name_raw": MISSING,
        "plans_json": plans,
        "services_json": [],
        "raw_json": {
            "source_entry": item.get("source_entry", "open_schedule_list"),
            "source_entry_name": "选课中心/开班计划",
            "content_type": "COURSE",
            "type_evidence": "vmta_xk_schedule_has_offline_location_price",
            "category_evidence": "选课中心列表未暴露单课所属筛选分类，保留为开班计划",
            "field_sources": {
                "plans_json": "详情页课程日程表或列表展开排期表",
                "price": "详情页价 格或日程表价格",
                "learning_outcomes": "详情页课程效益/课程收益",
                "audience": "详情页参加对象",
                "syllabus": "详情页课程内容/课程大纲",
            },
            "coverage_notes": coverage_notes(),
            "diagnostics": [],
        },
    }
    apply_syllabus_rich_content(
        record,
        rich_html,
        plain_text="" if record["syllabus"] == MISSING else record["syllabus"],
        base_url=BASE_URL,
    )
    set_price_fields(record, item.get("price_raw") or fields.get("价 格") or (plans[0].get("priceRaw") if plans else ""))
    if not plans:
        append_diagnostic(record, "plans_json", "open_offline_schedule_missing_or_unparsed")
    for plan in plans:
        if plan.get("startDate"):
            try:
                if datetime.strptime(plan["startDate"], "%Y-%m-%d").date() < date.today():
                    append_diagnostic(record, "plans_json.startDate", "source_schedule_date_is_in_past", plan["startDate"])
            except ValueError:
                append_diagnostic(record, "plans_json.startDate", "source_schedule_date_missing_or_unparsed", plan.get("sourceDateText", ""))
        else:
            append_diagnostic(record, "plans_json.startDate", "source_schedule_date_missing_or_unparsed", plan.get("sourceDateText", ""))
        if not plan.get("province_name_raw"):
            append_diagnostic(record, "plans_json.province_name_raw", "source_location_needs_manual_province_mapping", plan.get("sourceLocationText"))
    enrich_course_record(record, fallback_type="OPEN_OFFLINE")
    record["type"] = "OPEN_OFFLINE"
    record["raw_json"]["content_type"] = "COURSE"
    record["raw_json"]["type_evidence"] = "vmta_xk_schedule_has_offline_location_price"
    return record


def extract_study_tour_syllabus_images(html: str) -> list[dict[str, str]]:
    starts = [html.find(label) for label in ("参访企业", "研学详情", "课纲") if html.find(label) >= 0]
    if not starts:
        return []
    start = min(starts)
    end = len(html)
    for marker in ('<li class="a3', '<li class="a4', "关于我们", "获取定制化课程大纲"):
        pos = html.find(marker, start + 1)
        if pos > start:
            end = min(end, pos)
    section_html = html[start:end]
    assets: list[dict[str, str]] = []
    seen: set[str] = set()
    for src in re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', section_html, flags=re.I):
        url = absolute_url(src)
        lower_url = url.lower()
        if not url or url in seen:
            continue
        if any(skip in lower_url for skip in ("/css/", "/images/", "logo", "banner")):
            continue
        seen.add(url)
        assets.append(media_asset("syllabus_image", url, "参访企业图片"))
    return assets


def extract_study_tour_syllabus_html(html: str) -> str:
    starts = [html.find(label) for label in ("参访企业", "研学详情", "课纲") if html.find(label) >= 0]
    if not starts:
        return ""
    start = min(starts)
    end = len(html)
    for marker in ('<li class="a3', '<li class="a4', "关于我们", "获取定制化课程大纲"):
        pos = html.find(marker, start + 1)
        if pos > start:
            end = min(end, pos)
    return html[start:end]


def parse_study_tour_detail_html(url: str, html: str) -> Dict[str, Any]:
    text = extract_detail_text(html)
    full_text = clean_html(html)
    syllabus_html = extract_study_tour_syllabus_html(html)
    syllabus_images = extract_study_tour_syllabus_images(html)
    title = extract_title(html)
    location_match = re.search(rf"{re.escape(title)}\s+([^ ]*[·]?[^ ]+)\s+出团时间", full_text)
    location_text = clean_html(location_match.group(1)) if location_match else ""
    date_text = extract_after_labels(full_text, ("出团时间",), 180)
    audience = extract_after_labels(full_text, ("参加对象",), 700)
    price_text = extract_after_labels(full_text, ("参加费用",), 180)
    duration_days = parse_duration_days(date_text, full_text)
    plan = {
        "sourceDateText": date_text,
        "sourceLocationText": location_text,
        "signupUrl": url,
        "type": "OFFLINE",
    }
    plan.update(normalize_location(location_text))
    record: Dict[str, Any] = {
        "source_course_id": f"kc-{source_id_from_url(url)}",
        "source_url": url,
        "title": title,
        "type": "OPEN_OFFLINE",
        "category_name_raw": "企业考察研学",
        "cover_url": extract_cover_url(html),
        "intro": extract_after_labels(text, ("研学特色", "研学详情"), 1500),
        "summary": extract_after_labels(text, ("研学特色", "研学详情"), 500),
        "syllabus": extract_after_labels(text, ("课纲", "参访企业", "研学详情"), 5000),
        "audience": audience,
        "target_audience": "",
        "learning_outcomes": extract_after_labels(text, ("课程学习", "研学特色"), 1800),
        "highlights": extract_after_labels(text, ("研学特色", "参访亮点"), 1200),
        "duration_days": duration_days,
        "total_hours": float(duration_days * 6) if duration_days else 0,
        "original_price": 0,
        "keywords": meta_content(html, "keywords"),
        "trainer_name_raw": MISSING,
        "plans_json": [{key: value for key, value in plan.items() if value not in {"", None}}],
        "services_json": syllabus_images.copy(),
        "raw_json": {
            "source_entry": "study_tour_detail",
            "source_entry_name": "企业考察研学",
            "content_type": "COURSE",
            "type_evidence": "vmta_study_tour_has_offline_location_price_time",
            "category_evidence": "企业考察研学栏目",
            "field_sources": {
                "plans_json": "研学详情页出团时间和地点",
                "price": "研学详情页参加费用",
                "learning_outcomes": "课程学习/研学特色",
                "audience": "参加对象",
                "syllabus": "课纲/参访企业",
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
    set_price_fields(record, price_text)
    append_diagnostic(record, "plans_json.startDate", "study_tour_schedule_year_missing", date_text)
    if not location_text:
        append_diagnostic(record, "plans_json.location", "study_tour_location_missing_or_unparsed")
    enrich_course_record(record, fallback_type="OPEN_OFFLINE")
    record["type"] = "OPEN_OFFLINE"
    record["raw_json"]["content_type"] = "COURSE"
    record["raw_json"]["type_evidence"] = "vmta_study_tour_has_offline_location_price_time"
    return record


def parse_internal_series_detail_html(url: str, html: str) -> Dict[str, Any]:
    text = extract_detail_text(html)
    full_text = clean_html(html)
    rich_html = extract_detail_rich_html(html)
    title = extract_title(html)
    intro = extract_after_labels(text, ("课程体系规划", "课程体系", "课程宗旨"), 1500)
    syllabus = extract_after_labels(text, ("课程体系", "课程内容", "课纲"), 5000)
    outcomes = extract_after_labels(text, ("课程收益", "课程效益", "解决方案"), 1800)
    for dirty in ("解决方案 定制化专班培训", "培训城 培训城介绍", "管理宝库"):
        if intro.startswith(dirty):
            intro = MISSING
        if syllabus.startswith(dirty):
            syllabus = MISSING
        if outcomes.startswith(dirty):
            outcomes = MISSING
    record: Dict[str, Any] = {
        "source_course_id": f"series-{source_id_from_url(url)}",
        "source_url": url,
        "title": title,
        "type": "INTERNAL",
        "category_name_raw": title,
        "cover_url": extract_cover_url(html),
        "intro": intro,
        "summary": full_text[:500],
        "syllabus": syllabus,
        "audience": extract_after_labels(text, ("适合对象", "参加对象", "培训对象"), 1000),
        "target_audience": "",
        "learning_outcomes": outcomes,
        "highlights": extract_after_labels(text, ("课程特色", "系列特色", "课程亮点"), 1200),
        "duration_days": 0,
        "total_hours": 0,
        "original_price": 0,
        "keywords": meta_content(html, "keywords"),
        "trainer_name_raw": MISSING,
        "plans_json": [],
        "services_json": [],
        "raw_json": {
            "source_entry": "internal_series_page",
            "source_entry_name": "课程体系规划",
            "content_type": "COURSE",
            "type_evidence": "vmta_training_system_page_for_custom_internal_training",
            "category_evidence": "课程体系规划栏目",
            "field_sources": {
                "plans_json": "课程体系/内训方案页无公开固定排期",
                "price": "课程体系/内训方案按企业需求咨询定制",
                "learning_outcomes": "课程体系页课程收益/解决方案",
                "audience": "课程体系页适合对象/参加对象",
                "syllabus": "课程体系页课程内容",
            },
            "coverage_notes": coverage_notes(),
            "diagnostics": [],
        },
    }
    apply_syllabus_rich_content(
        record,
        rich_html,
        plain_text="" if record["syllabus"] == MISSING else record["syllabus"],
        base_url=BASE_URL,
    )
    set_price_fields(record, "内训咨询")
    append_diagnostic(record, "plans_json", "internal_course_has_no_public_schedule")
    if record["intro"] == MISSING:
        append_diagnostic(record, "intro", "internal_series_page_intro_unparsed")
    enrich_course_record(record, fallback_type="INTERNAL")
    record["type"] = "INTERNAL"
    record["raw_json"]["content_type"] = "COURSE"
    record["raw_json"]["type_evidence"] = "vmta_training_system_page_for_custom_internal_training"
    return record


def parse_online_entry(html: str, url: str = ONLINE_ENTRY_URL) -> Dict[str, Any]:
    text = clean_html(html)
    return {
        "source_course_id": "elearning",
        "source_url": url,
        "title": extract_title(html, "健峰云会员平台"),
        "content_type": "RECORDED_VIDEO",
        "reason": "elearning_platform_not_imported_to_courses",
        "evidence": "源站线上入口为健峰云会员平台/在线学习系统，当前不进入 courses 流程。",
        "raw_text_sample": text[:500],
    }


def coverage_notes() -> list[str]:
    return [
        "OPEN_OFFLINE 已覆盖：选课中心/开班计划提供线下开课日期、地点、价格；企业考察研学提供出团时间、城市、费用和对象，作为线下公开研学课进入审核。",
        "INTERNAL 已覆盖：课程体系规划页作为企业内训/定制培养体系，按 INTERNAL 进入审核，价格和排期保留为咨询/无固定排期。",
        "OPEN_ONLINE 未导入 courses：源站线上入口为健峰云会员平台/在线学习系统，疑似录播或在线学习平台，后续应进入 video/online 独立流程。",
    ]


def discover_open_items(limit: int) -> list[dict[str, Any]]:
    items = parse_open_list_rows(fetch_text(OPEN_LIST_URL), limit=limit)
    return items[:limit]


def discover_internal_items(limit: int) -> list[dict[str, Any]]:
    return [
        {"url": url, "source_course_id": f"series-{source_id_from_url(url)}", "type": "INTERNAL", "source_entry": "internal_series_page"}
        for url in INTERNAL_SERIES_URLS[:limit]
    ]


def discover_study_tour_items(limit: int) -> list[dict[str, Any]]:
    return [
        {"url": url, "source_course_id": f"kc-{source_id_from_url(url)}", "type": "OPEN_OFFLINE", "source_entry": "study_tour_detail"}
        for url in STUDY_TOUR_URLS[:limit]
    ]


def iter_vmta_courses(max_items: int | None = None):
    limit = max_items or 100
    open_quota = max(1, (limit + 1) // 2)
    study_quota = 1 if limit >= 3 else 0
    internal_quota = max(1, limit - open_quota - study_quota)
    candidates = (
        discover_open_items(open_quota)
        + discover_study_tour_items(study_quota)
        + discover_internal_items(internal_quota)
    )
    seen: set[str] = set()
    for item in candidates[:limit]:
        key = f"{item.get('source_course_id')}:{item.get('type')}"
        if key in seen:
            continue
        seen.add(key)
        try:
            html = fetch_text(item["url"])
            if item.get("source_entry") == "internal_series_page":
                record = parse_internal_series_detail_html(item["url"], html)
            elif item.get("source_entry") == "study_tour_detail":
                record = parse_study_tour_detail_html(item["url"], html)
            else:
                record = build_open_record(item, html)
            if record.get("raw_json", {}).get("content_type") in {"RECORDED_VIDEO", "DOCUMENT", "AUDIO"}:
                continue
            yield record
        except Exception as exc:
            logger.warning("vmta course detail failed, skip url=%s error=%s", item.get("url"), exc)
        time.sleep(0.1)


def crawl_vmta_courses(max_items: int | None = None) -> List[Dict[str, Any]]:
    return list(iter_vmta_courses(max_items))


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class VmtaCourseSpider:
    """健峰企管集团课程爬虫适配器，供 JobManager 调用。"""

    name = "vmta_course"
    source = "vmta"
    data_type = "COURSE"
    max_items = None
    supported_course_types = ("OPEN_OFFLINE", "INTERNAL")
    coverage_note = (
        "选课中心和企业考察研学覆盖 OPEN_OFFLINE；课程体系规划覆盖 INTERNAL；健峰云会员平台为线上学习/疑似录播入口，当前不导入 courses。"
    )

    def pause(self) -> None:
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_vmta_courses(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
