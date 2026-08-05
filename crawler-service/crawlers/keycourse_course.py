"""睿选优课课程爬虫适配器。"""
import asyncio
import json
import logging
import re
import ssl
import time
import urllib.request
from datetime import date, datetime
from html import unescape
from typing import Any, AsyncGenerator, Dict, Iterable, List
from urllib.parse import urljoin

from crawlers.course_utils import append_diagnostic, enrich_course_record, set_price_fields
from crawlers.rich_content import apply_syllabus_rich_content


BASE_URL = "https://www.keycourse.com"
LIST_API = f"{BASE_URL}/product/getProductQueryList"
LABEL_API = f"{BASE_URL}/product/getProductQueryLabel"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
MISSING = "暂无"
logger = logging.getLogger(__name__)

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

CITY_PROVINCES = {
    "北京": ("北京市", "北京市"),
    "上海": ("上海市", "上海市"),
    "天津": ("天津市", "天津市"),
    "重庆": ("重庆市", "重庆市"),
    "广州": ("广东省", "广州市"),
    "深圳": ("广东省", "深圳市"),
    "苏州": ("江苏省", "苏州市"),
    "南京": ("江苏省", "南京市"),
    "昆山": ("江苏省", "昆山市"),
    "无锡": ("江苏省", "无锡市"),
    "杭州": ("浙江省", "杭州市"),
    "宁波": ("浙江省", "宁波市"),
    "成都": ("四川省", "成都市"),
    "合肥": ("安徽省", "合肥市"),
}

SECTION_STOPS = (
    "课程收益",
    "培训对象",
    "培训时间",
    "课程特色及授课方式",
    "课程大纲",
    "开课安排",
    "睿选观点",
    "课程介绍",
    "课程价格",
    "索取课纲",
    "预约报名",
    "课后资料",
)


def fetch_text(url: str, timeout: int = 25, retries: int = 3) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout, context=SSL_CTX) as resp:
                return resp.read().decode(resp.headers.get_content_charset() or "utf-8", errors="ignore")
        except Exception as exc:
            last_error = exc
            if attempt >= retries:
                break
            time.sleep(0.4 * attempt)
    raise RuntimeError(f"request failed after {retries} retries: {url}; {last_error}")


def post_json(url: str, payload: dict[str, Any], timeout: int = 25, retries: int = 3) -> dict[str, Any]:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "User-Agent": UA,
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Content-Type": "application/json;charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": f"{BASE_URL}/product/productClassInfo",
        },
    )
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout, context=SSL_CTX) as resp:
                text = resp.read().decode(resp.headers.get_content_charset() or "utf-8", errors="ignore")
            data = json.loads(text)
            if not isinstance(data, dict):
                raise RuntimeError(f"unexpected json response: {type(data)}")
            return data
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


def absolute_url(value: Any) -> str:
    text = str(value or "")
    if not text:
        return ""
    return urljoin(BASE_URL + "/", text)


def source_id_from_item(item: dict[str, Any]) -> str:
    product_id = item.get("productId")
    return str(product_id) if product_id is not None else str(item.get("productName") or "")


def detail_url(product_id: Any) -> str:
    return f"{BASE_URL}/product/productDetail/{product_id}"


def parse_duration_days(*values: Any) -> int:
    text = " ".join(clean_html(value) for value in values if value)
    if not text:
        return 0
    match = re.search(r"(\d+(?:\.\d+)?)\s*天", text)
    if match:
        return max(1, int(float(match.group(1))))
    match = re.search(r"(\d+(?:\.\d+)?)\s*分钟", text)
    if match:
        minutes = float(match.group(1))
        return max(1, round(minutes / 360))
    return 0


def parse_total_hours(*values: Any) -> float:
    text = " ".join(clean_html(value) for value in values if value)
    match = re.search(r"(\d+(?:\.\d+)?)\s*分钟", text)
    if match:
        return round(float(match.group(1)) / 60, 1)
    days = parse_duration_days(text)
    return float(days * 6) if days else 0.0


def normalize_city(city: Any) -> dict[str, str]:
    raw = clean_html(city)
    if not raw:
        return {}
    short = raw.replace("市", "")
    province, city_name = CITY_PROVINCES.get(short, ("", raw if raw.endswith("市") else f"{raw}市"))
    result = {
        "city": city_name,
        "city_name_raw": city_name,
        "location": raw,
        "address": raw,
        "sourceLocationText": raw,
    }
    if province:
        result["province"] = province
        result["province_name_raw"] = province
    return result


def parse_plans(item: dict[str, Any], source_url: str) -> list[dict[str, Any]]:
    plans: list[dict[str, Any]] = []
    for plan in item.get("courseOutList") or []:
        if not isinstance(plan, dict):
            continue
        start = clean_html(plan.get("startTimeStr"))
        end = clean_html(plan.get("endTimeStr"))
        city = clean_html(plan.get("courseCity"))
        parsed: dict[str, Any] = {
            "startDate": start,
            "start_date": start,
            "endDate": end,
            "end_date": end,
            "startTime": start,
            "endTime": end,
            "sourceDateText": f"{start} 至 {end}".strip(" 至"),
            "priceRaw": plan.get("coursePrice"),
            "signupUrl": source_url,
            "type": "OFFLINE",
            "status": clean_html(plan.get("courseFlag")),
        }
        parsed.update(normalize_city(city))
        plans.append({key: value for key, value in parsed.items() if value not in {"", None}})
    return plans


def extract_title(html: str, fallback: str = MISSING) -> str:
    text = clean_html(html)
    marker = "最新课程安排表 选课中心"
    if marker in text:
        tail = text.split(marker, 1)[1]
        match = re.search(r"(?:面授课|职业认证|在线课程)\s+.+?\s+([^ ]{4,120}?)\s+\1\s+课程时长", tail)
        if match:
            return clean_html(match.group(1), fallback)
    match = re.search(r"<h1[^>]*>([\s\S]*?)</h1>", html, flags=re.I)
    if match:
        return clean_html(match.group(1), fallback)
    return fallback


def extract_detail_text(html: str) -> str:
    text = clean_html(html)
    marker = "最新课程安排表 选课中心"
    if marker in text:
        text = text.split(marker, 1)[1]
    for stop in ("相关推荐", "热门好课", "加入我们", "关于睿选优课", "Copyright"):
        pos = text.find(stop)
        if pos > 800:
            text = text[:pos]
    return text


def extract_detail_html(html: str) -> str:
    if not html:
        return ""
    marker = "最新课程安排表 选课中心"
    start = html.find(marker)
    if start < 0:
        start = 0
    end = len(html)
    for stop in ("相关推荐", "热门好课", "加入我们", "关于睿选优课", "Copyright"):
        pos = html.find(stop, start + 1)
        if pos > start:
            end = min(end, pos)
    return html[start:end]


def extract_between(text: str, aliases: Iterable[str], limit: int = 2000) -> str:
    starts: list[tuple[int, str]] = []
    for alias in aliases:
        pos = text.find(alias)
        if pos >= 0:
            starts.append((pos, alias))
    if not starts:
        return MISSING
    pos, alias = min(starts, key=lambda item: item[0])
    segment = text[pos + len(alias):].lstrip(" ：:")
    stops = []
    for stop in SECTION_STOPS:
        if stop in aliases:
            continue
        stop_pos = segment.find(stop)
        if stop_pos > 0:
            stops.append(stop_pos)
    if stops:
        segment = segment[: min(stops)]
    segment = segment.strip(" ：:")
    return segment[:limit] or MISSING


def extract_inline_value(text: str, label: str, limit: int = 200) -> str:
    pattern = rf"{re.escape(label)}\s*[：:]\s*([\s\S]{{1,{limit}}})"
    match = re.search(pattern, text)
    if not match:
        return MISSING
    value = match.group(1)
    stops = ["课程价格", "培训对象", "索取课纲", "预约报名", "课后资料", "课程介绍", "课程大纲"]
    for stop in stops:
        pos = value.find(stop)
        if pos > 0:
            value = value[:pos]
    return clean_html(value, MISSING).strip(" ：:")[:limit] or MISSING


def extract_syllabus(text: str) -> str:
    value = extract_between(text, ("课程大纲",), 5000)
    if value != MISSING and len(value) > 20 and value not in {"开课安排", "课程介绍 开课安排"} and not value.startswith("开课安排"):
        return value
    markers = ["导论", "第一模块", "第一讲", "第一部分", "模块一", "（一）", "(一)", "一、", "1."]
    positions = [text.find(marker) for marker in markers if text.find(marker) >= 0]
    if not positions:
        return MISSING
    segment = text[min(positions):]
    stops = []
    for stop in (
        "开课安排",
        "睿选观点",
        "索取课纲",
        "预约报名",
        "课后资料",
        "城市 天数 价格",
        "注册获取课程计划",
        "相关课程",
        "最新公开课计划表",
    ):
        pos = segment.find(stop)
        if pos > 20:
            stops.append(pos)
    if stops:
        segment = segment[: min(stops)]
    segment = clean_html(segment, MISSING)[:5000]
    return segment if segment not in {"开课安排", "课程介绍 开课安排"} and not segment.startswith("开课安排") else MISSING


def extract_category(text: str, item: dict[str, Any]) -> str:
    title = clean_html(item.get("productName"), "")
    form = clean_html(item.get("teachingForm"))
    form_text = "职业认证" if form == "PRO" else "面授课"
    if title and title in text:
        before = text.split(title, 1)[0]
        if form_text in before:
            crumbs = before.split(form_text, 1)[1].strip().split()
            if crumbs:
                return " / ".join([form_text] + crumbs[-2:])
    return form_text


def build_record_from_item(item: dict[str, Any], html: str | None = None) -> Dict[str, Any]:
    product_id = source_id_from_item(item)
    url = detail_url(product_id)
    text = extract_detail_text(html or "")
    title = extract_title(html or "", clean_html(item.get("productName"), MISSING))
    category = extract_category(text, item) if text else ("职业认证" if item.get("teachingForm") == "PRO" else "面授课")
    duration_raw = extract_inline_value(text, "课程时长", 80)
    if duration_raw == MISSING:
        duration_raw = clean_html(item.get("trainingDuration"), "")
    price_raw = extract_inline_value(text, "课程价格", 100)
    if price_raw == MISSING:
        price_raw = item.get("coursePrice")
    audience = extract_inline_value(text, "培训对象", 1000)
    if audience == MISSING:
        audience = clean_html(item.get("trainingTarget"), MISSING)
    learning_outcomes = extract_between(text, ("课程收益",), 2000)
    if learning_outcomes == MISSING:
        learning_outcomes = clean_html(item.get("courseProfit"), MISSING)
    intro = extract_between(text, ("睿选观点", "课程介绍"), 1600)
    syllabus = extract_syllabus(text)
    plans = parse_plans(item, url)
    duration_days = parse_duration_days(duration_raw)
    record: Dict[str, Any] = {
        "source_course_id": product_id,
        "source_url": url,
        "title": title,
        "type": "OPEN_OFFLINE",
        "category_name_raw": category,
        "cover_url": absolute_url(item.get("headUrl")),
        "intro": intro,
        "summary": intro[:500] if intro != MISSING else clean_html(item.get("marketingCourseHighlight"), ""),
        "syllabus": syllabus,
        "audience": audience,
        "target_audience": "",
        "learning_outcomes": learning_outcomes,
        "highlights": clean_html(item.get("marketingCourseHighlight"), ""),
        "duration_days": duration_days,
        "total_hours": parse_total_hours(duration_raw),
        "original_price": 0,
        "keywords": category,
        "trainer_name_raw": "",
        "plans_json": plans,
        "services_json": [],
        "raw_json": {
            "source_entry": "product_getProductQueryList",
            "source_entry_name": "睿选优课面授课/职业认证公开课列表",
            "content_type": "COURSE",
            "type_evidence": "teachingForm=FACE/PRO 且 courseOutList 提供线下城市和开课日期",
            "category_evidence": "详情页面包屑或 teachingForm",
            "plan_evidence": "接口 courseOutList.startTimeStr/endTimeStr/courseCity/courseFlag",
            "price_raw": str(price_raw or ""),
            "duration_raw": duration_raw,
            "teachingForm": item.get("teachingForm"),
            "field_sources": {
                "plans_json": "列表接口 courseOutList",
                "price": "列表接口 coursePrice 或详情页课程价格",
                "learning_outcomes": "详情页课程收益或列表接口 courseProfit",
                "audience": "详情页培训对象或列表接口 trainingTarget",
                "syllabus": "详情页课程大纲",
            },
            "coverage_notes": coverage_notes(),
            "diagnostics": [],
        },
    }
    if html:
        apply_syllabus_rich_content(
            record,
            extract_detail_html(html),
            plain_text="" if record["syllabus"] == MISSING else record["syllabus"],
            base_url=BASE_URL,
        )
    set_price_fields(record, price_raw)
    if not plans:
        append_diagnostic(record, "plans_json", "source_public_course_has_no_schedule", item.get("courseOutList"))
    if syllabus == MISSING:
        append_diagnostic(record, "syllabus", "source_detail_syllabus_not_expanded_or_not_visible")
    if intro == MISSING:
        append_diagnostic(record, "intro", "source_detail_intro_not_expanded_or_not_visible")
    for plan in plans:
        if not plan.get("province_name_raw"):
            append_diagnostic(record, "plans_json.province_name_raw", "source_city_needs_manual_province_mapping", plan.get("sourceLocationText"))
        start = plan.get("startDate")
        if start:
            try:
                if datetime.strptime(start, "%Y-%m-%d").date() < date.today():
                    append_diagnostic(record, "plans_json.startDate", "source_schedule_date_is_in_past", start)
            except ValueError:
                append_diagnostic(record, "plans_json.startDate", "source_schedule_date_missing_or_unparsed", start)
    enrich_course_record(record, fallback_type="OPEN_OFFLINE")
    record["type"] = "OPEN_OFFLINE"
    record["raw_json"]["content_type"] = "COURSE"
    record["raw_json"]["type_evidence"] = "teachingForm=FACE/PRO 且 courseOutList 提供线下城市和开课日期"
    return record


def build_online_exclusion(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "source_course_id": source_id_from_item(item),
        "source_url": detail_url(source_id_from_item(item)),
        "title": clean_html(item.get("productName"), MISSING),
        "content_type": "RECORDED_VIDEO",
        "reason": "online_self_paced_course_not_imported_to_courses",
        "evidence": "teachingForm=ONLINE，接口无 courseOutList 排期，时长常见为分钟数或线上版，属于在线网课/录播资源。",
        "duration_raw": clean_html(item.get("trainingDuration")),
    }


def coverage_notes() -> list[str]:
    return [
        "OPEN_OFFLINE 已覆盖：teachingForm=FACE 面授课和 teachingForm=PRO 职业认证均有公开排期、城市、价格、对象和课程收益。",
        "OPEN_ONLINE 未导入：teachingForm=ONLINE 样本无公开直播排期，表现为在线网课/录播资源，当前不进入 courses 流程。",
        "INTERNAL 未覆盖：源站当前未发现可直接导入 courses 的企业内训课程库；解决方案/企业外派学习平台信息不强行伪造成内训课。",
    ]


def query_product_list(teaching_form: str, page_index: int = 1, page_size: int = 5) -> list[dict[str, Any]]:
    payload = {
        "teachingForm": teaching_form,
        "startMonth": "",
        "firstClassList": None,
        "secClassList": None,
        "supplyList": [],
        "city": "",
        "lowPrice": "",
        "upPrice": "",
        "keyWord": "",
        "pageIndex": page_index,
        "pageSize": page_size,
    }
    data = post_json(LIST_API, payload)
    if str(data.get("code")) != "200":
        raise RuntimeError(f"keycourse list api failed: {data}")
    payload_data = data.get("data") or {}
    rows = payload_data.get("list") or []
    return rows if isinstance(rows, list) else []


def discover_keycourse_items(max_items: int | None = None) -> list[dict[str, Any]]:
    limit = max_items or 100
    items: list[dict[str, Any]] = []
    seen: set[str] = set()
    for teaching_form in ("FACE", "PRO"):
        page_size = min(max(limit, 5), 20)
        try:
            rows = query_product_list(teaching_form, page_size=page_size)
        except Exception as exc:
            logger.warning("keycourse list failed teaching_form=%s error=%s", teaching_form, exc)
            continue
        for row in rows:
            if not isinstance(row, dict):
                continue
            key = f"{row.get('teachingForm')}:{row.get('productId')}"
            if key in seen:
                continue
            seen.add(key)
            items.append(row)
            if len(items) >= limit:
                return items
    return items


def iter_keycourse_courses(max_items: int | None = None):
    for item in discover_keycourse_items(max_items):
        product_id = source_id_from_item(item)
        try:
            html = fetch_text(detail_url(product_id))
        except Exception as exc:
            logger.warning("keycourse detail failed, use api fields only product_id=%s error=%s", product_id, exc)
            html = ""
        record = build_record_from_item(item, html)
        if record.get("raw_json", {}).get("content_type") in {"RECORDED_VIDEO", "DOCUMENT", "AUDIO"}:
            continue
        yield record
        time.sleep(0.1)


def crawl_keycourse_courses(max_items: int | None = None) -> List[Dict[str, Any]]:
    return list(iter_keycourse_courses(max_items))


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class KeycourseCourseSpider:
    """睿选优课课程爬虫适配器，供 JobManager 调用。"""

    name = "keycourse_course"
    source = "keycourse"
    data_type = "COURSE"
    max_items = None
    supported_course_types = ("OPEN_OFFLINE",)
    coverage_note = (
        "覆盖 FACE/PRO 线下公开课；ONLINE 为在线网课/录播资源不导入 courses；"
        "未发现可直接导入的 INTERNAL 课程库。"
    )

    def pause(self) -> None:
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_keycourse_courses(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
