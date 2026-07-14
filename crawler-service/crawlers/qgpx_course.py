"""中华企管培训网课程爬虫适配器。"""
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
from crawlers.rich_content import apply_syllabus_rich_content


BASE_URL = "https://www.qgpx.com"
OPEN_LIST_URL = f"{BASE_URL}/courses/"
INTERNAL_LIST_URL = f"{BASE_URL}/neixun/"
INTERNAL_CATEGORY_URLS = [
    f"{BASE_URL}/neixun/shichangyingxiao/",
    f"{BASE_URL}/neixun/shichangyingxiao/qudaoyingxiao/",
    f"{BASE_URL}/neixun/guanlijineng/",
]
ONLINE_LIST_URL = f"{BASE_URL}/online/"
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
    text = re.sub(r"</li\s*>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text).replace("&nbsp;", " ")
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\n\s+", "\n", text)
    text = " ".join(text.split())
    return text or default


def absolute_url(value: str) -> str:
    return urljoin(BASE_URL + "/", value or "")


def source_id_from_url(url: str) -> str:
    match = re.search(r"/(\d+)\.html", url)
    if match:
        return match.group(1)
    match = re.search(r"showd\d{8}c\d+c(\d+)p\d+\.html", url)
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
        r'<h1[^>]+class=["\'][^"\']*(?:event-detail-title|title)[^"\']*["\'][^>]*>([\s\S]*?)</h1>',
        r"<h1[^>]*>([\s\S]*?)</h1>",
        r"<title[^>]*>([\s\S]*?)</title>",
    ):
        match = re.search(pattern, html, flags=re.I | re.S)
        if not match:
            continue
        title = clean_html(match.group(1), fallback)
        title = re.sub(r"\s*[-_].*(中华企管|中华企业培训网).*$", "", title).strip()
        if title and len(title) <= 180:
            return title
    return fallback


def breadcrumb_category(html: str, default: str = MISSING) -> str:
    crumbs = [
        clean_html(label)
        for label in re.findall(r'<ol[^>]+class=["\'][^"\']*breadcrumb[^"\']*["\'][^>]*>([\s\S]*?)</ol>', html, re.I)
        for label in re.findall(r"<li[^>]*>([\s\S]*?)</li>", label, re.I)
    ]
    cleaned = []
    for crumb in crumbs:
        crumb = crumb.replace("中华企管培训网", "").strip()
        if crumb and crumb not in {"公开课", "企业内训", "首页"}:
            cleaned.append(crumb)
    return cleaned[-2] if len(cleaned) >= 2 else (cleaned[-1] if cleaned else default)


SECTION_STOPS = (
    "【课程对象】",
    "【培训对象】",
    "培训对象：",
    "课程对象：",
    "课程时间：",
    "【课程时间】",
    "【课程人数】",
    "内训时长：",
    "内训时长 ：",
    "课程背景：",
    "【课程收益】",
    "课程收益：",
    "【课程风格】",
    "【课程特色】",
    "课程特色：",
    "【课程大纲】",
    "课程大纲：",
    "讲师介绍",
    "讲师 ",
    "上一篇：",
    "下一篇：",
    "相关内训推荐",
    "培训现场",
)


def extract_after_labels(text: str, labels: Iterable[str], limit: int = 1800) -> str:
    positions: list[tuple[int, str]] = []
    for label in labels:
        pos = text.find(label)
        if pos >= 0:
            positions.append((pos, label))
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


def extract_detail_text(html: str) -> str:
    text = clean_html(html)
    anchors = ["公开课大纲", "内训课程大纲", "【课程背景】", "培训对象：", "课程收益："]
    positions = [text.find(anchor) for anchor in anchors if text.find(anchor) >= 0]
    if positions:
        text = text[min(positions):]
    for stop in ("相关公开课推荐", "相关内训推荐", "培训现场", "网站始创于", "京ICP备"):
        pos = text.find(stop)
        if pos > 800:
            text = text[:pos]
    return text


def extract_detail_html(html: str) -> str:
    anchors = ["公开课大纲", "内训课程大纲", "【课程背景】", "培训对象：", "课程收益："]
    positions = [html.find(anchor) for anchor in anchors if html.find(anchor) >= 0]
    start = min(positions) if positions else 0
    end = len(html)
    for stop in ("相关公开课推荐", "相关内训推荐", "培训现场", "网站始创于", "京ICP备"):
        pos = html.find(stop, start + 1)
        if pos > start:
            end = min(end, pos)
    return html[start:end]


def extract_intro(text: str, fallback: str = MISSING) -> str:
    intro = extract_after_labels(text, ("【课程背景】", "课程背景：", "背景："), 1400)
    if intro != MISSING:
        return intro
    return fallback if fallback != MISSING else text[:700]


def extract_learning_outcomes(text: str) -> str:
    return extract_after_labels(text, ("【课程收益】", "课程收益：", "培训收益：", "课程目标："), 1800)


def extract_audience(text: str) -> str:
    return extract_after_labels(text, ("【课程对象】", "【培训对象】", "培训对象：", "课程对象：", "学员对象：", "参加对象："), 1000)


def extract_highlights(text: str) -> str:
    return extract_after_labels(text, ("【课程风格】", "【课程特色】", "课程特色：", "授课方式："), 1200)


def extract_syllabus(text: str) -> str:
    syllabus = extract_after_labels(text, ("【课程大纲】", "课程大纲：", "内训课程大纲"), 5000)
    return syllabus if syllabus != MISSING else text[:5000]


def extract_label_value(html: str, label: str, default: str = MISSING) -> str:
    pattern = (
        rf'<span[^>]+class=["\'][^"\']*label-time[^"\']*["\'][^>]*>\s*{re.escape(label)}\s*</span>\s*'
        r"<span[^>]*>([\s\S]*?)</span>"
    )
    match = re.search(pattern, html, flags=re.I)
    return clean_html(match.group(1), default) if match else default


def parse_date(value: Any) -> str:
    text = clean_html(value)
    match = re.search(r"(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})", text)
    if not match:
        return ""
    y, m, d = match.groups()
    return f"{int(y):04d}-{int(m):02d}-{int(d):02d}"


def parse_duration_days(*values: Any) -> int:
    text = " ".join(clean_html(value) for value in values if value)
    if re.fullmatch(r"\d+(?:\.\d+)?", text.strip()):
        return max(1, int(float(text.strip())))
    match = re.search(r"(\d+(?:\.\d+)?)\s*天", text)
    if match:
        return max(1, int(float(match.group(1))))
    return 0


def parse_total_hours(text: str, duration_days: int) -> float:
    match = re.search(r"(\d+(?:\.\d+)?)\s*(?:小时|课时)", clean_html(text))
    if match:
        return float(match.group(1))
    return float(duration_days * 6) if duration_days else 0


def parse_location(value: str) -> dict[str, str]:
    parts = [part.strip() for part in re.split(r">|/|-", clean_html(value)) if part.strip()]
    province = parts[0] if parts else ""
    city = parts[-1] if parts else ""
    return {
        "province_name_raw": province,
        "city_name_raw": city,
        "city": city or province,
        "location": clean_html(value),
        "address": clean_html(value),
    }


def plan_from_item(item: dict[str, Any]) -> dict[str, Any]:
    start_date = parse_date(item.get("date_text"))
    duration_days = parse_duration_days(item.get("duration_days"))
    end_date = ""
    if start_date and duration_days:
        end_date = (datetime.strptime(start_date, "%Y-%m-%d").date() + timedelta(days=duration_days - 1)).isoformat()
    elif start_date:
        end_date = start_date
    location = parse_location(item.get("location_text", ""))
    plan = {
        "startDate": start_date,
        "start_date": start_date,
        "endDate": end_date,
        "end_date": end_date,
        "sourceDateText": clean_html(item.get("date_text")),
        "sourceLocationText": clean_html(item.get("location_text")),
        "signupUrl": item.get("url"),
        "type": "OFFLINE",
    }
    plan.update(location)
    return {key: value for key, value in plan.items() if value not in {"", None}}


def parse_open_list_rows(html: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    current_category = MISSING
    seen: set[str] = set()
    chunks = re.split(r'(<div[^>]+class=["\'][^"\']*course-syllabus-title[^"\']*["\'][^>]*>[\s\S]*?</div>)', html, flags=re.I)
    for chunk in chunks:
        if "course-syllabus-title" in chunk:
            category_match = re.search(r"<a[^>]*>([\s\S]*?)</a>", chunk, flags=re.I)
            current_category = re.sub(r"公开课.*$", "", clean_html(category_match.group(1), MISSING)).strip() or MISSING
            continue
        for row_html in re.findall(r'<tr[^>]+class=["\'][^"\']*table-row[^"\']*["\'][^>]*>([\s\S]*?)</tr>', chunk, flags=re.I):
            cells = re.findall(r"<td[^>]*>([\s\S]*?)</td>", row_html, flags=re.I)
            if len(cells) < 4:
                continue
            link_match = re.search(r'<a[^>]+href=["\']([^"\']+\.html)["\'][^>]*>([\s\S]*?)</a>', cells[0], flags=re.I)
            if not link_match:
                continue
            url = absolute_url(link_match.group(1))
            if url in seen:
                continue
            seen.add(url)
            title = clean_html(link_match.group(2), MISSING)
            date_text = clean_html(cells[1])
            location_text = clean_html(cells[2])
            price_raw = clean_html(cells[3])
            if not parse_date(date_text):
                continue
            rows.append(
                {
                    "url": url,
                    "source_course_id": source_id_from_url(url),
                    "title": title,
                    "category_name_raw": current_category,
                    "date_text": date_text,
                    "location_text": location_text,
                    "price_raw": price_raw,
                    "type": "OPEN_OFFLINE",
                    "source_entry": "open_course_table",
                }
            )
    return rows


def parse_internal_list_rows(html: str, *, limit: int | None = None) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    for href, body in re.findall(r'<a[^>]+href=["\']([^"\']+\.html)["\'][^>]*>([\s\S]*?)</a>', html, flags=re.I):
        url = absolute_url(href)
        if url in seen:
            continue
        if url.endswith("/neixun/neixun_guide.html") or "neixun_guide" in url:
            continue
        if "/neixun/" not in url and not re.search(r"/20\d{2}/[^/]+_\d{4}/\d+\.html", url):
            continue
        if re.search(r"/(?:annce|aticles|xianchang|jiangshi|courses|online)/", url):
            continue
        title = clean_html(body, MISSING)
        if not title or title in {"最后一页", "打印"} or len(title) < 4:
            continue
        if "《" not in title and not re.search(r"课程|管理|营销|培训|销售|战略|领导|沟通|渠道", title):
            continue
        seen.add(url)
        rows.append(
            {
                "url": url,
                "source_course_id": source_id_from_url(url),
                "title": title.strip("《》"),
                "category_name_raw": MISSING,
                "type": "INTERNAL",
                "source_entry": "internal_course_list",
            }
        )
        if limit and len(rows) >= limit:
            break
    return rows


def fetch_open_api_plan(course_id: str) -> tuple[str, str]:
    if not course_id:
        return "", ""
    try:
        js = fetch_text(f"{BASE_URL}/api.php?op=get_kaike&id={course_id}", timeout=10, retries=1)
    except Exception:
        return "", ""
    date_match = re.search(r'getElementById\("kaike"\)\.innerHTML="([^"]*)"', js)
    addr_match = re.search(r'getElementById\("addr"\)\.innerHTML="([^"]*)"', js)
    return (
        clean_html(date_match.group(1)) if date_match else "",
        clean_html(addr_match.group(1)) if addr_match else "",
    )


def parse_open_detail_html(item: dict[str, Any], html: str) -> Dict[str, Any]:
    detail_text = extract_detail_text(html)
    summary = meta_content(html, "description")
    duration_days = parse_duration_days(item.get("duration_days"), extract_label_value(html, "课时安排"), detail_text)
    api_date, api_location = fetch_open_api_plan(item.get("source_course_id", ""))
    if api_date:
        item["date_text"] = api_date
    if api_location:
        item["location_text"] = api_location
    plan = plan_from_item({**item, "duration_days": duration_days})
    trainer = extract_label_value(html, "主讲老师")
    record: Dict[str, Any] = {
        "source_course_id": item.get("source_course_id") or source_id_from_url(item["url"]),
        "source_url": item["url"],
        "title": extract_title(html, item.get("title") or MISSING),
        "type": "OPEN_OFFLINE",
        "category_name_raw": item.get("category_name_raw") or breadcrumb_category(html),
        "cover_url": "",
        "intro": extract_intro(detail_text, summary),
        "summary": (summary if summary != MISSING else extract_intro(detail_text, summary))[:500],
        "syllabus": extract_syllabus(detail_text),
        "audience": extract_audience(detail_text),
        "target_audience": "",
        "learning_outcomes": extract_learning_outcomes(detail_text),
        "highlights": extract_highlights(detail_text),
        "duration_days": duration_days,
        "total_hours": parse_total_hours(detail_text, duration_days),
        "original_price": 0,
        "keywords": meta_content(html, "keywords"),
        "trainer_name_raw": trainer,
        "plans_json": [plan] if plan else [],
        "services_json": [],
        "raw_json": {
            "source_entry": "open_course_table",
            "source_entry_name": "公开课",
            "content_type": "COURSE",
            "type_evidence": "qgpx_courses_table_has_date_location_price",
            "category_evidence": "list block title or breadcrumb",
            "field_sources": {
                "plans_json": "公开课列表时间地点，并用 get_kaike API 补充最新地址",
                "price": "公开课列表价格或详情参加费用",
                "trainer_name_raw": "详情主讲老师",
                "learning_outcomes": "详情公开课大纲中的课程收益",
                "audience": "详情公开课大纲中的课程对象/培训对象",
                "syllabus": "详情公开课大纲",
            },
            "coverage_notes": [
                "OPEN_OFFLINE 已覆盖：公开课列表提供时间、地点、价格，详情/API 补充讲师和大纲。",
                "OPEN_ONLINE 未导入 courses：源站线上入口为音视频课，当前应进入后续 video/online 单独流程。",
                "INTERNAL 已覆盖：企业内训栏目和分类页提供内训详情，详情页提供讲师、时长、对象、收益和大纲。",
            ],
            "diagnostics": [],
        },
    }
    apply_syllabus_rich_content(
        record,
        extract_detail_html(html),
        plain_text="" if record["syllabus"] == MISSING else record["syllabus"],
        base_url=BASE_URL,
    )
    set_price_fields(record, item.get("price_raw") or extract_label_value(html, "参加费用"))
    if plan.get("startDate"):
        try:
            if datetime.strptime(plan["startDate"], "%Y-%m-%d").date() < date.today():
                append_diagnostic(record, "plans_json.startDate", "source_schedule_date_is_in_past", plan["startDate"])
        except ValueError:
            append_diagnostic(record, "plans_json.startDate", "source_schedule_date_missing_or_unparsed", plan.get("sourceDateText", ""))
    if plan.get("address") == plan.get("city"):
        append_diagnostic(record, "plans_json.address", "source_only_provides_city_no_street_address", plan.get("city", ""))
    enrich_course_record(record, fallback_type="OPEN_OFFLINE")
    record["type"] = "OPEN_OFFLINE"
    record["raw_json"]["content_type"] = "COURSE"
    record["raw_json"]["type_evidence"] = "qgpx_courses_table_has_date_location_price"
    return record


def parse_internal_detail_html(item: dict[str, Any], html: str) -> Dict[str, Any]:
    detail_text = extract_detail_text(html)
    summary = meta_content(html, "description")
    duration_days = parse_duration_days(extract_after_labels(detail_text, ("内训时长 ：", "内训时长：", "课程时间："), 80), detail_text)
    trainer = extract_after_labels(detail_text, ("内训讲师：", "讲授专家："), 80)
    if trainer == MISSING:
        trainer = extract_label_value(html, "主讲老师")
    category = breadcrumb_category(html, item.get("category_name_raw") or MISSING)
    record: Dict[str, Any] = {
        "source_course_id": item.get("source_course_id") or source_id_from_url(item["url"]),
        "source_url": item["url"],
        "title": extract_title(html, item.get("title") or MISSING).strip("《》"),
        "type": "INTERNAL",
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
        "total_hours": parse_total_hours(detail_text, duration_days),
        "original_price": 0,
        "keywords": meta_content(html, "keywords"),
        "trainer_name_raw": trainer,
        "plans_json": [],
        "services_json": [],
        "raw_json": {
            "source_entry": item.get("source_entry", "internal_course_list"),
            "source_entry_name": "企业内训",
            "content_type": "COURSE",
            "type_evidence": "qgpx_neixun_detail_internal",
            "category_evidence": "breadcrumb or internal category page",
            "field_sources": {
                "plans_json": "企业内训无公开固定排期",
                "price": "内训咨询/面议",
                "trainer_name_raw": "详情内训讲师/讲授专家",
                "learning_outcomes": "详情内训课程大纲中的课程收益",
                "audience": "详情培训对象",
                "syllabus": "详情内训课程大纲",
            },
            "coverage_notes": [
                "OPEN_OFFLINE 已覆盖：公开课列表提供时间、地点、价格，详情/API 补充讲师和大纲。",
                "OPEN_ONLINE 未导入 courses：源站线上入口为音视频课，当前应进入后续 video/online 单独流程。",
                "INTERNAL 已覆盖：企业内训栏目和分类页提供内训详情，详情页提供讲师、时长、对象、收益和大纲。",
            ],
            "diagnostics": [],
        },
    }
    apply_syllabus_rich_content(
        record,
        extract_detail_html(html),
        plain_text="" if record["syllabus"] == MISSING else record["syllabus"],
        base_url=BASE_URL,
    )
    set_price_fields(record, "内训咨询")
    append_diagnostic(record, "plans_json", "internal_course_has_no_public_schedule")
    enrich_course_record(record, fallback_type="INTERNAL")
    record["type"] = "INTERNAL"
    record["raw_json"]["content_type"] = "COURSE"
    record["raw_json"]["type_evidence"] = "qgpx_neixun_detail_internal"
    return record


def parse_online_entry(html: str, url: str) -> Dict[str, Any]:
    text = extract_detail_text(html)
    return {
        "source_course_id": source_id_from_url(url),
        "source_url": url,
        "title": extract_title(html, MISSING),
        "content_type": "RECORDED_VIDEO",
        "reason": "online_audio_video_entry_not_imported_to_courses",
        "evidence": "源站线上入口标注为音视频课，当前不进入 courses 流程。",
        "raw_text_sample": text[:500],
    }


def discover_open_items(limit: int) -> list[dict[str, Any]]:
    return parse_open_list_rows(fetch_text(OPEN_LIST_URL))[:limit]


def discover_internal_items(limit: int) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    seen: set[str] = set()
    for url in INTERNAL_CATEGORY_URLS + [INTERNAL_LIST_URL]:
        try:
            page_items = parse_internal_list_rows(fetch_text(url), limit=limit)
        except Exception as exc:
            logger.warning("qgpx internal list failed url=%s error=%s", url, exc)
            continue
        for item in page_items:
            if item["url"] in seen:
                continue
            seen.add(item["url"])
            items.append(item)
            if len(items) >= limit:
                return items
    return items


def iter_qgpx_courses(max_items: int | None = None):
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
            logger.warning("qgpx course detail failed, skip url=%s error=%s", item.get("url"), exc)
        time.sleep(0.1)


def crawl_qgpx_courses(max_items: int | None = None) -> List[Dict[str, Any]]:
    return list(iter_qgpx_courses(max_items))


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class QgpxCourseSpider:
    """中华企管培训网课程爬虫适配器，供 JobManager 调用。"""

    name = "qgpx_course"
    source = "qgpx"
    data_type = "COURSE"
    max_items = None
    supported_course_types = ("OPEN_OFFLINE", "INTERNAL")
    coverage_note = (
        "公开课覆盖 OPEN_OFFLINE；企业内训覆盖 INTERNAL；线上入口为音视频课，当前不导入 courses，后续进入 video/online 单独流程。"
    )

    def pause(self) -> None:
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_qgpx_courses(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
