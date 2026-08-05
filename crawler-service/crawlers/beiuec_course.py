"""上海倍跃公开课程爬虫适配器。"""
import asyncio
import logging
import re
import ssl
import time
import urllib.request
from datetime import datetime
from html import unescape
from typing import Any, AsyncGenerator, Dict, List
from urllib.parse import urljoin

from crawlers.course_utils import append_diagnostic, enrich_course_record, set_price_fields
from crawlers.rich_content import apply_syllabus_rich_content


BASE_URL = "http://www.beiuec.com"
LIST_URL = f"{BASE_URL}/courses.asp?did=2"
TRAINING_URL = f"{BASE_URL}/training.asp"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
MISSING = "暂无"
logger = logging.getLogger(__name__)

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

CITY_PROVINCES = {
    "上海": ("上海市", "上海市"),
    "苏州": ("江苏省", "苏州市"),
    "青岛": ("山东省", "青岛市"),
    "深圳": ("广东省", "深圳市"),
    "杭州": ("浙江省", "杭州市"),
    "天津": ("天津市", "天津市"),
    "南京": ("江苏省", "南京市"),
    "大连": ("辽宁省", "大连市"),
    "成都": ("四川省", "成都市"),
}


def fetch_text(url: str, timeout: int = 15, retries: int = 2) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            kwargs: dict[str, Any] = {"timeout": timeout}
            if url.startswith("https://"):
                kwargs["context"] = SSL_CTX
            with urllib.request.urlopen(req, **kwargs) as resp:
                raw = resp.read()
                charset = resp.headers.get_content_charset() or "gb18030"
                return raw.decode(charset, errors="ignore")
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
    return " ".join(text.split()) or default


def absolute_url(value: str) -> str:
    return urljoin(BASE_URL + "/", value or "")


def source_id_from_url(url: str) -> str:
    match = re.search(r"id=(\d+)", url)
    return match.group(1) if match else url


def normalize_city(city: Any) -> dict[str, str]:
    raw = clean_html(city)
    if not raw:
        return {}
    province, city_name = CITY_PROVINCES.get(raw, ("", raw if raw.endswith("市") else f"{raw}市"))
    data = {
        "city": city_name,
        "city_name_raw": city_name,
        "location": raw,
        "address": raw,
        "sourceLocationText": raw,
    }
    if province:
        data["province_name_raw"] = province
        data["province"] = province
    return data


def parse_date_range(value: Any) -> tuple[str, str, str]:
    text = clean_html(value)
    match = re.search(r"(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})(?:日)?(?:[-—至到](\d{1,2}))?日?", text)
    if not match:
        return "", "", text
    year, month, start_day, end_day = match.groups()
    start = f"{int(year):04d}-{int(month):02d}-{int(start_day):02d}"
    end = f"{int(year):04d}-{int(month):02d}-{int(end_day or start_day):02d}"
    return start, end, text


def parse_duration_days(start: str, end: str) -> int:
    try:
        s = datetime.strptime(start, "%Y-%m-%d").date()
        e = datetime.strptime(end, "%Y-%m-%d").date()
        return max(1, (e - s).days + 1)
    except Exception:
        return 0


def extract_between(text: str, start_labels: tuple[str, ...], stop_labels: tuple[str, ...], limit: int = 3000) -> str:
    starts = [(text.find(label), label) for label in start_labels if text.find(label) >= 0]
    if not starts:
        return MISSING
    pos, label = min(starts, key=lambda item: item[0])
    segment = text[pos + len(label):].strip(" ：:")
    stops = [segment.find(stop) for stop in stop_labels if segment.find(stop) > 0]
    if stops:
        segment = segment[: min(stops)]
    return clean_html(segment, MISSING)[:limit] or MISSING


def extract_detail_html(html: str) -> str:
    anchors = ["日期", "价格", "地点", "课程目标", "培训对象", "课程大纲"]
    positions = [html.find(anchor) for anchor in anchors if html.find(anchor) >= 0]
    start = min(positions) if positions else 0
    end = len(html)
    for stop in ("版权所有", "联系电话", "Copyright"):
        pos = html.find(stop, start + 1)
        if pos > start:
            end = min(end, pos)
    return html[start:end]


def parse_list_rows(html: str, limit: int | None = None) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for row_html in re.findall(r"<tr[^>]*>([\s\S]*?)</tr>", html, flags=re.I):
        if "details.asp?id=" not in row_html:
            continue
        cells = [clean_html(cell) for cell in re.findall(r"<td[^>]*>([\s\S]*?)</td>", row_html, flags=re.I)]
        link = re.search(r'<a[^>]+href=["\']([^"\']*details\.asp\?id=\d+)["\'][^>]*>([\s\S]*?)</a>', row_html, flags=re.I)
        if not link:
            continue
        title = clean_html(link.group(2))
        url = absolute_url(link.group(1))
        date_text = next((cell for cell in cells if re.search(r"\d{4}年", cell)), "")
        price_raw = next((cell for cell in cells if "元" in cell), "")
        start, end, source_date = parse_date_range(date_text)
        duration_days = parse_duration_days(start, end)
        rows.append(
            {
                "source_course_id": source_id_from_url(url),
                "source_url": url,
                "url": url,
                "title": title,
                "date_text": source_date,
                "price_raw": price_raw,
                "duration_days": duration_days,
                "type": "OPEN_OFFLINE",
                "source_entry": "courses.asp?did=2",
                "plans_json": [
                    {
                        "startDate": start,
                        "start_date": start,
                        "endDate": end,
                        "end_date": end,
                        "startTime": start,
                        "endTime": end,
                        "sourceDateText": source_date,
                        "priceRaw": price_raw,
                        "signupUrl": absolute_url(f"message.asp?id={source_id_from_url(url)}"),
                        "type": "OFFLINE",
                    }
                ],
            }
        )
        if limit and len(rows) >= limit:
            break
    return rows


def parse_detail_html(item: dict[str, Any], html: str) -> Dict[str, Any]:
    text = clean_html(html)
    title_match = re.search(r"<title[^>]*>([\s\S]*?)</title>", html, flags=re.I)
    title = clean_html(title_match.group(1)).replace("|", "").strip() if title_match else item.get("title", MISSING)
    date_text = extract_between(text, ("日期",), ("价格", "地点", "课程目标"), 120)
    price_raw = extract_between(text, ("价格",), ("地点", "课程目标"), 120)
    location = extract_between(text, ("地点",), ("课程目标", "培训对象", "课程大纲"), 160)
    start, end, source_date = parse_date_range(date_text if date_text != MISSING else item.get("date_text"))
    if not start:
        start, end, source_date = parse_date_range(item.get("date_text"))
    plan = {
        "startDate": start,
        "start_date": start,
        "endDate": end,
        "end_date": end,
        "startTime": start,
        "endTime": end,
        "sourceDateText": source_date,
        "priceRaw": price_raw if price_raw != MISSING else item.get("price_raw"),
        "signupUrl": absolute_url(f"message.asp?id={item.get('source_course_id')}"),
        "type": "OFFLINE",
    }
    plan.update(normalize_city(location if location != MISSING else ""))
    audience = extract_between(text, ("培训对象",), ("课程大纲", "版权所有"), 1200)
    outcomes = extract_between(text, ("课程目标",), ("培训对象", "课程大纲"), 1500)
    syllabus = extract_between(text, ("课程大纲",), ("版权所有", "联系电话"), 5000)
    if outcomes == MISSING or outcomes.startswith("培训对象"):
        derived = re.split(r"第一[讲章节部分]|一、|1[、. ]", syllabus, maxsplit=1)[0].strip(" ，,")
        if len(derived) >= 12:
            outcomes = derived[:1500]
    record: Dict[str, Any] = {
        "source_course_id": item.get("source_course_id"),
        "source_url": item.get("source_url"),
        "title": title or item.get("title"),
        "type": "OPEN_OFFLINE",
        "category_name_raw": "EHS公开课程",
        "cover_url": "",
        "intro": outcomes,
        "summary": outcomes[:500] if outcomes != MISSING else "",
        "syllabus": syllabus,
        "audience": audience,
        "target_audience": "",
        "learning_outcomes": outcomes,
        "highlights": "",
        "duration_days": parse_duration_days(start, end),
        "total_hours": 0,
        "original_price": 0,
        "keywords": "EHS,公开课程",
        "trainer_name_raw": "",
        "plans_json": [{k: v for k, v in plan.items() if v not in {"", None, MISSING}}],
        "services_json": [],
        "raw_json": {
            "source_entry": item.get("source_entry"),
            "content_type": "COURSE",
            "price_raw": price_raw if price_raw != MISSING else item.get("price_raw"),
            "type_evidence": "beiuec course list/detail contains date, price and offline location",
            "field_sources": {
                "plans_json": "公开课程列表和详情页日期/地点",
                "price": "公开课程列表和详情页价格",
                "audience": "详情页培训对象",
                "learning_outcomes": "详情页课程目标",
                "syllabus": "详情页课程大纲",
            },
            "coverage_notes": coverage_notes(),
            "diagnostics": [],
        },
    }
    apply_syllabus_rich_content(
        record,
        extract_detail_html(html),
        plain_text="" if record["syllabus"] == MISSING else record["syllabus"],
        base_url=BASE_URL,
    )
    set_price_fields(record, record["raw_json"]["price_raw"])
    if not record["plans_json"][0].get("province_name_raw"):
        append_diagnostic(record, "plans_json.province_name_raw", "source_location_needs_manual_province_mapping", location)
    if audience == MISSING:
        append_diagnostic(record, "audience", "source_detail_audience_missing")
    if outcomes == MISSING:
        append_diagnostic(record, "learning_outcomes", "source_detail_outcomes_missing")
    enrich_course_record(record, fallback_type="OPEN_OFFLINE")
    record["type"] = "OPEN_OFFLINE"
    return record


def coverage_notes() -> list[str]:
    return [
        "OPEN_OFFLINE 已覆盖：公开课程表提供课程名称、日期、价格、报名链接，详情页提供地点、培训对象、课程目标和课程大纲。",
        "INTERNAL 未导入：企业内训栏目当前主要是内训流程/需求登记，不是可直接入 courses 的具体课程库。",
        "OPEN_ONLINE 未覆盖：源站未发现明确线上公开课或直播课排期。",
    ]


def iter_beiuec_courses(max_items: int | None = None):
    rows = parse_list_rows(fetch_text(LIST_URL), limit=max_items)
    for row in rows:
        try:
            html = fetch_text(row["url"])
            yield parse_detail_html(row, html)
        except Exception as exc:
            logger.warning("beiuec detail failed url=%s error=%s", row.get("url"), exc)
        time.sleep(0.1)


def crawl_beiuec_courses(max_items: int | None = None) -> List[Dict[str, Any]]:
    return list(iter_beiuec_courses(max_items))


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class BeiuecCourseSpider:
    name = "beiuec_course"
    source = "beiuec"
    data_type = "COURSE"
    max_items = None
    supported_course_types = ("OPEN_OFFLINE",)
    coverage_note = "公开课程表覆盖 OPEN_OFFLINE；企业内训栏目只有流程/需求登记，线上课未发现。"

    def pause(self) -> None:
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_beiuec_courses(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
