"""复锐咨询课程爬虫适配器。"""
import asyncio
import calendar
import logging
import re
import ssl
import time
import urllib.request
from datetime import datetime
from html import unescape
from typing import Any, AsyncGenerator, Dict, Iterable, List
from urllib.parse import parse_qs, urljoin, urlparse

from crawlers.course_utils import append_diagnostic, detect_content_type, enrich_course_record, set_price_fields


BASE_URL = "https://www.free863.com"
OPEN_LIST_URL = f"{BASE_URL}/list.php?pid=1&ty=129"
ONLINE_LIST_URL = f"{BASE_URL}/list.php?pid=1&ty=129&zhuan=223"
INTERNAL_LIST_URL = f"{BASE_URL}/list.php?pid=2&ty=13"
INTERNAL_COURSE_LIST_URL = f"{BASE_URL}/list.php?pid=2&ty=16&gang=&gang2=&year=&zhuan=141&zhuan2=0&day=&city="
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
MISSING = "暂无"
CURRENT_COURSE_YEAR = 2026
logger = logging.getLogger(__name__)

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE


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
    text = re.sub(r"</p\s*>", "\n", text, flags=re.I)
    text = re.sub(r"</div\s*>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text).replace("&nbsp;", " ")
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\n\s+", "\n", text)
    text = " ".join(text.split())
    return text or default


def absolute_url(value: str) -> str:
    return urljoin(BASE_URL + "/", value or "")


def source_id_from_url(url: str) -> str:
    query = parse_qs(urlparse(url).query)
    if query.get("id"):
        return query["id"][0]
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
        r'<div[^>]+class=["\'][^"\']*tit[^"\']*["\'][^>]*>([\s\S]*?)</div>',
        r'<title[^>]*>([\s\S]*?)</title>',
    ):
        match = re.search(pattern, html, flags=re.I | re.S)
        if not match:
            continue
        title = clean_html(match.group(1))
        title = re.sub(r"^复锐咨询[_-]?", "", title).strip()
        if title and len(title) <= 120:
            return title
    return fallback


def extract_detail_text(html: str) -> str:
    text = clean_html(html)
    anchors = ["开课时间：", "背景与目标", "课程背景：", "课程收益：", "课程大纲："]
    positions = [text.find(anchor) for anchor in anchors if text.find(anchor) >= 0]
    if positions:
        text = text[min(positions):]
    for stop in ("在线报名", "相关课程", "热门课程", "版权所有", "CopyRight"):
        pos = text.find(stop)
        if pos > 600:
            text = text[:pos]
    return text


def extract_meta_field(text: str, label: str, stops: Iterable[str]) -> str:
    pos = text.find(label)
    if pos < 0:
        return MISSING
    segment = text[pos + len(label):]
    stop_positions = [segment.find(stop) for stop in stops if segment.find(stop) > 0]
    if stop_positions:
        segment = segment[: min(stop_positions)]
    return segment.strip(" ：:")[:1200] or MISSING


def present(value: Any) -> bool:
    return clean_html(value) not in {"", MISSING, "暂无"}


SECTION_STOPS = (
    "课程背景：",
    "背景与目标",
    "课程目标：",
    "培训目标：",
    "课程收益：",
    "课程特色：",
    "课程方式",
    "课程特点",
    "适合人员概述",
    "适合对象",
    "授课形式",
    "主要内容",
    "课程大纲：",
    "内训说明",
    "开课计划",
    "第一部分",
    "第一讲",
)


def extract_after_labels(text: str, labels: Iterable[str], limit: int = 1800) -> str:
    positions: list[tuple[int, str]] = []
    for label in labels:
        for match in re.finditer(re.escape(label), text):
            positions.append((match.start(), label))
    if not positions:
        return MISSING
    start, label = min(positions, key=lambda item: item[0])
    segment = text[start + len(label):].lstrip(" ：:【】")
    stops: list[int] = []
    for stop in SECTION_STOPS:
        if stop in labels:
            continue
        pos = segment.find(stop)
        if pos > 0:
            stops.append(pos)
    if stops:
        segment = segment[: min(stops)]
    return segment.strip(" ：:【】")[:limit] or MISSING


def extract_intro(text: str, fallback: str = MISSING) -> str:
    intro = extract_after_labels(text, ("课程背景：", "背景与目标"), 1200)
    if intro != MISSING:
        return intro
    return fallback if fallback != MISSING else text[:600]


def extract_learning_outcomes(text: str) -> str:
    return extract_after_labels(text, ("课程收益：", "课程目标：", "培训目标：", "课程收益", "课程目标"), 1800)


def extract_audience(text: str) -> str:
    return extract_after_labels(text, ("适合人员概述", "适合对象", "参加对象", "培训对象", "课程对象"), 900)


def extract_highlights(text: str) -> str:
    return extract_after_labels(text, ("课程特色：", "课程特点", "授课形式：", "授课形式"), 1200)


def extract_syllabus(text: str) -> str:
    syllabus = extract_after_labels(text, ("课程大纲：", "课程大纲", "主要内容"), 5000)
    return syllabus if syllabus != MISSING else text[:5000]


def parse_duration_days(*values: Any) -> int:
    text = " ".join(clean_html(value) for value in values if value)
    match = re.search(r"(?:天数|课程天数)[：:\s]*(\d+(?:\.\d+)?)", text)
    if not match:
        match = re.search(r"^(\d+(?:\.\d+)?)$", text.strip())
    if match:
        return max(1, int(float(match.group(1))))
    return 0


def parse_total_hours(text: str, duration_days: int) -> float:
    match = re.search(r"课程时长[：:\s]*(\d+(?:\.\d+)?)", text)
    if match:
        return float(match.group(1))
    match = re.search(r"(\d+(?:\.\d+)?)\s*(?:H|h|小时)", text)
    if match:
        return float(match.group(1))
    return float(duration_days * 6) if duration_days else 0


def parse_date_token(token: str, month: int, year: int = CURRENT_COURSE_YEAR) -> tuple[str, str]:
    match = re.search(r"(\d{1,2})(?:\s*[-~至]\s*(\d{1,2}))?", token)
    if not match:
        return "", ""
    start_day = int(match.group(1))
    end_day = int(match.group(2) or match.group(1))
    last_day = calendar.monthrange(year, month)[1]
    if not (1 <= start_day <= last_day and 1 <= end_day <= last_day):
        return "", ""
    return f"{year:04d}-{month:02d}-{start_day:02d}", f"{year:04d}-{month:02d}-{end_day:02d}"


def is_online_location(value: str) -> bool:
    return any(word in clean_html(value) for word in ("直播", "线上", "在线", "同步直播", "网课"))


def parse_schedule_cell(cell_html: str, month: int, source_url: str, course_type: str) -> list[dict[str, Any]]:
    text = re.sub(r"<br\s*/?>", "\n", cell_html, flags=re.I)
    tokens = [clean_html(token) for token in re.split(r"\n+", text) if clean_html(token)]
    plans: list[dict[str, Any]] = []
    index = 0
    while index < len(tokens):
        date_text = tokens[index]
        location = tokens[index + 1] if index + 1 < len(tokens) else ""
        index += 2
        start_date, end_date = parse_date_token(date_text, month)
        online = is_online_location(location)
        if course_type == "OPEN_ONLINE" and not online:
            continue
        if course_type == "OPEN_OFFLINE" and online:
            continue
        plan = {
            "startDate": start_date,
            "start_date": start_date,
            "endDate": end_date,
            "end_date": end_date,
            "sourceDateText": f"{month}月{date_text}",
            "sourceLocationText": location,
            "signupUrl": source_url,
        }
        if online:
            plan.update({"location": location or "线上", "onlineUrl": source_url, "type": "ONLINE"})
        else:
            plan.update({"city": location, "location": location, "address": location, "type": "OFFLINE"})
        plans.append({key: value for key, value in plan.items() if value not in {"", None}})
    return plans


def parse_open_list_rows(html: str, *, course_type: str = "OPEN_OFFLINE", category_hint: str = MISSING) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    for row_html in re.findall(r"<tr[^>]*>([\s\S]*?)</tr>", html, flags=re.I):
        cells = re.findall(r"<td[^>]*>([\s\S]*?)</td>", row_html, flags=re.I)
        if len(cells) < 16:
            continue
        link_match = re.search(r'<a[^>]+href=["\']([^"\']*class\.php\?id=\d+[^"\']*)["\'][^>]*>([\s\S]*?)</a>', cells[0], flags=re.I)
        if not link_match:
            continue
        url = absolute_url(link_match.group(1).replace("&amp;", "&"))
        plans: list[dict[str, Any]] = []
        for month, cell in enumerate(cells[4:16], start=1):
            plans.extend(parse_schedule_cell(cell, month, url, course_type))
        if not plans:
            continue
        source_id = source_id_from_url(url)
        if course_type == "OPEN_ONLINE":
            source_id = f"{source_id}_online"
        key = f"{source_id}:{course_type}"
        if key in seen:
            continue
        seen.add(key)
        rows.append(
            {
                "url": url,
                "source_course_id": source_id,
                "title": clean_html(link_match.group(2), MISSING),
                "category_name_raw": category_hint,
                "duration_days": clean_html(cells[1]),
                "price_raw": clean_html(cells[2]),
                "trainer_name_raw": clean_html(cells[3], MISSING),
                "plans_json": plans,
                "type": course_type,
                "source_entry": "open_course_schedule_table",
            }
        )
    return rows


def parse_internal_list_rows(html: str, *, limit: int | None = None) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    for row_html in re.findall(r"<tr[^>]*>([\s\S]*?)</tr>", html, flags=re.I):
        cells = re.findall(r"<td[^>]*>([\s\S]*?)</td>", row_html, flags=re.I)
        if len(cells) < 7:
            continue
        link_match = re.search(r'<a[^>]+href=["\']([^"\']*class\.php\?id=\d+[^"\']*)["\'][^>]*>([\s\S]*?)</a>', cells[0], flags=re.I)
        if not link_match:
            continue
        url = absolute_url(link_match.group(1).replace("&amp;", "&"))
        if url in seen:
            continue
        seen.add(url)
        rows.append(
            {
                "url": url,
                "source_course_id": source_id_from_url(url),
                "title": clean_html(link_match.group(2), MISSING),
                "category_name_raw": clean_html(cells[1], MISSING).split("、")[0],
                "position_category_raw": clean_html(cells[2], ""),
                "trainer_name_raw": clean_html(cells[3], MISSING),
                "duration_days": clean_html(cells[4]),
                "learning_outcomes_hint": clean_html(cells[5], MISSING),
                "internal_note": clean_html(cells[6], ""),
                "type": "INTERNAL",
                "source_entry": "internal_course_table",
            }
        )
        if limit and len(rows) >= limit:
            break
    return rows


def parse_detail_common(item: dict[str, Any], html: str, course_type: str) -> Dict[str, Any]:
    detail_text = extract_detail_text(html)
    summary = meta_content(html, "description")
    title = item.get("title") or extract_title(html, MISSING)
    detail_category = extract_meta_field(
        detail_text,
        "专业分类：",
        ("行业分类：", "岗位分类：", "关键字："),
    )
    category = item.get("category_name_raw") if present(item.get("category_name_raw")) else detail_category
    duration_days = parse_duration_days(item.get("duration_days", ""), detail_text)
    total_hours = parse_total_hours(detail_text, duration_days)
    intro = extract_intro(detail_text, summary)
    learning_outcomes = extract_learning_outcomes(detail_text)
    if learning_outcomes == MISSING and item.get("learning_outcomes_hint"):
        learning_outcomes = item["learning_outcomes_hint"]
    record: Dict[str, Any] = {
        "source_course_id": item.get("source_course_id") or source_id_from_url(item["url"]),
        "source_url": item["url"],
        "title": title,
        "type": course_type,
        "category_name_raw": category,
        "cover_url": "",
        "intro": intro,
        "summary": (summary if summary != MISSING else intro)[:500],
        "syllabus": extract_syllabus(detail_text),
        "audience": extract_audience(detail_text),
        "target_audience": "",
        "learning_outcomes": learning_outcomes,
        "highlights": extract_highlights(detail_text),
        "duration_days": duration_days,
        "total_hours": total_hours,
        "original_price": 0,
        "keywords": extract_meta_field(detail_text, "关键字：", ("内训说明：", "分享至：", "开课计划")),
        "trainer_name_raw": item.get("trainer_name_raw") or extract_meta_field(detail_text, "授课讲师：", ("课程价格：", "天数：")),
        "plans_json": item.get("plans_json", []) if course_type != "INTERNAL" else [],
        "services_json": [],
        "raw_json": {
            "source_entry": item.get("source_entry", ""),
            "source_entry_name": "年度公开课" if course_type != "INTERNAL" else "企业内训课程",
            "content_type": "COURSE" if course_type in {"OPEN_OFFLINE", "OPEN_ONLINE", "INTERNAL"} else detect_content_type(detail_text, title),
            "type_evidence": "free863_public_schedule_table" if course_type != "INTERNAL" else "free863_internal_course_table",
            "category_evidence": "list table category or detail professional category",
            "field_sources": {
                "plans_json": "年度公开课表格月份列" if course_type != "INTERNAL" else "内训课无公开固定排期",
                "price": "公开课表格价格列" if course_type != "INTERNAL" else "内训课按咨询/面议处理",
                "trainer_name_raw": "列表讲师列或详情授课讲师",
                "learning_outcomes": "详情课程收益/课程目标或内训列表课程目标",
                "audience": "详情适合人员概述/适合对象",
                "syllabus": "详情课程大纲/主要内容",
            },
            "coverage_notes": [
                "OPEN_OFFLINE 已覆盖：年度公开课表格提供课程名、天数、价格、讲师和城市排期。",
                "OPEN_ONLINE 已按直播/线上/同步直播排期覆盖；不将管理文库、资讯或无法确认的录播视频导入 courses。",
                "INTERNAL 已覆盖：企业内训课程表提供课程名、专业分类、岗位分类、讲师、天数和目标，详情补充收益、大纲等字段。",
            ],
            "diagnostics": [],
        },
    }
    set_price_fields(record, item.get("price_raw") if course_type != "INTERNAL" else "内训咨询")
    if course_type == "INTERNAL":
        append_diagnostic(record, "plans_json", "internal_course_has_no_public_schedule")
    else:
        for plan in record["plans_json"]:
            if course_type == "OPEN_OFFLINE" and plan.get("address") == plan.get("city"):
                append_diagnostic(record, "plans_json.address", "source_only_provides_city_no_street_address", plan.get("city", ""))
            if not plan.get("startDate"):
                append_diagnostic(record, "plans_json.startDate", "source_schedule_date_missing_or_unparsed", plan.get("sourceDateText", ""))
    enrich_course_record(record, fallback_type=course_type)
    record["type"] = course_type
    record["raw_json"]["type_evidence"] = "free863_public_schedule_table" if course_type != "INTERNAL" else "free863_internal_course_table"
    record["raw_json"]["content_type"] = "COURSE"
    return record


def parse_open_detail_html(item: dict[str, Any], html: str) -> Dict[str, Any]:
    return parse_detail_common(item, html, item.get("type", "OPEN_OFFLINE"))


def parse_internal_detail_html(item: dict[str, Any], html: str) -> Dict[str, Any]:
    return parse_detail_common(item, html, "INTERNAL")


def discover_open_items(limit: int) -> list[dict[str, Any]]:
    html = fetch_text(OPEN_LIST_URL)
    items = parse_open_list_rows(html, course_type="OPEN_OFFLINE")
    return items[:limit]


def discover_online_items(limit: int) -> list[dict[str, Any]]:
    html = fetch_text(ONLINE_LIST_URL)
    items = parse_open_list_rows(html, course_type="OPEN_ONLINE", category_hint="线上课程")
    return items[:limit]


def discover_internal_items(limit: int) -> list[dict[str, Any]]:
    items = parse_internal_list_rows(fetch_text(INTERNAL_LIST_URL), limit=limit)
    if len(items) < limit:
        seen = {item["url"] for item in items}
        for item in parse_internal_list_rows(fetch_text(INTERNAL_COURSE_LIST_URL), limit=limit):
            if item["url"] in seen:
                continue
            seen.add(item["url"])
            items.append(item)
            if len(items) >= limit:
                break
    return items[:limit]


def iter_free863_courses(max_items: int | None = None):
    limit = max_items or 100
    open_quota = max(1, limit // 3)
    online_quota = max(1, limit // 3)
    internal_quota = max(1, limit - open_quota - online_quota)
    candidates = (
        discover_open_items(open_quota)
        + discover_online_items(online_quota)
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
            record = parse_internal_detail_html(item, html) if item.get("type") == "INTERNAL" else parse_open_detail_html(item, html)
            if record.get("raw_json", {}).get("content_type") in {"RECORDED_VIDEO", "DOCUMENT", "AUDIO", "ARTICLE"}:
                continue
            yield record
        except Exception as exc:
            logger.warning("free863 course detail failed, skip url=%s error=%s", item.get("url"), exc)
        time.sleep(0.1)


def crawl_free863_courses(max_items: int | None = None) -> List[Dict[str, Any]]:
    return list(iter_free863_courses(max_items))


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class Free863CourseSpider:
    """复锐咨询课程爬虫适配器，供 JobManager 调用。"""

    name = "free863_course"
    source = "free863"
    data_type = "COURSE"
    max_items = None
    supported_course_types = ("OPEN_OFFLINE", "OPEN_ONLINE", "INTERNAL")
    coverage_note = (
        "年度公开课表格覆盖 OPEN_OFFLINE；线上课程分类中带直播/线上/同步直播排期的记录覆盖 OPEN_ONLINE；"
        "企业内训课程表覆盖 INTERNAL，内训不伪造公开排期。"
    )

    def pause(self) -> None:
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_free863_courses(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
