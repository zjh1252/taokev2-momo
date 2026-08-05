"""中培网课程爬虫适配器。"""
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
from crawlers.rich_content import apply_syllabus_rich_content


BASE_URL = "https://www.chinacpx.com"
OPEN_LIST_URL = f"{BASE_URL}/opencourse/"
INTERNAL_LIST_URL = f"{BASE_URL}/inhousecourse/"
ONLINE_LIST_URL = f"{BASE_URL}/onlinecourse/"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
MISSING = "暂无"
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
    match = re.search(r"/(?:opencourse|inhousecourse|onlinecourse)/(\d+)\.shtm", url)
    return match.group(1) if match else url.rstrip("/").rsplit("/", 1)[-1]


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
        r'<div[^>]+class=["\'][^"\']*title[^"\']*["\'][^>]*>([\s\S]*?)</div>',
        r'<title[^>]*>([\s\S]*?)</title>',
    ):
        match = re.search(pattern, html, flags=re.I | re.S)
        if not match:
            continue
        title = clean_html(match.group(1))
        title = re.sub(r"[-_](公开课|企业内训|在线课程).*$", "", title).strip()
        if title and len(title) <= 160:
            return title
    return fallback


def extract_main_text(html: str) -> str:
    text = clean_html(html)
    anchors = [
        "课程编号：",
        "课程类型：",
        "课程收益/背景：",
        "培训对象：",
        "课程收益：",
        "课程背景：",
    ]
    positions = [text.find(anchor) for anchor in anchors if text.find(anchor) >= 0]
    if positions:
        text = text[min(positions):]
    for stop in ("近期相关公开课", "相关内训课", "公开课 行政工作", "您可能遇到的问题", "关于我们"):
        pos = text.find(stop)
        if pos > 800:
            text = text[:pos]
    return text


def extract_main_html(html: str) -> str:
    anchors = [
        "课程编号：",
        "课程类型：",
        "课程收益/背景：",
        "培训对象：",
        "课程收益：",
        "课程背景：",
    ]
    positions = [html.find(anchor) for anchor in anchors if html.find(anchor) >= 0]
    start = min(positions) if positions else 0
    end = len(html)
    for stop in ("近期相关公开课", "相关内训课", "公开课 行政工作", "您可能遇到的问题", "关于我们"):
        pos = html.find(stop, start + 1)
        if pos > start:
            end = min(end, pos)
    return html[start:end]


def extract_between(text: str, label: str, stops: Iterable[str], limit: int = 1200) -> str:
    pos = text.find(label)
    if pos < 0:
        return MISSING
    segment = text[pos + len(label):]
    stop_positions = [segment.find(stop) for stop in stops if segment.find(stop) > 0]
    if stop_positions:
        segment = segment[: min(stop_positions)]
    return segment.strip(" ：:")[:limit] or MISSING


SECTION_STOPS = (
    "课程收益/背景：",
    "课程收益：",
    "培训目标：",
    "课程目标：",
    "培训对象：",
    "课程简介：",
    "课程背景：",
    "课程大纲：",
    "讲师介绍",
    "在线报名",
    "老师介绍：",
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
    stops = []
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
    intro = extract_after_labels(text, ("课程背景：", "课程收益/背景："), 1200)
    if intro != MISSING:
        return intro
    return fallback if fallback != MISSING else text[:600]


def extract_learning_outcomes(text: str) -> str:
    for labels in (("培训目标：", "课程目标："), ("课程收益：",), ("课程收益/背景：",)):
        value = extract_after_labels(text, labels, 1800)
        if value != MISSING:
            return value
    return MISSING


def extract_audience(text: str) -> str:
    return extract_after_labels(text, ("培训对象：", "适合对象：", "课程对象：", "参加对象："), 900)


def extract_syllabus(text: str) -> str:
    syllabus = extract_after_labels(text, ("课程大纲：", "课程简介："), 5000)
    return syllabus if syllabus != MISSING else text[:5000]


def extract_highlights(text: str) -> str:
    return extract_after_labels(text, ("课程特色：", "培训方式：", "授课方式："), 1200)


def parse_date_range(value: str) -> tuple[str, str]:
    text = clean_html(value)
    match = re.search(r"(\d{4})年(\d{1,2})月(\d{1,2})日(?:[-至](\d{1,2})日)?", text)
    if match:
        year, month, start_day, end_day = match.groups()
        y, m, d1 = int(year), int(month), int(start_day)
        d2 = int(end_day or start_day)
        return f"{y:04d}-{m:02d}-{d1:02d}", f"{y:04d}-{m:02d}-{d2:02d}"
    match = re.search(r"(\d{4})-(\d{1,2})-(\d{1,2})", text)
    if match:
        y, m, d = match.groups()
        return f"{int(y):04d}-{int(m):02d}-{int(d):02d}", f"{int(y):04d}-{int(m):02d}-{int(d):02d}"
    return "", ""


def parse_duration_days(*values: Any) -> int:
    text = " ".join(clean_html(value) for value in values if value)
    match = re.search(r"(?:培训天数|课程时长|天数)[：:\s]*(\d+(?:\.\d+)?)\s*天", text)
    if match:
        return max(1, int(float(match.group(1))))
    start, end = parse_date_range(text)
    if start and end:
        try:
            start_dt = datetime.strptime(start, "%Y-%m-%d").date()
            end_dt = datetime.strptime(end, "%Y-%m-%d").date()
            return max(1, (end_dt - start_dt).days + 1)
        except ValueError:
            return 0
    return 0


def parse_open_list_rows(html: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    pattern = r'<a[^>]+href=["\']([^"\']*/opencourse/\d+\.shtm)["\'][^>]*>([\s\S]*?)</a>'
    for href, body in re.findall(pattern, html, flags=re.I):
        url = absolute_url(href)
        if url in seen:
            continue
        text = clean_html(body)
        if not re.search(r"\d{4}年\d{1,2}月\d{1,2}日", text):
            continue
        price_match = re.search(r"￥\s*([0-9.]+)", text)
        date_match = re.search(r"([\u4e00-\u9fa5]{2,8})\s+(\d{4}年\d{1,2}月\d{1,2}日(?:[-至]\d{1,2}日)?)", text)
        title = text
        if date_match:
            title = text[: date_match.start()].strip()
        title = re.sub(r"￥\s*[0-9.]+.*$", "", title).strip()
        if not title or title in {"查看详情", "报名"}:
            continue
        seen.add(url)
        city = date_match.group(1) if date_match else ""
        date_text = date_match.group(2) if date_match else ""
        start_date, end_date = parse_date_range(date_text)
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
            "signupUrl": url,
        }
        rows.append(
            {
                "url": url,
                "source_course_id": source_id_from_url(url),
                "title": title,
                "category_name_raw": MISSING,
                "price_raw": price_match.group(1) if price_match else MISSING,
                "city": city,
                "date_text": date_text,
                "plans_json": [{k: v for k, v in plan.items() if v not in {"", None}}],
                "type": "OPEN_OFFLINE",
                "source_entry": "open_course_list",
            }
        )
    return rows


def parse_internal_list_rows(html: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    pattern = r'<a[^>]+href=["\']([^"\']*/inhousecourse/\d+\.shtm)["\'][^>]*>([\s\S]*?)</a>'
    for href, body in re.findall(pattern, html, flags=re.I):
        url = absolute_url(href)
        if url in seen:
            continue
        text = clean_html(body)
        if "主讲老师" not in text and "培训天数" not in text and len(text) < 12:
            continue
        seen.add(url)
        title = text.split("内训编号：", 1)[0].strip()
        teacher = extract_between(text, "主讲老师：", ("培训天数：", "课程类别："), 80)
        duration = extract_between(text, "培训天数：", ("课程类别：", "课程内容："), 40)
        category = extract_between(text, "课程类别：", ("课程内容：",), 80)
        rows.append(
            {
                "url": url,
                "source_course_id": source_id_from_url(url),
                "title": title or MISSING,
                "category_name_raw": category,
                "trainer_name_raw": teacher,
                "duration_days": duration,
                "learning_outcomes_hint": extract_between(text, "课程内容：", ("查看详情",), 1000),
                "type": "INTERNAL",
                "source_entry": "internal_course_list",
            }
        )
    return rows


def parse_open_detail_html(item: dict[str, Any], html: str) -> Dict[str, Any]:
    detail_text = extract_main_text(html)
    full_text = clean_html(html)
    summary = meta_content(html, "description")
    detail_title = extract_title(html, MISSING)
    item_title = item.get("title")
    title = detail_title if item_title and "…" in item_title and detail_title != MISSING else (item_title or detail_title)
    category = extract_between(full_text, "公开课 >", (">", "收藏课程"), 80)
    if category == MISSING:
        category = item.get("category_name_raw") or MISSING
    duration_days = parse_duration_days(item.get("date_text", ""), detail_text)
    record: Dict[str, Any] = {
        "source_course_id": item.get("source_course_id") or source_id_from_url(item["url"]),
        "source_url": item["url"],
        "title": title,
        "type": "OPEN_OFFLINE",
        "category_name_raw": category,
        "cover_url": "",
        "intro": extract_intro(detail_text, summary),
        "summary": (summary if summary != MISSING else extract_intro(detail_text, summary))[:500],
        "syllabus": extract_syllabus(detail_text),
        "audience": extract_audience(detail_text),
        "target_audience": "",
        "learning_outcomes": extract_learning_outcomes(detail_text),
        "highlights": extract_highlights(detail_text),
        "duration_days": duration_days,
        "total_hours": duration_days * 6 if duration_days else 0,
        "original_price": 0,
        "keywords": "",
        "trainer_name_raw": extract_between(detail_text, "讲师：", ("地点：", "学习费用："), 80),
        "plans_json": item.get("plans_json", []),
        "services_json": [],
        "raw_json": {
            "source_entry": "open_course_list",
            "source_entry_name": "公开课",
            "content_type": "COURSE",
            "type_evidence": "chinacpx_opencourse_has_date_city_price",
            "category_evidence": "breadcrumb or list",
            "field_sources": {
                "plans_json": "公开课列表和详情开课计划",
                "price": "公开课列表学习费用",
                "trainer_name_raw": "详情讲师字段",
                "learning_outcomes": "详情课程收益/培训目标",
                "audience": "详情培训对象",
                "syllabus": "详情课程大纲",
            },
            "coverage_notes": [
                "OPEN_OFFLINE 已覆盖：公开课列表与详情页提供城市、日期、价格和讲师。",
                "OPEN_ONLINE 未导入 courses：在线课程为按小时售卖的在线网课/录播体系，后续应进入 video/online 单独流程。",
                "INTERNAL 已覆盖：企业内训列表和详情页提供课程类型、天数、讲师、收益/背景、对象和简介。",
            ],
            "diagnostics": [],
        },
    }
    apply_syllabus_rich_content(
        record,
        extract_main_html(html),
        plain_text="" if record["syllabus"] == MISSING else record["syllabus"],
        base_url=BASE_URL,
    )
    set_price_fields(record, item.get("price_raw") or extract_between(detail_text, "学习费用：", ("元", "/位"), 80))
    for plan in record["plans_json"]:
        if plan.get("address") == plan.get("city"):
            append_diagnostic(record, "plans_json.address", "source_only_provides_city_no_street_address", plan.get("city", ""))
    enrich_course_record(record, fallback_type="OPEN_OFFLINE")
    record["type"] = "OPEN_OFFLINE"
    record["raw_json"]["content_type"] = "COURSE"
    record["raw_json"]["type_evidence"] = "chinacpx_opencourse_has_date_city_price"
    return record


def parse_internal_detail_html(item: dict[str, Any], html: str) -> Dict[str, Any]:
    detail_text = extract_main_text(html)
    summary = meta_content(html, "description")
    title = item.get("title") or extract_title(html, MISSING)
    category = item.get("category_name_raw") or extract_between(detail_text, "企业内训 >", (">", "课程编号："), 80)
    duration_days = parse_duration_days(item.get("duration_days", ""), detail_text)
    learning_outcomes = extract_learning_outcomes(detail_text)
    if learning_outcomes == MISSING and item.get("learning_outcomes_hint"):
        learning_outcomes = item["learning_outcomes_hint"]
    record: Dict[str, Any] = {
        "source_course_id": item.get("source_course_id") or source_id_from_url(item["url"]),
        "source_url": item["url"],
        "title": title,
        "type": "INTERNAL",
        "category_name_raw": category,
        "cover_url": "",
        "intro": extract_intro(detail_text, summary),
        "summary": (summary if summary != MISSING else extract_intro(detail_text, summary))[:500],
        "syllabus": extract_syllabus(detail_text),
        "audience": extract_audience(detail_text),
        "target_audience": "",
        "learning_outcomes": learning_outcomes,
        "highlights": extract_highlights(detail_text),
        "duration_days": duration_days,
        "total_hours": duration_days * 6 if duration_days else 0,
        "original_price": 0,
        "keywords": "",
        "trainer_name_raw": item.get("trainer_name_raw") or extract_between(detail_text, "授课老师：", ("培训预算：", "用手机看"), 80),
        "plans_json": [],
        "services_json": [],
        "raw_json": {
            "source_entry": "internal_course_list",
            "source_entry_name": "企业内训",
            "price_raw": "按方案定价",
            "content_type": "COURSE",
            "type_evidence": "chinacpx_inhousecourse_internal",
            "category_evidence": "list or breadcrumb",
            "field_sources": {
                "price": "详情培训预算为按方案定价，按咨询/面议处理",
                "trainer_name_raw": "列表主讲老师或详情授课老师",
                "learning_outcomes": "详情课程收益/背景",
                "audience": "详情培训对象",
                "syllabus": "详情课程简介",
            },
            "coverage_notes": [
                "OPEN_OFFLINE 已覆盖：公开课列表与详情页提供城市、日期、价格和讲师。",
                "OPEN_ONLINE 未导入 courses：在线课程为按小时售卖的在线网课/录播体系，后续应进入 video/online 单独流程。",
                "INTERNAL 已覆盖：企业内训列表和详情页提供课程类型、天数、讲师、收益/背景、对象和简介。",
            ],
            "diagnostics": [],
        },
    }
    apply_syllabus_rich_content(
        record,
        extract_main_html(html),
        plain_text="" if record["syllabus"] == MISSING else record["syllabus"],
        base_url=BASE_URL,
    )
    set_price_fields(record, "内训咨询")
    record["raw_json"]["source_price_text"] = "按方案定价"
    append_diagnostic(record, "plans_json", "internal_course_has_no_public_schedule")
    enrich_course_record(record, fallback_type="INTERNAL")
    record["type"] = "INTERNAL"
    record["raw_json"]["content_type"] = "COURSE"
    record["raw_json"]["type_evidence"] = "chinacpx_inhousecourse_internal"
    return record


def parse_online_entry(html: str, url: str) -> Dict[str, Any]:
    text = extract_main_text(html)
    return {
        "source_course_id": source_id_from_url(url),
        "source_url": url,
        "title": extract_title(html, MISSING),
        "content_type": "RECORDED_VIDEO",
        "reason": "online_course_entry_not_imported_to_courses",
        "evidence": "在线课程详情为按小时/分钟售卖的网课内容，非公开课排期",
        "raw_text_sample": text[:500],
    }


def discover_open_items(limit: int) -> list[dict[str, Any]]:
    return parse_open_list_rows(fetch_text(OPEN_LIST_URL))[:limit]


def discover_internal_items(limit: int) -> list[dict[str, Any]]:
    return parse_internal_list_rows(fetch_text(INTERNAL_LIST_URL))[:limit]


def iter_chinacpx_courses(max_items: int | None = None):
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
            logger.warning("chinacpx course detail failed, skip url=%s error=%s", item.get("url"), exc)
        time.sleep(0.1)


def crawl_chinacpx_courses(max_items: int | None = None) -> List[Dict[str, Any]]:
    return list(iter_chinacpx_courses(max_items))


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class ChinacpxCourseSpider:
    """中培网课程爬虫适配器，供 JobManager 调用。"""

    name = "chinacpx_course"
    source = "chinacpx"
    data_type = "COURSE"
    max_items = None
    supported_course_types = ("OPEN_OFFLINE", "INTERNAL")
    coverage_note = (
        "公开课覆盖 OPEN_OFFLINE；企业内训覆盖 INTERNAL；在线课程为按小时售卖的网课/录播体系，当前不导入 courses。"
    )

    def pause(self) -> None:
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_chinacpx_courses(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
