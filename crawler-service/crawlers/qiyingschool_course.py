"""企赢培训学院课程爬虫适配器。"""
import asyncio
import logging
import re
import ssl
import time
import urllib.request
from datetime import datetime
from html import unescape
from typing import Any, AsyncGenerator, Dict, Iterable, List
from urllib.parse import urljoin

from crawlers.course_utils import append_diagnostic, detect_content_type, enrich_course_record, set_price_fields


BASE_URL = "https://www.qiyingschool.com"
OPEN_LIST_URL = f"{BASE_URL}/gongkaike/"
INTERNAL_LIST_URL = f"{BASE_URL}/neixunke/"
VIDEO_LIST_URL = f"{BASE_URL}/video/"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
MISSING = "暂无"
logger = logging.getLogger(__name__)

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE


def fetch_text(url: str, timeout: int = 18, retries: int = 3) -> str:
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
            time.sleep(0.35 * attempt)
    raise RuntimeError(f"request failed after {retries} retries: {url}; {last_error}")


def clean_html(value: Any, default: str = "") -> str:
    if value is None:
        return default
    text = str(value)
    text = re.sub(r"<script[\s\S]*?</script>", " ", text, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<!--[\s\S]*?-->", " ", text)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"</p\s*>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text).replace("&nbsp;", " ")
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\n\s+", "\n", text)
    text = " ".join(text.split())
    return text or default


def absolute_url(value: str) -> str:
    return urljoin(BASE_URL, value or "")


def source_id_from_url(url: str) -> str:
    match = re.search(r"/(?:gongkaike|neixunke|video)/(\d+)(?:-\d+)?\.html", url)
    return match.group(1) if match else url.rstrip("/").rsplit("/", 1)[-1]


def meta_content(html: str, name: str) -> str:
    match = re.search(
        rf'<meta[^>]+name=["\']{re.escape(name)}["\'][^>]+content=["\'](.*?)["\']',
        html,
        flags=re.I | re.S,
    )
    return clean_html(match.group(1), MISSING) if match else MISSING


def extract_cover(html: str, url_prefix: str, course_id: str = "") -> str:
    image_patterns = [
        rf'<img[^>]+src=["\']([^"\']+)["\'][^>]+(?:alt=["\'][^"\']*{re.escape(course_id)}[^"\']*["\'])',
        rf'<img[^>]+src=["\']([^"\']*{url_prefix}[^"\']*)["\']',
        r'<div class="open_class[\s\S]*?<img[^>]+src=["\']([^"\']+)["\']',
    ]
    for pattern in image_patterns:
        match = re.search(pattern, html, flags=re.I | re.S)
        if match:
            return absolute_url(match.group(1))
    return ""


def extract_breadcrumb_category(html: str, fallback: str = MISSING) -> str:
    match = re.search(r'<div[^>]+class=["\']location[^"\']*["\'][^>]*>([\s\S]*?)</div>', html, flags=re.I)
    if not match:
        return fallback
    text = clean_html(match.group(1))
    parts = [part.strip() for part in re.split(r">|当前位置：|首页", text) if part.strip()]
    ignored = {"公开课", "内训课", "企业内训", "线上网课"}
    if len(parts) >= 2 and parts[-1] not in ignored:
        parts = parts[:-1]
    for part in reversed(parts):
        if part not in ignored and len(part) <= 30:
            return part
    return fallback


def extract_title(html: str, fallback: str = MISSING) -> str:
    for pattern in (
        r'<div[^>]+class=["\']title_bg["\'][^>]*>\s*<h1[^>]*>([\s\S]*?)</h1>',
        r'<h1[^>]*>([\s\S]*?)</h1>',
        r'<title[^>]*>([\s\S]*?)</title>',
    ):
        match = re.search(pattern, html, flags=re.I | re.S)
        if match:
            title = clean_html(match.group(1))
            return re.sub(r"_[^-]+-企赢培训学院$", "", title) or fallback
    return fallback


def extract_detail_text(html: str) -> str:
    match = re.search(r'<div[^>]+class=["\']courses_dt[^"\']*["\'][^>]*>([\s\S]*?)(?:<div[^>]+class=["\']right|<div[^>]+class=["\']footer|</body>)', html, flags=re.I)
    if match:
        return clean_html(match.group(1))
    match = re.search(r'<div[^>]+class=["\']content[^"\']*["\'][^>]*>([\s\S]*?)(?:<div[^>]+class=["\']right|<div[^>]+class=["\']footer|</body>)', html, flags=re.I)
    return clean_html(match.group(1)) if match else clean_html(html)


SECTION_STOPS = (
    "课程背景",
    "课程收益",
    "课程收获",
    "课程目标",
    "课程特色",
    "课程对象",
    "适合人员",
    "适合对象",
    "培训对象",
    "授课时间",
    "人数要求",
    "课程时间",
    "培训时间",
    "课程大纲",
    "培训内容",
    "授课方式",
    "培训费用",
    "课程简介",
    "授课老师",
    "沙盘介绍",
    "阅读更多",
    "相关推荐",
    "相关视频",
)


def extract_after_labels(text: str, labels: Iterable[str], limit: int = 1500) -> str:
    positions: list[tuple[int, str]] = []
    for label in labels:
        for match in re.finditer(re.escape(label), text):
            positions.append((match.start(), label))
    if not positions:
        return MISSING
    start, label = min(positions, key=lambda item: item[0])
    segment = text[start + len(label):].lstrip(" ：:【】[]、-")
    stops: list[int] = []
    for stop in SECTION_STOPS:
        if stop in labels:
            continue
        pos = segment.find(stop)
        if pos > 0:
            stops.append(pos)
    if stops:
        segment = segment[: min(stops)]
    return segment.strip(" ：:【】[]、-")[:limit] or MISSING


def extract_intro(text: str, fallback: str = MISSING) -> str:
    intro = extract_after_labels(text, ("课程背景", "课程介绍", "课程简介"), 900)
    if intro != MISSING:
        return intro
    return fallback if fallback != MISSING else text[:500]


def extract_learning_outcomes(text: str) -> str:
    return extract_after_labels(text, ("课程收益", "课程收获", "课程目标", "培训收益", "培训目标"), 1600)


def extract_audience(text: str) -> str:
    return extract_after_labels(text, ("课程对象", "适合人员", "适合对象", "培训对象", "参训对象", "授课对象"), 700)


def extract_highlights(text: str) -> str:
    return extract_after_labels(text, ("课程特色", "课程亮点", "授课方式"), 900)


def extract_syllabus(text: str) -> str:
    syllabus = extract_after_labels(text, ("课程大纲", "培训内容", "课程内容"), 5000)
    return syllabus if syllabus != MISSING else text[:5000]


def parse_date_range(value: str) -> tuple[str, str]:
    text = clean_html(value)
    match = re.search(r"(\d{4})-(\d{1,2})-(\d{1,2})\s*至\s*(\d{4})-(\d{1,2})-(\d{1,2})", text)
    if match:
        y1, m1, d1, y2, m2, d2 = match.groups()
        return f"{int(y1):04d}-{int(m1):02d}-{int(d1):02d}", f"{int(y2):04d}-{int(m2):02d}-{int(d2):02d}"
    match = re.search(r"(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})\s*[-至]\s*(\d{1,2})日", text)
    if match:
        y, m, d1, d2 = match.groups()
        return f"{int(y):04d}-{int(m):02d}-{int(d1):02d}", f"{int(y):04d}-{int(m):02d}-{int(d2):02d}"
    match = re.search(r"(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日", text)
    if match:
        y, m, d = match.groups()
        return f"{int(y):04d}-{int(m):02d}-{int(d):02d}", f"{int(y):04d}-{int(m):02d}-{int(d):02d}"
    return "", ""


def parse_duration_days(*values: str) -> int:
    text = " ".join(clean_html(value) for value in values if value)
    for value in values:
        start, end = parse_date_range(clean_html(value))
        if start and end:
            try:
                start_dt = datetime.strptime(start, "%Y-%m-%d").date()
                end_dt = datetime.strptime(end, "%Y-%m-%d").date()
                return max(1, (end_dt - start_dt).days + 1)
            except ValueError:
                continue
    match = re.search(r"(\d+(?:\.\d+)?)\s*天", text)
    if match:
        return max(1, int(float(match.group(1))))
    return 0


def parse_total_hours(text: str, duration_days: int) -> float:
    match = re.search(r"(?:共|合计)\s*(\d+(?:\.\d+)?)\s*(?:个)?小时", text)
    if match:
        return float(match.group(1))
    match = re.search(r"(?:每天|每日)?\s*(\d+(?:\.\d+)?)\s*小时\s*/\s*天", text)
    if not match:
        match = re.search(r"(?:每天|每日)\s*(\d+(?:\.\d+)?)\s*(?:个)?小时", text)
    if match and duration_days:
        return round(float(match.group(1)) * duration_days, 1)
    match = re.search(r"(\d+(?:\.\d+)?)\s*小时", text)
    if match:
        return float(match.group(1))
    return float(duration_days * 6) if duration_days else 0


def build_open_plan(list_item: dict[str, str], detail_text: str = "") -> dict[str, Any]:
    date_text = list_item.get("date_text", "")
    start_date, end_date = parse_date_range(date_text or detail_text)
    city = list_item.get("city", "")
    plan = {
        "startDate": start_date,
        "start_date": start_date,
        "endDate": end_date,
        "end_date": end_date,
        "city": city,
        "location": city,
        "address": city,
        "sourceDateText": date_text,
        "sourceLocationText": city,
        "signupUrl": list_item.get("url", ""),
    }
    return {key: value for key, value in plan.items() if value not in {"", None}}


def parse_open_list_rows(html: str) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    seen: set[str] = set()
    for row_html in re.findall(r"<tr[^>]*>([\s\S]*?)</tr>", html, flags=re.I):
        cells = re.findall(r"<td[^>]*>([\s\S]*?)</td>", row_html, flags=re.I)
        if len(cells) < 6:
            continue
        link_match = re.search(r'<a[^>]+href=["\']([^"\']*/gongkaike/\d+\.html)["\'][^>]*>([\s\S]*?)</a>', cells[0], flags=re.I)
        if not link_match:
            continue
        url = absolute_url(link_match.group(1))
        if url in seen:
            continue
        seen.add(url)
        category_match = re.findall(r'<a[^>]+href=["\']([^"\']*/gongkaike/[^"\']+/)["\'][^>]*>([\s\S]*?)</a>', cells[1], flags=re.I)
        teacher_match = re.search(r'<a[^>]+href=["\']([^"\']*/teacher/\d+\.html)["\'][^>]*>([\s\S]*?)</a>', cells[4], flags=re.I)
        rows.append(
            {
                "url": url,
                "source_course_id": source_id_from_url(url),
                "title": clean_html(link_match.group(2), MISSING),
                "category_name_raw": clean_html(category_match[-1][1], MISSING) if category_match else MISSING,
                "date_text": clean_html(cells[2]),
                "city": clean_html(cells[3]),
                "trainer_name_raw": clean_html(teacher_match.group(2), MISSING) if teacher_match else clean_html(cells[4], MISSING),
                "price_raw": clean_html(cells[5]),
                "source_entry": "open_offline_table",
            }
        )
    return rows


def parse_internal_cards(html: str) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    seen: set[str] = set()
    start = html.find("热门内训课")
    segment = html[start:] if start >= 0 else html
    stop = segment.find("全部内训")
    if stop > 0:
        segment = segment[:stop]
    for card in re.findall(r"<li>\s*<a[^>]+href=[\"'][^\"']*/neixunke/\d+\.html[\"'][\s\S]*?</li>", segment, flags=re.I):
        link_match = re.search(r'<a[^>]+href=["\']([^"\']*/neixunke/\d+\.html)["\']', card, flags=re.I)
        if not link_match:
            continue
        url = absolute_url(link_match.group(1))
        if url in seen:
            continue
        seen.add(url)
        img_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\'][^>]*(?:alt=["\']([^"\']*)["\'])?', card, flags=re.I | re.S)
        title_match = re.search(r"<em[^>]*>([\s\S]*?)</em>", card, flags=re.I)
        title = clean_html(title_match.group(1), MISSING) if title_match else ""
        if img_match and clean_html(img_match.group(2) if img_match.lastindex and img_match.lastindex >= 2 else ""):
            title = title if title != MISSING else clean_html(img_match.group(2), MISSING)
        items.append(
            {
                "url": url,
                "source_course_id": source_id_from_url(url),
                "title": title or MISSING,
                "cover_url": absolute_url(img_match.group(1)) if img_match else "",
                "source_entry": "internal_card",
            }
        )
    return items


def parse_teacher(html: str, detail_text: str = "") -> str:
    for pattern in (
        r"授课老师[\s\S]{0,500}?<a[^>]*>\s*([\u4e00-\u9fa5A-Za-z0-9·]{2,20})\s*</a>",
        r"授课老师\s*</[^>]+>\s*<[^>]+>\s*<a[^>]*>([\s\S]*?)</a>",
        r"授课老师\s*[:：]?\s*([\u4e00-\u9fa5A-Za-z0-9·]{2,20})",
        r"课程讲师\s*[:：]\s*([\u4e00-\u9fa5A-Za-z0-9·]{2,20})",
        r"主讲老师\s*[:：]\s*([\u4e00-\u9fa5A-Za-z0-9·]{2,20})",
    ):
        match = re.search(pattern, html if "a[^>]" in pattern else detail_text, flags=re.I | re.S)
        if match:
            return clean_html(match.group(1), MISSING)
    return MISSING


def parse_open_detail_html(item: dict[str, str], html: str) -> Dict[str, Any]:
    detail_text = extract_detail_text(html)
    title = extract_title(html, item.get("title", MISSING))
    category = item.get("category_name_raw") or extract_breadcrumb_category(html, MISSING)
    duration_days = parse_duration_days(item.get("date_text", ""), detail_text)
    total_hours = parse_total_hours(detail_text, duration_days)
    plan = build_open_plan(item, detail_text)
    summary = meta_content(html, "description")
    intro = extract_intro(detail_text, summary)
    record: Dict[str, Any] = {
        "source_course_id": item.get("source_course_id") or source_id_from_url(item["url"]),
        "source_url": item["url"],
        "title": title,
        "type": "OPEN_OFFLINE",
        "category_name_raw": category,
        "cover_url": item.get("cover_url") or extract_cover(html, "/Uploads/gkk/", item.get("source_course_id", "")),
        "intro": intro,
        "summary": (summary if summary != MISSING else intro)[:500],
        "syllabus": extract_syllabus(detail_text),
        "audience": extract_audience(detail_text),
        "target_audience": "",
        "learning_outcomes": extract_learning_outcomes(detail_text),
        "highlights": extract_highlights(detail_text),
        "duration_days": duration_days,
        "total_hours": total_hours,
        "original_price": 0,
        "keywords": " ".join(part for part in [category, "公开课", item.get("city", "")] if part and part != MISSING),
        "trainer_name_raw": item.get("trainer_name_raw") or parse_teacher(html, detail_text),
        "plans_json": [plan] if plan.get("startDate") or plan.get("city") else [],
        "services_json": [],
        "raw_json": {
            "source_entry": "open_offline_table",
            "source_entry_name": "公开课",
            "source_date_text": item.get("date_text", ""),
            "source_city_text": item.get("city", ""),
            "content_type": detect_content_type(detail_text, title),
            "type_evidence": "qiyingschool_gongkaike_table_has_date_city_price",
            "category_evidence": "list table category column or breadcrumb",
            "plan_evidence": f"{item.get('date_text', '')} {item.get('city', '')}".strip(),
            "field_sources": {
                "plans_json": "公开课列表表格的上课时间/上课地点",
                "price": "公开课列表表格价格列",
                "trainer_name_raw": "公开课列表讲师列或详情页授课老师",
                "learning_outcomes": "详情页课程收益/课程目标",
                "audience": "详情页适合人员/课程对象",
                "syllabus": "详情页课程大纲/培训内容",
            },
            "coverage_notes": [
                "OPEN_OFFLINE 已覆盖：公开课列表提供课程名称、类别、上课时间、上课地点、授课讲师和价格。",
                "OPEN_ONLINE 未覆盖：源站线上入口为 video/线上网课，详情含共N集、选集等录播/视频课属性，当前不进入 courses 流程。",
                "INTERNAL 已覆盖：企业内训列表和详情页可提取课程对象、收益、时间、讲师和大纲。",
            ],
            "diagnostics": [],
        },
    }
    set_price_fields(record, item.get("price_raw") or MISSING)
    if plan.get("address") and plan.get("address") == item.get("city"):
        append_diagnostic(record, "plans_json.address", "source_only_provides_city_no_street_address", item.get("city", ""))
    if not plan.get("startDate"):
        append_diagnostic(record, "plans_json.startDate", "source_schedule_date_missing_or_unparsed", item.get("date_text", ""))
    enrich_course_record(record, fallback_type="OPEN_OFFLINE")
    record["type"] = "OPEN_OFFLINE"
    record["raw_json"]["type_evidence"] = "qiyingschool_gongkaike_table_has_date_city_price"
    record["raw_json"]["content_type"] = "COURSE"
    return record


def parse_internal_detail_html(item: dict[str, str], html: str) -> Dict[str, Any]:
    detail_text = extract_detail_text(html)
    title = extract_title(html, item.get("title", MISSING))
    category = extract_breadcrumb_category(html, item.get("category_name_raw", "企业内训"))
    duration_days = parse_duration_days(detail_text)
    total_hours = parse_total_hours(detail_text, duration_days)
    summary = meta_content(html, "description")
    intro = extract_intro(detail_text, summary)
    record: Dict[str, Any] = {
        "source_course_id": item.get("source_course_id") or source_id_from_url(item["url"]),
        "source_url": item["url"],
        "title": title,
        "type": "INTERNAL",
        "category_name_raw": category,
        "cover_url": item.get("cover_url") or extract_cover(html, "/Uploads/nxk/", item.get("source_course_id", "")),
        "intro": intro,
        "summary": (summary if summary != MISSING else intro)[:500],
        "syllabus": extract_syllabus(detail_text),
        "audience": extract_audience(detail_text),
        "target_audience": "",
        "learning_outcomes": extract_learning_outcomes(detail_text),
        "highlights": extract_highlights(detail_text),
        "duration_days": duration_days,
        "total_hours": total_hours,
        "original_price": 0,
        "keywords": " ".join(part for part in [category, "企业内训"] if part and part != MISSING),
        "trainer_name_raw": parse_teacher(html, detail_text),
        "plans_json": [],
        "services_json": [],
        "raw_json": {
            "source_entry": "internal_card",
            "source_entry_name": "企业内训",
            "price_raw": "内训咨询",
            "content_type": detect_content_type(detail_text, title),
            "type_evidence": "qiyingschool_neixunke_entry_internal",
            "category_evidence": "breadcrumb",
            "plan_evidence": "内训课无公开固定排期，按企业需求咨询交付",
            "field_sources": {
                "price": "内训详情未公开固定价格，标记为咨询/面议",
                "trainer_name_raw": "详情页授课老师",
                "duration_days": "详情页课程时间",
                "learning_outcomes": "详情页课程收益/课程目标",
                "audience": "详情页课程对象",
                "syllabus": "详情页课程大纲",
            },
            "coverage_notes": [
                "OPEN_OFFLINE 已覆盖：公开课列表提供课程名称、类别、上课时间、上课地点、授课讲师和价格。",
                "OPEN_ONLINE 未覆盖：源站线上入口为 video/线上网课，详情含共N集、选集等录播/视频课属性，当前不进入 courses 流程。",
                "INTERNAL 已覆盖：企业内训列表和详情页可提取课程对象、收益、时间、讲师和大纲。",
            ],
            "diagnostics": [],
        },
    }
    set_price_fields(record, "内训咨询")
    append_diagnostic(record, "plans_json", "internal_course_has_no_public_schedule")
    enrich_course_record(record, fallback_type="INTERNAL")
    record["type"] = "INTERNAL"
    record["raw_json"]["type_evidence"] = "qiyingschool_neixunke_entry_internal"
    record["raw_json"]["content_type"] = "COURSE"
    return record


def parse_video_entry(html: str, url: str) -> Dict[str, Any]:
    detail_text = extract_detail_text(html)
    title = extract_title(html, MISSING)
    return {
        "source_course_id": source_id_from_url(url),
        "source_url": url,
        "title": title,
        "reason": "recorded_video_entry_not_imported_to_courses",
        "content_type": "RECORDED_VIDEO",
        "evidence": "线上网课详情含课程价格、共N集、选集等视频课属性",
        "raw_text_sample": detail_text[:500],
    }


def discover_open_items(limit: int) -> list[dict[str, str]]:
    html = fetch_text(OPEN_LIST_URL)
    return parse_open_list_rows(html)[:limit]


def discover_internal_items(limit: int) -> list[dict[str, str]]:
    html = fetch_text(INTERNAL_LIST_URL)
    return parse_internal_cards(html)[:limit]


def parse_open_detail(item: dict[str, str]) -> Dict[str, Any]:
    return parse_open_detail_html(item, fetch_text(item["url"]))


def parse_internal_detail(item: dict[str, str]) -> Dict[str, Any]:
    return parse_internal_detail_html(item, fetch_text(item["url"]))


def iter_qiyingschool_courses(max_items: int | None = None):
    limit = max_items or 100
    open_quota = max(1, (limit + 1) // 2)
    internal_quota = max(1, limit - open_quota)
    candidates = discover_open_items(open_quota) + discover_internal_items(internal_quota)
    seen: set[str] = set()
    for item in candidates[:limit]:
        key = item["url"]
        if key in seen:
            continue
        seen.add(key)
        try:
            if item.get("source_entry") == "internal_card":
                record = parse_internal_detail(item)
            else:
                record = parse_open_detail(item)
            if record.get("raw_json", {}).get("content_type") in {"RECORDED_VIDEO", "DOCUMENT", "AUDIO"}:
                continue
            yield record
        except Exception as exc:
            logger.warning("qiyingschool course detail failed, skip url=%s error=%s", item.get("url"), exc)
        time.sleep(0.1)


def crawl_qiyingschool_courses(max_items: int | None = None) -> List[Dict[str, Any]]:
    return list(iter_qiyingschool_courses(max_items))


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class QiyingSchoolCourseSpider:
    """企赢培训学院课程爬虫适配器，供 JobManager 调用。"""

    name = "qiyingschool_course"
    source = "qiyingschool"
    data_type = "COURSE"
    max_items = None
    supported_course_types = ("OPEN_OFFLINE", "INTERNAL")
    coverage_note = (
        "公开课列表可抓取 OPEN_OFFLINE；企业内训可抓取 INTERNAL；"
        "线上网课属于 video/录播体系，当前不输出为 OPEN_ONLINE。"
    )

    def pause(self) -> None:
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_qiyingschool_courses(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
