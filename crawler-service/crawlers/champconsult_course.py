"""冠卓顾问课程爬虫适配器。"""
import asyncio
import logging
import re
import ssl
import time
import urllib.request
from datetime import datetime, timedelta
from html import unescape
from typing import Any, AsyncGenerator, Dict, Iterable, List
from urllib.parse import parse_qs, urljoin, urlparse

from crawlers.course_utils import append_diagnostic, detect_content_type, enrich_course_record, set_price_fields
from crawlers.rich_content import apply_syllabus_rich_content


BASE_URL = "http://www.champconsult.com"
HOME_URL = f"{BASE_URL}/index.aspx"
OPEN_LIST_URL = f"{BASE_URL}/curriculum.aspx?one=2"
INTERNAL_URL = f"{BASE_URL}/corporate_training.aspx?one=3"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
MISSING = "暂无"
logger = logging.getLogger(__name__)

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

CATEGORY_BY_THREE = {
    "97": "工厂运营管理系列",
    "98": "班组建设与现场管理系列",
    "99": "精益改善系列",
    "100": "质量改善系列",
    "101": "采购物流与供应链管理系列",
    "102": "研发设计改善系列",
    "103": "人力资源管理系列",
    "104": "通用管理系列",
    "105": "其他职业能力系列",
}


def fetch_text(url: str, timeout: int = 20, retries: int = 3) -> str:
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
    parsed = urlparse(url)
    query = parse_qs(parsed.query)
    if query.get("id"):
        return query["id"][0]
    if query.get("two"):
        path = parsed.path.rsplit("/", 1)[-1].replace(".aspx", "")
        return f"{path}_{query['two'][0]}"
    return url.rstrip("/").rsplit("/", 1)[-1]


def meta_content(html: str, name: str) -> str:
    match = re.search(
        rf'<meta[^>]+name=["\']{re.escape(name)}["\'][^>]+content=["\'](.*?)["\']',
        html,
        flags=re.I | re.S,
    )
    return clean_html(match.group(1), MISSING) if match else MISSING


def category_from_url(url: str, fallback: str = MISSING) -> str:
    query = parse_qs(urlparse(url).query)
    three = (query.get("three") or [""])[0]
    return CATEGORY_BY_THREE.get(three, fallback)


def extract_breadcrumb(html: str) -> str:
    match = re.search(r'<div[^>]+class=["\']incrltm["\'][^>]*>([\s\S]*?)</div>', html, flags=re.I)
    return clean_html(match.group(1)) if match else ""


def breadcrumb_parts(html: str) -> list[str]:
    text = extract_breadcrumb(html)
    if not text:
        return []
    text = re.sub(r"当前位置[:：]?", "", text).strip()
    return [part.strip() for part in re.split(r">|›|»", text) if part.strip()]


def extract_breadcrumb_category(html: str, fallback: str = MISSING) -> str:
    parts = breadcrumb_parts(html)
    ignored = {"首页", "公开课程", "课程体系", "课程详细", "企业内训"}
    category_parts = [part for part in parts if part not in ignored]
    if len(category_parts) >= 2:
        return category_parts[-2]
    if category_parts:
        return category_parts[0]
    return fallback


def extract_breadcrumb_title(html: str) -> str:
    parts = breadcrumb_parts(html)
    ignored = {"首页", "公开课程", "课程体系", "课程详细", "企业内训"}
    for part in reversed(parts):
        if part not in ignored:
            return part
    return ""


def extract_detail_text(html: str) -> str:
    for pattern in (
        r'<div[^>]+class=["\']incrlcont["\'][^>]*>([\s\S]*?)(?:<div[^>]+class=["\']footer|</body>)',
        r'<div[^>]+class=["\']incrlmadecontent["\'][^>]*>([\s\S]*?)(?:<div[^>]+class=["\']clear|</body>)',
    ):
        match = re.search(pattern, html, flags=re.I)
        if match:
            return clean_html(match.group(1))
    return clean_html(html)


def extract_detail_html(html: str) -> str:
    for pattern in (
        r'<div[^>]+class=["\']incrlcont["\'][^>]*>([\s\S]*?)(?:<div[^>]+class=["\']footer|</body>)',
        r'<div[^>]+class=["\']incrlmadecontent["\'][^>]*>([\s\S]*?)(?:<div[^>]+class=["\']clear|</body>)',
    ):
        match = re.search(pattern, html, flags=re.I)
        if match:
            return match.group(1)
    return html


def extract_title(html: str, fallback: str = MISSING) -> str:
    for pattern in (
        r'<div[^>]+class=["\']incrlcont["\'][^>]*>\s*<h[123][^>]*>([\s\S]*?)</h[123]>',
        r'<h[123][^>]*>([\s\S]*?)</h[123]>',
    ):
        match = re.search(pattern, html, flags=re.I | re.S)
        if match:
            title = clean_html(match.group(1))
            if title and "冠卓顾问" not in title:
                return title

    crumb_title = extract_breadcrumb_title(html)
    if crumb_title:
        return crumb_title

    detail_text = extract_detail_text(html)
    for label in ("参加对象：", "课时：", "价格：", "咨询热线：", "咨询专线：", "针对现状："):
        pos = detail_text.find(label)
        if pos > 0:
            head = detail_text[:pos].strip()
            head = re.sub(r"咨询热线[:：]?\s*\S+", "", head).strip()
            if head and "冠卓顾问" not in head:
                return head[:120]
    return fallback


SECTION_STOPS = (
    "【课程背景】",
    "课程背景：",
    "【课程收益】",
    "培训目标：",
    "课程目标：",
    "【课程特色】",
    "课程纲要",
    "讲师简介",
    "客户评价",
    "参加对象：",
    "课时：",
    "价格：",
    "针对现状：",
    "咨询内容：",
    "项目收益：",
    "项目设计背景",
    "项目思路",
    "项目内容",
    "项目成果",
    "部分客户：",
    "第一讲",
    "第一部分",
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


def extract_audience(text: str) -> str:
    return extract_after_labels(text, ("参加对象：", "培训对象：", "课程对象："), 900)


def extract_intro(text: str, fallback: str = MISSING) -> str:
    intro = extract_after_labels(text, ("【课程背景】", "课程背景：", "针对现状：", "项目设计背景"), 1200)
    if intro != MISSING:
        return intro
    return fallback if fallback != MISSING else text[:600]


def extract_learning_outcomes(text: str) -> str:
    return extract_after_labels(text, ("【课程收益】", "课程收益：", "培训目标：", "课程目标：", "项目收益："), 1800)


def extract_highlights(text: str) -> str:
    return extract_after_labels(text, ("【课程特色】", "项目成果", "项目思路"), 1200)


def extract_syllabus(text: str) -> str:
    syllabus = extract_after_labels(text, ("课程纲要", "咨询内容：", "项目内容"), 5000)
    if syllabus != MISSING and len(syllabus) > 20 and syllabus not in {"讲师简介", "客户评价"}:
        return syllabus
    markers = ("第一讲", "第一部分", "第一模块", "模块一", "一、", "1.", "1、")
    positions = [text.find(marker) for marker in markers if text.find(marker) >= 0]
    if positions:
        segment = text[min(positions):]
        stops = []
        for stop in ("讲师简介", "客户评价", "教育及资格认证", "师经历及专长"):
            pos = segment.find(stop)
            if pos > 30:
                stops.append(pos)
        teacher_intro = re.search(r"[^\s]{1,12}老师\s+教育及资格认证", segment)
        if teacher_intro and teacher_intro.start() > 30:
            stops.append(teacher_intro.start())
        if stops:
            segment = segment[: min(stops)]
        return segment[:5000].strip() or MISSING
    return text[:5000]


def parse_duration_days(*values: str) -> int:
    text = " ".join(clean_html(value) for value in values if value)
    match = re.search(r"(?:课时|天数)[：:\s]*(\d+(?:\.\d+)?)\s*天", text)
    if not match:
        match = re.search(r"^(\d+(?:\.\d+)?)$", text.strip())
    if not match:
        match = re.search(r"(\d+(?:\.\d+)?)\s*天", text)
    return max(1, int(float(match.group(1)))) if match else 0


def parse_date(value: str) -> str:
    text = clean_html(value)
    match = re.search(r"(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})", text)
    if match:
        y, m, d = match.groups()
        return f"{int(y):04d}-{int(m):02d}-{int(d):02d}"
    return ""


def end_date_from_duration(start_date: str, duration_days: int) -> str:
    if not start_date or duration_days <= 1:
        return start_date
    try:
        return (datetime.strptime(start_date, "%Y-%m-%d").date() + timedelta(days=duration_days - 1)).isoformat()
    except ValueError:
        return start_date


def extract_schedule_top(text: str) -> dict[str, str]:
    result: dict[str, str] = {}
    patterns = {
        "audience": r"参加对象：\s*([\s\S]*?)\s*课时：",
        "duration_days": r"课时：\s*(\d+(?:\.\d+)?)\s*天",
        "price_raw": r"价格：\s*([0-9,]+(?:\.\d+)?\s*元?)",
    }
    for key, pattern in patterns.items():
        match = re.search(pattern, text)
        if match:
            result[key] = clean_html(match.group(1))
    return result


def parse_open_list_rows(html: str) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    seen: set[str] = set()
    for row_html in re.findall(r"<tr[^>]*>([\s\S]*?)</tr>", html, flags=re.I):
        cells = re.findall(r"<td[^>]*>([\s\S]*?)</td>", row_html, flags=re.I)
        if len(cells) < 6:
            continue
        link_match = re.search(
            r'<a[^>]+href=["\']([^"\']*curriculum_detail\.aspx[^"\']*)["\'][^>]*>([\s\S]*?)</a>',
            cells[1],
            flags=re.I,
        )
        if not link_match:
            continue
        url = absolute_url(link_match.group(1).replace("&amp;", "&"))
        city = clean_html(cells[4])
        date_text = clean_html(cells[5])
        if not parse_date(date_text):
            continue
        key = f"{source_id_from_url(url)}:{city}:{date_text}"
        if key in seen:
            continue
        seen.add(key)
        rows.append(
            {
                "url": url,
                "source_course_id": source_id_from_url(url),
                "title": clean_html(link_match.group(2), MISSING),
                "category_name_raw": category_from_url(url, "公开课程"),
                "duration_days": clean_html(cells[2]),
                "price_raw": clean_html(cells[3]),
                "city": city,
                "date_text": date_text,
                "source_entry": "open_course_schedule_table",
            }
        )
    return rows


def parse_internal_solution_links(html: str) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    seen: set[str] = set()
    patterns = (
        r'<a[^>]+href=["\']([^"\']*consult_factory_con\.aspx[^"\']*)["\'][^>]*>([\s\S]*?)</a>',
        r'<a[^>]+href=["\']([^"\']*lean_six_sigma_con\.aspx[^"\']*)["\'][^>]*>([\s\S]*?)</a>',
    )
    for pattern in patterns:
        for href, label in re.findall(pattern, html, flags=re.I | re.S):
            url = absolute_url(href.replace("&amp;", "&"))
            if "two=" not in url or url in seen:
                continue
            seen.add(url)
            title = clean_html(label, MISSING)
            if title in {MISSING, "工厂运营管理咨询", "精益六西格玛咨询"}:
                continue
            items.append(
                {
                    "url": url,
                    "source_course_id": source_id_from_url(url),
                    "title": title,
                    "category_name_raw": "企业内训/咨询方案",
                    "source_entry": "internal_solution_link",
                }
            )
    return items


def build_open_plan(item: dict[str, str], duration_days: int) -> dict[str, Any]:
    start_date = parse_date(item.get("date_text", ""))
    end_date = end_date_from_duration(start_date, duration_days)
    city = item.get("city", "")
    plan = {
        "startDate": start_date,
        "start_date": start_date,
        "endDate": end_date,
        "end_date": end_date,
        "city": city,
        "location": city,
        "address": city,
        "sourceDateText": item.get("date_text", ""),
        "sourceLocationText": city,
        "signupUrl": item.get("url", ""),
    }
    if duration_days:
        plan["durationDays"] = duration_days
    return {key: value for key, value in plan.items() if value not in {"", None}}


def parse_open_detail_html(item: dict[str, str], html: str) -> Dict[str, Any]:
    detail_text = extract_detail_text(html)
    top = extract_schedule_top(detail_text)
    title = item.get("title") or extract_title(html, MISSING)
    category = item.get("category_name_raw") or extract_breadcrumb_category(html, category_from_url(item["url"], MISSING))
    duration_days = parse_duration_days(item.get("duration_days", ""), top.get("duration_days", ""), detail_text)
    plan = build_open_plan(item, duration_days)
    summary = meta_content(html, "description")
    course_type = "OPEN_ONLINE" if item.get("city") == "线上" else "OPEN_OFFLINE"
    record: Dict[str, Any] = {
        "source_course_id": item.get("source_course_id") or source_id_from_url(item["url"]),
        "source_url": item["url"],
        "title": title,
        "type": course_type,
        "category_name_raw": category,
        "cover_url": "",
        "intro": extract_intro(detail_text, summary),
        "summary": (summary if summary != MISSING else extract_intro(detail_text, summary))[:500],
        "syllabus": extract_syllabus(detail_text),
        "audience": top.get("audience") or extract_audience(detail_text),
        "target_audience": "",
        "learning_outcomes": extract_learning_outcomes(detail_text),
        "highlights": extract_highlights(detail_text),
        "duration_days": duration_days,
        "total_hours": duration_days * 6 if duration_days else 0,
        "original_price": 0,
        "keywords": " ".join(part for part in [category, "公开课", item.get("city", "")] if part and part != MISSING),
        "trainer_name_raw": MISSING,
        "plans_json": [plan] if plan.get("startDate") or plan.get("city") else [],
        "services_json": [],
        "raw_json": {
            "source_entry": "open_course_schedule_table",
            "source_entry_name": "公开课程",
            "source_date_text": item.get("date_text", ""),
            "source_city_text": item.get("city", ""),
            "content_type": detect_content_type(detail_text, title),
            "type_evidence": "champconsult_public_schedule_has_city_date_price",
            "category_evidence": "curriculum_detail query three or breadcrumb",
            "plan_evidence": f"{item.get('city', '')} {item.get('date_text', '')}".strip(),
            "field_sources": {
                "plans_json": "首页/公开课程表格的地点和开课时间",
                "price": "公开课程表格价格列或详情页顶部价格",
                "audience": "详情页参加对象",
                "learning_outcomes": "详情页课程收益",
                "syllabus": "详情页课程纲要",
            },
            "coverage_notes": [
                "OPEN_OFFLINE 已覆盖：公开课程表格提供课程名、天数、价格、地点、开课时间。",
                "OPEN_ONLINE 暂未覆盖为有效记录：源站存在线上 tab，但当前抽样未发现带明确线上公开课入口的可导入课程。",
                "INTERNAL 已覆盖为咨询式内训方案：企业内训页无逐条课程目录，系列解决方案按 INTERNAL 输出并标记面议、无排期。",
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
    set_price_fields(record, item.get("price_raw") or top.get("price_raw") or MISSING)
    if record["type"] == "OPEN_OFFLINE" and plan.get("address") == item.get("city"):
        append_diagnostic(record, "plans_json.address", "source_only_provides_city_no_street_address", item.get("city", ""))
    if record["type"] == "OPEN_ONLINE":
        plan["onlineUrl"] = item.get("url")
        plan["signupUrl"] = item.get("url")
        record["raw_json"]["type_evidence"] = "champconsult_public_schedule_city_online"
    enrich_course_record(record, fallback_type=course_type)
    record["type"] = course_type
    record["raw_json"]["type_evidence"] = "champconsult_public_schedule_has_city_date_price"
    record["raw_json"]["content_type"] = "COURSE"
    return record


def parse_internal_detail_html(item: dict[str, str], html: str) -> Dict[str, Any]:
    detail_text = extract_detail_text(html)
    title = item.get("title") or extract_title(html, MISSING)
    category = extract_breadcrumb_category(html, item.get("category_name_raw") or "企业内训/咨询方案")
    intro = extract_intro(detail_text, meta_content(html, "description"))
    record: Dict[str, Any] = {
        "source_course_id": item.get("source_course_id") or source_id_from_url(item["url"]),
        "source_url": item["url"],
        "title": title,
        "type": "INTERNAL",
        "category_name_raw": category,
        "cover_url": "",
        "intro": intro,
        "summary": intro[:500],
        "syllabus": extract_syllabus(detail_text),
        "audience": extract_audience(detail_text),
        "target_audience": "",
        "learning_outcomes": extract_learning_outcomes(detail_text),
        "highlights": extract_highlights(detail_text),
        "duration_days": 0,
        "total_hours": 0,
        "original_price": 0,
        "keywords": " ".join(part for part in [category, "企业内训", "咨询方案"] if part and part != MISSING),
        "trainer_name_raw": MISSING,
        "plans_json": [],
        "services_json": [],
        "raw_json": {
            "source_entry": "internal_solution_link",
            "source_entry_name": "企业内训/系列解决方案",
            "price_raw": "内训咨询",
            "content_type": detect_content_type(detail_text, title),
            "type_evidence": "champconsult_solution_or_internal_training_entry",
            "category_evidence": "breadcrumb or homepage solution link",
            "plan_evidence": "内训/咨询方案无公开固定排期，需按企业需求沟通",
            "field_sources": {
                "price": "源站未公开内训方案固定价格，按咨询/面议处理",
                "learning_outcomes": "详情页项目收益/课程收益",
                "syllabus": "详情页咨询内容/项目内容",
                "intro": "详情页针对现状/项目设计背景",
            },
            "coverage_notes": [
                "OPEN_OFFLINE 已覆盖：公开课程表格提供课程名、天数、价格、地点、开课时间。",
                "OPEN_ONLINE 暂未覆盖为有效记录：源站存在线上 tab，但当前抽样未发现带明确线上公开课入口的可导入课程。",
                "INTERNAL 已覆盖为咨询式内训方案：企业内训页无逐条课程目录，系列解决方案按 INTERNAL 输出并标记面议、无排期。",
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
    append_diagnostic(record, "duration_days", "source_solution_has_no_fixed_duration")
    enrich_course_record(record, fallback_type="INTERNAL")
    record["type"] = "INTERNAL"
    record["raw_json"]["type_evidence"] = "champconsult_solution_or_internal_training_entry"
    record["raw_json"]["content_type"] = "COURSE"
    return record


def discover_open_items(limit: int) -> list[dict[str, str]]:
    items = parse_open_list_rows(fetch_text(HOME_URL))
    if len(items) < limit:
        seen = {f"{item['source_course_id']}:{item.get('city')}:{item.get('date_text')}" for item in items}
        for item in parse_open_list_rows(fetch_text(OPEN_LIST_URL)):
            key = f"{item['source_course_id']}:{item.get('city')}:{item.get('date_text')}"
            if key in seen:
                continue
            seen.add(key)
            items.append(item)
            if len(items) >= limit:
                break
    return items[:limit]


def discover_internal_items(limit: int) -> list[dict[str, str]]:
    homepage_items = parse_internal_solution_links(fetch_text(HOME_URL))
    if homepage_items:
        return homepage_items[:limit]
    return parse_internal_solution_links(fetch_text(INTERNAL_URL))[:limit]


def parse_open_detail(item: dict[str, str]) -> Dict[str, Any]:
    return parse_open_detail_html(item, fetch_text(item["url"]))


def parse_internal_detail(item: dict[str, str]) -> Dict[str, Any]:
    return parse_internal_detail_html(item, fetch_text(item["url"]))


def iter_champconsult_courses(max_items: int | None = None):
    limit = max_items or 100
    open_quota = max(1, (limit + 1) // 2)
    internal_quota = max(1, limit - open_quota)
    candidates = discover_open_items(open_quota) + discover_internal_items(internal_quota)
    seen: set[str] = set()
    for item in candidates[:limit]:
        key = f"{item.get('source_entry')}:{item.get('source_course_id')}:{item.get('city')}:{item.get('date_text')}"
        if key in seen:
            continue
        seen.add(key)
        try:
            record = parse_internal_detail(item) if item.get("source_entry") == "internal_solution_link" else parse_open_detail(item)
            if record.get("raw_json", {}).get("content_type") in {"RECORDED_VIDEO", "DOCUMENT", "AUDIO", "ARTICLE"}:
                continue
            yield record
        except Exception as exc:
            logger.warning("champconsult course detail failed, skip url=%s error=%s", item.get("url"), exc)
        time.sleep(0.1)


def crawl_champconsult_courses(max_items: int | None = None) -> List[Dict[str, Any]]:
    return list(iter_champconsult_courses(max_items))


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class ChampconsultCourseSpider:
    """冠卓顾问课程爬虫适配器，供 JobManager 调用。"""

    name = "champconsult_course"
    source = "champconsult"
    data_type = "COURSE"
    max_items = None
    supported_course_types = ("OPEN_OFFLINE", "INTERNAL")
    coverage_note = (
        "公开课程可抓取 OPEN_OFFLINE；企业内训页无逐条课程目录，系列解决方案按 INTERNAL 咨询式方案抓取；"
        "线上 tab 当前未发现可确认的线上公开课入口。"
    )

    def pause(self) -> None:
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_champconsult_courses(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
