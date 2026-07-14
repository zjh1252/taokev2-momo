"""上海强思企管课程爬虫适配器。"""
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
from crawlers.media import media_asset, normalize_url
from crawlers.rich_content import apply_syllabus_rich_content


BASE_URL = "http://www.shchance.com.cn"
LIST_URL = f"{BASE_URL}/home/course"
ONLINE_SCHOOL_URL = f"{BASE_URL}/home/page/3"
INTERNAL_CATALOG_URL = f"{BASE_URL}/home/nxml"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
MISSING = "暂无"
logger = logging.getLogger(__name__)

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE


def fetch_text(url: str, timeout: int = 15, retries: int = 3) -> str:
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
            time.sleep(0.3 * attempt)
    raise RuntimeError(f"request failed after {retries} retries: {url}; {last_error}")


def clean_html(value: Any, default: str = "") -> str:
    if value is None:
        return default
    text = str(value)
    text = re.sub(r"<script[\s\S]*?</script>", " ", text, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = " ".join(unescape(text).replace("&nbsp;", " ").split())
    return text or default


def absolute_url(value: str) -> str:
    return normalize_url(BASE_URL, value)


def source_id_from_url(url: str) -> str:
    match = re.search(r"/home/coursedetail/(\d+)", url)
    return match.group(1) if match else url.rstrip("/").rsplit("/", 1)[-1]


def meta_content(html: str, name: str) -> str:
    match = re.search(
        rf'<meta[^>]+name=["\']{re.escape(name)}["\'][^>]+content=["\'](.*?)["\']',
        html,
        flags=re.I | re.S,
    )
    return clean_html(match.group(1), MISSING) if match else MISSING


def extract_category_links(html: str) -> list[tuple[str, str]]:
    links: list[tuple[str, str]] = []
    seen: set[str] = set()
    for href, label in re.findall(r'<a[^>]+href=["\']([^"\']*?/home/course\?categoryid=\d+[^"\']*)["\'][^>]*>(.*?)</a>', html, flags=re.I | re.S):
        name = clean_html(label)
        url = absolute_url(href.replace("&amp;", "&"))
        if not name or url in seen:
            continue
        seen.add(url)
        links.append((url, name))
    return links


def extract_list_rows(html: str, category_name: str = "") -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    tbody_match = re.search(r"<tbody>([\s\S]*?)</tbody>", html, flags=re.I)
    tbody = tbody_match.group(1) if tbody_match else html
    for row_html in re.findall(r"<tr[^>]*>([\s\S]*?)</tr>", tbody, flags=re.I):
        cells = re.findall(r"<td[^>]*>([\s\S]*?)</td>", row_html, flags=re.I)
        if len(cells) < 4:
            continue
        link_match = re.search(r'<a[^>]+href=["\']([^"\']*?/home/coursedetail/\d+)["\'][^>]*>(.*?)</a>', cells[0], flags=re.I | re.S)
        if not link_match:
            continue
        signup_match = re.search(r'<a[^>]+href=["\']([^"\']*?/home/appointment\?courseid=\d+)["\']', row_html, flags=re.I)
        url = absolute_url(link_match.group(1))
        rows.append(
            {
                "url": url,
                "source_course_id": source_id_from_url(url),
                "title": clean_html(link_match.group(2), MISSING),
                "date_text": clean_html(cells[1]),
                "city": clean_html(cells[2]),
                "price_raw": clean_html(cells[3]),
                "signup_url": absolute_url(signup_match.group(1)) if signup_match else "",
                "category_name_raw": category_name,
                "source_entry": "open_offline_list",
            }
        )
    return rows


def discover_course_items(max_items: int | None = None) -> list[dict[str, str]]:
    limit = max_items or 100
    first_html = fetch_text(LIST_URL)
    category_links = extract_category_links(first_html)
    category_by_id: dict[str, str] = {}
    discovered: list[dict[str, str]] = []
    seen: set[str] = set()

    # 分类页能给出更准确的源站分类；先建立详情 URL -> 分类名的映射。
    for category_url, category_name in category_links:
        try:
            category_html = fetch_text(category_url, timeout=10, retries=2)
        except Exception as exc:
            logger.warning("shchance category page failed: url=%s error=%s", category_url, exc)
            continue
        for row in extract_list_rows(category_html, category_name):
            category_by_id.setdefault(row["source_course_id"], category_name)
        time.sleep(0.05)

    for row in extract_list_rows(first_html):
        key = row["source_course_id"]
        if key in seen:
            continue
        seen.add(key)
        row["category_name_raw"] = category_by_id.get(key, row.get("category_name_raw") or "线下公开课")
        discovered.append(row)
        if len(discovered) >= limit:
            return discovered

    # 首页排期不够时，再从分类页补足，仍保留分类语义。
    for category_url, category_name in category_links:
        if len(discovered) >= limit:
            break
        try:
            category_html = fetch_text(category_url, timeout=10, retries=2)
        except Exception:
            continue
        for row in extract_list_rows(category_html, category_name):
            key = row["source_course_id"]
            if key in seen:
                continue
            seen.add(key)
            discovered.append(row)
            if len(discovered) >= limit:
                break
    return discovered


def parse_date_range(value: str) -> tuple[str, str]:
    text = clean_html(value)
    match = re.search(r"(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s*-\s*(?:(\d{4})年)?(\d{1,2})月(\d{1,2})日)?", text)
    if not match:
        return "", ""
    year, month, day, end_year, end_month, end_day = match.groups()
    start = f"{int(year):04d}-{int(month):02d}-{int(day):02d}"
    if end_month and end_day:
        end = f"{int(end_year or year):04d}-{int(end_month):02d}-{int(end_day):02d}"
    else:
        end = start
    return start, end


def parse_duration_days(date_text: str, detail_text: str = "") -> int:
    detail_match = re.search(r"(?:天数|培训天数)[：:\s]*(\d+)", detail_text)
    if detail_match:
        return int(detail_match.group(1))
    start, end = parse_date_range(date_text)
    if start and end:
        try:
            start_dt = datetime.strptime(start, "%Y-%m-%d").date()
            end_dt = datetime.strptime(end, "%Y-%m-%d").date()
            return max(1, (end_dt - start_dt).days + 1)
        except ValueError:
            return 0
    return 0


def parse_schedule_table(html: str) -> dict[str, str]:
    table_match = re.search(r'<div class="indexgkk2">([\s\S]*?)</div>\s*<div class="clear"', html, flags=re.I)
    table_html = table_match.group(1) if table_match else ""
    rows = re.findall(r"<tr[^>]*>([\s\S]*?)</tr>", table_html, flags=re.I)
    if len(rows) < 2:
        return {}
    headers = [clean_html(cell) for cell in re.findall(r"<th[^>]*>([\s\S]*?)</th>", rows[0], flags=re.I)]
    values = [clean_html(cell) for cell in re.findall(r"<td[^>]*>([\s\S]*?)</td>", rows[1], flags=re.I)]
    if not headers or not values:
        return {}
    return {headers[index]: values[index] for index in range(min(len(headers), len(values)))}


SECTION_LABELS = (
    "课程目标",
    "培训目标",
    "课程收益",
    "培训收益",
    "参训对象",
    "培训对象",
    "适合对象",
    "授课形式",
    "课程大纲",
    "课程内容",
    "证书",
)


def extract_content_html(html: str) -> str:
    matches = re.findall(r'<div class="neirong1"[^>]*>([\s\S]*?)</div>\s*</div>', html, flags=re.I)
    if matches:
        return max(matches, key=len)
    start = html.find('<div class="neirong1">')
    if start < 0:
        return ""
    end = html.find('<div class="clear"></div><!--copy-->', start)
    return html[start:end] if end > start else html[start:]


def extract_section(detail_text: str, aliases: Iterable[str], limit: int = 1200) -> str:
    positions: list[tuple[int, str]] = []
    for alias in aliases:
        for match in re.finditer(re.escape(alias), detail_text):
            positions.append((match.start(), alias))
    if not positions:
        return MISSING
    start, alias = min(positions, key=lambda item: item[0])
    segment = detail_text[start + len(alias):].lstrip(" ：:;；、，,.-")
    stop_positions = []
    for label in SECTION_LABELS:
        if label in aliases:
            continue
        pos = segment.find(label)
        if pos > 0:
            stop_positions.append(pos)
    if stop_positions:
        segment = segment[: min(stop_positions)]
    return segment.strip(" ：:;；、，,.-")[:limit] or MISSING


def extract_pdf_assets(html: str, title: str) -> list[dict[str, str]]:
    assets: list[dict[str, str]] = []
    for href, label in re.findall(r'<a[^>]+href=["\']([^"\']+\.pdf[^"\']*)["\'][^>]*>(.*?)</a>', html, flags=re.I | re.S):
        url = absolute_url(href)
        label_text = clean_html(label) or "完整课程大纲"
        assets.append(media_asset("syllabus_pdf", url, f"{title}-{label_text}"))
    return assets


def build_plan(item: dict[str, str], duration_days: int) -> dict[str, Any]:
    start_date, end_date = parse_date_range(item.get("date_text", ""))
    city = item.get("city") or ""
    plan: dict[str, Any] = {
        "startDate": start_date,
        "start_date": start_date,
        "endDate": end_date,
        "end_date": end_date,
        "city": city,
        "location": city,
        "address": city,
        "signupUrl": item.get("signup_url") or item.get("url") or "",
        "sourceDateText": item.get("date_text") or "",
        "sourceLocationText": city,
    }
    if duration_days > 0:
        plan["durationDays"] = duration_days
    return {key: value for key, value in plan.items() if value not in {"", None}}


def parse_course_detail_html(item: dict[str, str], html: str) -> Dict[str, Any]:
    url = item["url"]
    title_match = re.search(r'<h1[^>]+class=["\']biaoti1["\'][^>]*>(.*?)</h1>', html, flags=re.I | re.S)
    title = clean_html(title_match.group(1), item.get("title") or MISSING) if title_match else item.get("title", MISSING)
    schedule = parse_schedule_table(html)
    content_html = extract_content_html(html)
    detail_text = clean_html(content_html, "")
    page_text = clean_html(html, "")
    duration_days = int(schedule.get("天数", "0")) if str(schedule.get("天数", "")).isdigit() else 0
    if duration_days <= 0:
        duration_days = parse_duration_days(item.get("date_text", ""), detail_text)
    plan = build_plan(item, duration_days)
    price_raw = item.get("price_raw") or schedule.get("价格") or MISSING
    assets = extract_pdf_assets(html, title)
    learning_outcomes = extract_section(detail_text, ("课程目标", "培训目标", "课程收益", "培训收益"))
    audience = extract_section(detail_text, ("参训对象", "培训对象", "适合对象"))
    teaching_form = extract_section(detail_text, ("授课形式",))
    summary = meta_content(html, "description")
    if summary == MISSING:
        summary = learning_outcomes if learning_outcomes != MISSING else detail_text[:300]

    record: Dict[str, Any] = {
        "source_course_id": item.get("source_course_id") or source_id_from_url(url),
        "source_url": url,
        "title": title,
        "type": "OPEN_OFFLINE",
        "category_name_raw": item.get("category_name_raw") or "线下公开课",
        "cover_url": "",
        "intro": summary,
        "summary": summary[:500],
        "syllabus": detail_text or (f"完整课程大纲：{assets[0]['url']}" if assets else MISSING),
        "audience": audience,
        "target_audience": audience if audience != MISSING else "",
        "learning_outcomes": learning_outcomes,
        "highlights": teaching_form if teaching_form != MISSING else learning_outcomes,
        "duration_days": duration_days,
        "total_hours": duration_days * 6 if duration_days else 0,
        "original_price": 0,
        "keywords": " ".join(part for part in [item.get("category_name_raw", ""), "线下公开课", item.get("city", "")] if part),
        "trainer_name_raw": MISSING,
        "plans_json": [plan] if plan.get("startDate") else [],
        "services_json": assets,
        "raw_json": {
            "source_entry": "open_offline_list",
            "source_entry_name": "线下公开课",
            "source_date_text": item.get("date_text", ""),
            "source_city_text": item.get("city", ""),
            "source_signup_url": item.get("signup_url", ""),
            "source_schedule_table": schedule,
            "content_type": detect_content_type(page_text, title),
            "type_evidence": "shchance_offline_public_course_list_has_date_city_price",
            "category_evidence": "category page mapping" if item.get("category_name_raw") != "线下公开课" else "fallback open course list",
            "plan_evidence": item.get("date_text", "") + " " + item.get("city", ""),
            "field_sources": {
                "plans_json": "list row date/city/signup link",
                "learning_outcomes": "detail 课程目标/培训目标/课程收益",
                "audience": "detail 参训对象/培训对象/适合对象",
                "syllabus": "detail body and syllabus pdf link",
                "services_json": "detail pdf links",
            },
            "coverage_notes": [
                "在线学堂页面包含直播/录播/线上学习内容，当前 courses 流程不采录播，故不输出在线学堂条目。",
                "定制内训入口为企业定制需求表单，未发现可逐条导入 courses 的内训课程目录，故不伪造 INTERNAL 课程。",
            ],
            "diagnostics": [],
        },
    }
    apply_syllabus_rich_content(
        record,
        content_html,
        plain_text="" if record["syllabus"] == MISSING else record["syllabus"],
        base_url=BASE_URL,
    )
    set_price_fields(record, price_raw)
    if not plan.get("address") or plan.get("address") == item.get("city"):
        append_diagnostic(record, "plans_json.address", "source_only_provides_city_no_street_address", item.get("city", ""))
    if not assets:
        append_diagnostic(record, "services_json", "missing_syllabus_pdf")
    enrich_course_record(record, fallback_type="OPEN_OFFLINE")
    record["type"] = "OPEN_OFFLINE"
    record["raw_json"]["type_evidence"] = "shchance_offline_public_course_list_has_date_city_price"
    record["raw_json"]["content_type"] = "COURSE"
    return record


def parse_course_detail(item: dict[str, str]) -> Dict[str, Any]:
    return parse_course_detail_html(item, fetch_text(item["url"]))


def iter_shchance_courses(max_items: int | None = None):
    items = discover_course_items(max_items)
    seen: set[str] = set()
    for item in items:
        key = item["source_course_id"]
        if key in seen:
            continue
        seen.add(key)
        try:
            record = parse_course_detail(item)
            if record.get("raw_json", {}).get("content_type") in {"RECORDED_VIDEO", "DOCUMENT", "AUDIO"}:
                continue
            yield record
        except Exception as exc:
            logger.warning("shchance course detail failed, skip url=%s error=%s", item.get("url"), exc)
        time.sleep(0.1)


def crawl_shchance_courses(max_items: int | None = None) -> List[Dict[str, Any]]:
    return list(iter_shchance_courses(max_items))


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class ShchanceCourseSpider:
    """上海强思企管课程爬虫适配器，供 JobManager 调用。"""

    name = "shchance_course"
    source = "shchance"
    data_type = "COURSE"
    max_items = None
    supported_course_types = ("OPEN_OFFLINE",)
    coverage_note = "源站线下公开课可抓取；在线学堂含直播/录播，不进入当前 courses 流程；定制内训未发现逐条课程目录。"

    def pause(self) -> None:
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_shchance_courses(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
