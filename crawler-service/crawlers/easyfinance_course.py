"""安越财商院课程爬虫适配器。"""
import asyncio
import logging
import re
import ssl
import time
import urllib.request
from datetime import date, datetime
from html import unescape
from typing import Any, AsyncGenerator, Dict, Iterable, List
from urllib.parse import urljoin, urlparse

from crawlers.course_utils import append_diagnostic, detect_content_type, enrich_course_record, set_price_fields


BASE_URL = "https://www.easyfinance.com.cn"
OPEN_LIST_URL = f"{BASE_URL}/yearly-course"
MOBILE_OPEN_LIST_URL = f"{BASE_URL}/m-yearly-course"
LIVE_LIST_URL = f"{BASE_URL}/live"
INTERNAL_ITEMS = [
    {
        "url": f"{BASE_URL}/company-energize",
        "source_course_id": "company-energize",
        "title": "定制化学习项目",
        "category_name_raw": "企业赋能",
        "source_entry": "company_energize",
    },
    {
        "url": f"{BASE_URL}/company-energize/system",
        "source_course_id": "company-energize-system",
        "title": "财经体系搭建咨询",
        "category_name_raw": "财经体系搭建",
        "source_entry": "company_energize_system",
    },
    {
        "url": f"{BASE_URL}/ai-finance-transformation",
        "source_course_id": "ai-finance-transformation",
        "title": "AI财务转型陪跑计划",
        "category_name_raw": "AI财务转型",
        "source_entry": "ai_finance_transformation",
    },
]
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
MISSING = "暂无"
CURRENT_COURSE_YEAR = 2026
logger = logging.getLogger(__name__)

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

CITY_PROVINCES = {
    "上海": ("上海市", "上海市"),
    "上海市": ("上海市", "上海市"),
    "北京": ("北京市", "北京市"),
    "北京市": ("北京市", "北京市"),
    "广州": ("广东省", "广州市"),
    "广州市": ("广东省", "广州市"),
    "深圳": ("广东省", "深圳市"),
    "深圳市": ("广东省", "深圳市"),
    "苏州": ("江苏省", "苏州市"),
    "苏州市": ("江苏省", "苏州市"),
    "无锡": ("江苏省", "无锡市"),
    "无锡市": ("江苏省", "无锡市"),
}

SECTION_STOPS = (
    "近期排课",
    "课程收益",
    "课程大纲",
    "课程介绍",
    "培训对象",
    "经验分享",
    "同系列推荐",
    "选择安越",
    "常见问题",
    "请留下您的联系方式",
    "联系我们",
    "客户反馈",
    "领取方案",
    "领取资料",
    "查看详情",
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
    match = re.search(r"uuid=([A-Za-z0-9-]+)", url)
    if match:
        return match.group(1).upper()
    path = urlparse(url).path.strip("/")
    return path.replace("/", "-") or "home"


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
        r'<title[^>]*>([\s\S]*?)</title>',
    ):
        match = re.search(pattern, html, flags=re.I | re.S)
        if not match:
            continue
        title = clean_html(match.group(1), fallback)
        title = re.sub(r"[_-].*安越.*$", "", title).strip()
        if title and len(title) <= 180:
            return title
    return fallback


def extract_detail_text(html: str) -> str:
    text = clean_html(html)
    anchors = ["开课时间：", "培训对象：", "课程收益", "课程介绍", "一站式财商赋能落地解决方案", "什么是财务智能体"]
    positions = [text.find(anchor) for anchor in anchors if text.find(anchor) >= 0]
    if positions:
        start = max(0, min(positions) - 180)
        text = text[start:]
    for stop in ("安越财商院： 021", "免费获取课程资料", "CopyRight"):
        pos = text.find(stop)
        if pos > 800:
            text = text[:pos]
    return text


def valid_section(value: str) -> str:
    text = clean_html(value)
    if not text or text in {MISSING, "KEY BENEFITS", "COURSE CONTENT", "INTRODUCTION"}:
        return MISSING
    return text


def extract_after_labels(text: str, labels: Iterable[str], limit: int = 1500) -> str:
    candidates: list[tuple[int, str]] = []
    for label in labels:
        for match in re.finditer(re.escape(label), text):
            candidates.append((match.start(), label))
    if not candidates:
        return MISSING
    start, label = min(candidates, key=lambda item: item[0])
    segment = text[start + len(label):].lstrip(" ：:，,")
    segment = re.sub(r"^(?:KEY BENEFITS|COURSE CONTENT|INTRODUCTION)\s*", "", segment).strip()
    stops: list[int] = []
    for stop in SECTION_STOPS:
        if stop in labels:
            continue
        pos = segment.find(stop)
        if pos > 0:
            stops.append(pos)
    if stops:
        segment = segment[: min(stops)]
    return valid_section(segment[:limit])


def extract_label_value(text: str, label: str, limit: int = 260) -> str:
    value = extract_after_labels(text, (label,), limit)
    if value == MISSING:
        return MISSING
    for stop in ("培训天数：", "开课地点：", "课程价格：", "培训对象：", "支付宝支付", "微信支付", "近期排课", "提交申请", "领取方案", "关于安越企业赋能中心"):
        pos = value.find(stop)
        if pos > 0:
            value = value[:pos].strip()
    return value or MISSING


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


def parse_duration_days(*values: Any) -> int:
    text = " ".join(clean_html(value) for value in values if value)
    match = re.search(r"(\d+(?:\.\d+)?)\s*天", text)
    if match:
        return max(1, int(float(match.group(1))))
    return 0


def parse_month_day_range(date_text: str, *, year: int = CURRENT_COURSE_YEAR) -> tuple[str, str]:
    text = clean_html(date_text)
    matches = re.findall(r"(\d{1,2})月\s*(\d{1,2})日", text)
    if not matches:
        return "", ""
    start_m, start_d = matches[0]
    end_m, end_d = matches[-1]
    return f"{year:04d}-{int(start_m):02d}-{int(start_d):02d}", f"{year:04d}-{int(end_m):02d}-{int(end_d):02d}"


def parse_full_datetime(value: str) -> str:
    text = clean_html(value)
    match = re.search(r"(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日(?:\s*(\d{1,2}):(\d{2}))?", text)
    if not match:
        return ""
    y, m, d, hh, mm = match.groups()
    result = f"{int(y):04d}-{int(m):02d}-{int(d):02d}"
    if hh and mm:
        result = f"{result} {int(hh):02d}:{mm}"
    return result


def build_offline_plan(url: str, date_text: str, city_text: str, price_raw: str) -> dict[str, Any]:
    start, end = parse_month_day_range(date_text)
    plan = {
        "startDate": start,
        "start_date": start,
        "endDate": end,
        "end_date": end,
        "sourceDateText": date_text,
        "sourceLocationText": city_text,
        "priceRaw": price_raw,
        "signupUrl": url,
        "type": "OFFLINE",
    }
    plan.update(normalize_location(city_text))
    return {key: value for key, value in plan.items() if value not in {"", None}}


def parse_open_list_rows(html: str, *, limit: int | None = None) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    pattern = re.compile(
        r'<a[^>]+href=["\']([^"\']*course-detail\?uuid=[^"\']+)["\'][^>]*>([\s\S]*?)</a>',
        flags=re.I,
    )
    for href, body in pattern.findall(html):
        url = absolute_url(href)
        text = clean_html(body)
        if not text or "地点：" not in text or "￥" not in text:
            continue
        match = re.search(
            r"(?P<title>.+?)\s+(?P<date>\d{1,2}月\s*\d{1,2}日\s*-\s*\d{1,2}月\s*\d{1,2}日)\s+"
            r"(?P<days>\d+(?:\.\d+)?天(?:\d+夜)?)\s+地点：(?P<city>\S+)\s+￥\s*(?P<price>[\d,]+)",
            text,
        )
        if not match or url in seen:
            continue
        seen.add(url)
        price_raw = f"￥{match.group('price')}"
        rows.append(
            {
                "url": url,
                "source_course_id": source_id_from_url(url),
                "title": match.group("title").strip(),
                "type": "OPEN_OFFLINE",
                "category_name_raw": "安越财商院公开课",
                "date_text": match.group("date"),
                "duration_text": match.group("days"),
                "city_text": match.group("city"),
                "price_raw": price_raw,
                "plans_json": [build_offline_plan(url, match.group("date"), match.group("city"), price_raw)],
                "source_entry": "yearly_course_schedule",
            }
        )
        if limit and len(rows) >= limit:
            break
    return rows


def parse_live_list_rows(html: str, *, limit: int | None = None) -> list[dict[str, Any]]:
    text = clean_html(html)
    start = text.find("精选直播")
    end = text.find("查看更多", start)
    segment = text[start:end if end > start else len(text)] if start >= 0 else text
    hot_start = segment.find("近期热门课程 精选直播")
    if hot_start >= 0:
        segment = segment[hot_start + len("近期热门课程 精选直播"):]
    rows: list[dict[str, Any]] = []
    pattern = re.compile(
        r"(?P<title>[^。！？\n]+?)\s+讲师：(?P<trainer>[\u4e00-\u9fa5A-Za-z·]{1,30})\s+"
        r"(?P<date>\d{4}年\s*\d{1,2}月\s*\d{1,2}日\s+\d{1,2}:\d{2})\s+已预约：(?P<reserved>\d+)人\s+(?P<status>已结束|预约中|报名中)",
    )
    for match in pattern.finditer(segment):
        title = match.group("title").strip()
        if not title or "近期热门课程" in title:
            title = title.replace("近期热门课程", "").strip()
        start_time = parse_full_datetime(match.group("date"))
        source_id = re.sub(r"\W+", "-", f"live-{title}-{match.group('date')}").strip("-")
        plan = {
            "startDate": start_time[:10],
            "start_date": start_time[:10],
            "startTime": start_time,
            "sourceDateText": match.group("date"),
            "onlineUrl": LIVE_LIST_URL,
            "signupUrl": LIVE_LIST_URL,
            "location": "线上直播",
            "sourceLocationText": "精选直播",
            "status": match.group("status"),
            "type": "ONLINE",
        }
        rows.append(
            {
                "url": LIVE_LIST_URL,
                "source_course_id": source_id[:160],
                "title": title,
                "type": "OPEN_ONLINE",
                "category_name_raw": "精选直播",
                "date_text": match.group("date"),
                "trainer_name_raw": match.group("trainer"),
                "price_raw": "免费直播",
                "plans_json": [{key: value for key, value in plan.items() if value not in {"", None}}],
                "live_status": match.group("status"),
                "reserved_count_raw": match.group("reserved"),
                "source_entry": "live_list",
            }
        )
        if limit and len(rows) >= limit:
            break
    return rows


def extract_cover_url(html: str) -> str:
    for src in re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html, flags=re.I):
        if src.startswith("data:"):
            continue
        if "logo" in src.lower() or "video_bg" in src.lower():
            continue
        return absolute_url(src)
    return ""


def build_base_record(item: dict[str, Any], html: str, course_type: str) -> Dict[str, Any]:
    detail_text = extract_detail_text(html)
    title = item.get("title") or MISSING
    if course_type == "OPEN_OFFLINE":
        title = extract_title(html, title)
    summary = meta_content(html, "description")
    duration_days = parse_duration_days(item.get("duration_text"), extract_label_value(detail_text, "培训天数：", 80), detail_text[:500])
    record: Dict[str, Any] = {
        "source_course_id": item.get("source_course_id") or source_id_from_url(item["url"]),
        "source_url": item["url"],
        "title": title,
        "type": course_type,
        "category_name_raw": item.get("category_name_raw") or MISSING,
        "cover_url": extract_cover_url(html),
        "intro": extract_after_labels(detail_text, ("课程介绍", "关于安越企业赋能中心", "什么是财务智能体"), 1600),
        "summary": (summary if summary != MISSING else detail_text[:500])[:500],
        "syllabus": extract_after_labels(detail_text, ("课程大纲", "定制化学习项目服务体系", "咨询项目服务形式", "四类交付"), 5000),
        "audience": extract_label_value(detail_text, "培训对象：", 1000),
        "target_audience": "",
        "learning_outcomes": extract_after_labels(detail_text, ("课程收益", "核心优势", "安越方案", "定制化学习项目服务体系"), 1800),
        "highlights": extract_after_labels(detail_text, ("课程特色", "服务特色", "六大核心优势"), 1200),
        "duration_days": duration_days,
        "total_hours": float(duration_days * 6) if duration_days else 0,
        "original_price": 0,
        "keywords": " ".join(part for part in [item.get("category_name_raw"), "安越财商院"] if part and part != MISSING),
        "trainer_name_raw": item.get("trainer_name_raw") or MISSING,
        "plans_json": item.get("plans_json", []) if course_type != "INTERNAL" else [],
        "services_json": [],
        "raw_json": {
            "source_entry": item.get("source_entry", ""),
            "source_entry_name": "安越财商院公开课" if course_type == "OPEN_OFFLINE" else ("精选直播" if course_type == "OPEN_ONLINE" else "企业赋能中心"),
            "content_type": "COURSE",
            "type_evidence": "easyfinance_yearly_course_schedule" if course_type == "OPEN_OFFLINE" else ("easyfinance_live_list" if course_type == "OPEN_ONLINE" else "easyfinance_company_energize_solution"),
            "category_evidence": "source top navigation / entry column; item-level category not exposed on schedule card",
            "field_sources": {
                "plans_json": "年度课表卡片日期/地点/价格" if course_type == "OPEN_OFFLINE" else ("精选直播列表日期/线上直播入口" if course_type == "OPEN_ONLINE" else "企业赋能/定制化学习无公开固定排期"),
                "price": "年度课表卡片价格" if course_type == "OPEN_OFFLINE" else ("直播列表未显示收费，按免费直播处理" if course_type == "OPEN_ONLINE" else "企业内训/咨询按需求定制，价格咨询/面议"),
                "learning_outcomes": "详情页课程收益或企业赋能方案说明",
                "audience": "详情页培训对象或服务对象",
                "syllabus": "详情页课程大纲/服务体系/交付形式",
            },
            "coverage_notes": coverage_notes(),
            "diagnostics": [],
        },
    }
    return record


def parse_open_detail_html(item: dict[str, Any], html: str) -> Dict[str, Any]:
    record = build_base_record(item, html, "OPEN_OFFLINE")
    set_price_fields(record, item.get("price_raw") or extract_label_value(extract_detail_text(html), "课程价格：", 100))
    append_diagnostic(record, "category_name_raw", "source_schedule_has_no_item_level_category", record.get("category_name_raw"))
    for plan in record["plans_json"]:
        if not plan.get("startDate"):
            append_diagnostic(record, "plans_json.startDate", "source_schedule_date_missing_or_unparsed", plan.get("sourceDateText"))
        else:
            try:
                if datetime.strptime(plan["startDate"], "%Y-%m-%d").date() < date.today():
                    append_diagnostic(record, "plans_json.startDate", "source_schedule_date_is_in_past", plan["startDate"])
            except ValueError:
                append_diagnostic(record, "plans_json.startDate", "source_schedule_date_missing_or_unparsed", plan.get("startDate"))
        if plan.get("address") == plan.get("city"):
            append_diagnostic(record, "plans_json.address", "source_only_provides_city_no_street_address", plan.get("city"))
    enrich_course_record(record, fallback_type="OPEN_OFFLINE")
    record["type"] = "OPEN_OFFLINE"
    record["raw_json"]["content_type"] = "COURSE"
    record["raw_json"]["type_evidence"] = "easyfinance_yearly_course_schedule"
    return record


def parse_live_record(item: dict[str, Any], list_html: str) -> Dict[str, Any]:
    record = build_base_record(item, list_html, "OPEN_ONLINE")
    record["title"] = item.get("title") or record["title"]
    record["intro"] = f"安越财商院精选直播：{item.get('title', MISSING)}"
    record["summary"] = record["intro"]
    record["audience"] = MISSING
    record["learning_outcomes"] = MISSING
    record["syllabus"] = MISSING
    set_price_fields(record, item.get("price_raw") or "免费直播")
    append_diagnostic(record, "category_name_raw", "source_live_has_no_item_level_category", record.get("category_name_raw"))
    if item.get("live_status") == "已结束":
        append_diagnostic(record, "plans_json.status", "source_live_is_ended", item.get("date_text"))
    for plan in record["plans_json"]:
        try:
            if plan.get("startDate") and datetime.strptime(plan["startDate"], "%Y-%m-%d").date() < date.today():
                append_diagnostic(record, "plans_json.startDate", "source_schedule_date_is_in_past", plan["startDate"])
        except ValueError:
            append_diagnostic(record, "plans_json.startDate", "source_schedule_date_missing_or_unparsed", plan.get("startDate"))
    enrich_course_record(record, fallback_type="OPEN_ONLINE")
    record["type"] = "OPEN_ONLINE"
    record["raw_json"]["content_type"] = "COURSE"
    record["raw_json"]["type_evidence"] = "easyfinance_live_list"
    return record


def parse_internal_detail_html(item: dict[str, Any], html: str) -> Dict[str, Any]:
    record = build_base_record(item, html, "INTERNAL")
    record["duration_days"] = 0
    record["total_hours"] = 0
    set_price_fields(record, "内训咨询")
    append_diagnostic(record, "plans_json", "internal_course_has_no_public_schedule")
    append_diagnostic(record, "duration_days", "internal_solution_duration_needs_manual_confirmation")
    enrich_course_record(record, fallback_type="INTERNAL")
    record["type"] = "INTERNAL"
    record["raw_json"]["content_type"] = "COURSE"
    record["raw_json"]["type_evidence"] = "easyfinance_company_energize_solution"
    return record


def parse_online_platform_entry(html: str, url: str = f"{BASE_URL}/fiscal-tax") -> Dict[str, Any]:
    text = clean_html(html)
    return {
        "source_course_id": "fiscal-tax",
        "source_url": url,
        "title": extract_title(html, "越享财税"),
        "content_type": "RECORDED_VIDEO",
        "reason": "online_learning_platform_not_imported_to_courses",
        "evidence": "源站越享财税/数字财商院为线上终身学习发展平台，当前不并入 courses 公开课/内训流程。",
        "raw_text_sample": text[:500],
    }


def coverage_notes() -> list[str]:
    return [
        "OPEN_OFFLINE 已覆盖：yearly-course 年度课表提供课程名、日期、天数、城市和价格，详情页补充对象、收益、大纲和介绍。",
        "OPEN_ONLINE 已覆盖：live 精选直播列表提供直播标题、讲师、直播时间和状态；若源站标记已结束，则保留诊断供人工审核判断。",
        "INTERNAL 已覆盖：company-energize、company-energize/system、AI 财务转型陪跑计划作为企业定制化学习/咨询/陪跑类内训方案，价格按咨询/面议处理，不伪造排期。",
        "未导入录播/在线学习平台：越享财税/数字财商院偏线上学习平台，后续应进入 video/online 独立流程。",
    ]


def discover_open_items(limit: int) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for url in (OPEN_LIST_URL, MOBILE_OPEN_LIST_URL):
        try:
            items = parse_open_list_rows(fetch_text(url))
        except Exception as exc:
            logger.warning("easyfinance open list failed url=%s error=%s", url, exc)
        if items:
            break
    future_rows = []
    past_rows = []
    for row in items:
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


def discover_live_items(limit: int) -> tuple[list[dict[str, Any]], str]:
    html = fetch_text(LIVE_LIST_URL)
    return parse_live_list_rows(html, limit=limit), html


def discover_internal_items(limit: int) -> list[dict[str, Any]]:
    return INTERNAL_ITEMS[:limit]


def iter_easyfinance_courses(max_items: int | None = None):
    limit = max_items or 100
    open_quota = max(1, (limit + 2) // 3)
    live_quota = max(1, (limit + 2) // 3)
    internal_quota = max(1, limit - open_quota - live_quota)
    live_items: list[dict[str, Any]] = []
    live_html = ""
    try:
        live_items, live_html = discover_live_items(live_quota)
    except Exception as exc:
        logger.warning("easyfinance live list failed error=%s", exc)
    candidates = discover_open_items(open_quota) + live_items + discover_internal_items(internal_quota)
    seen: set[str] = set()
    for item in candidates[:limit]:
        key = f"{item.get('source_course_id')}:{item.get('type')}"
        if key in seen:
            continue
        seen.add(key)
        try:
            if item.get("source_entry") == "live_list":
                record = parse_live_record(item, live_html)
            elif item.get("source_entry", "").startswith("company") or item.get("source_entry") == "ai_finance_transformation":
                record = parse_internal_detail_html(item, fetch_text(item["url"]))
            else:
                record = parse_open_detail_html(item, fetch_text(item["url"]))
            if record.get("raw_json", {}).get("content_type") in {"RECORDED_VIDEO", "DOCUMENT", "AUDIO"}:
                continue
            yield record
        except Exception as exc:
            logger.warning("easyfinance course detail failed, skip url=%s error=%s", item.get("url"), exc)
        time.sleep(0.1)


def crawl_easyfinance_courses(max_items: int | None = None) -> List[Dict[str, Any]]:
    return list(iter_easyfinance_courses(max_items))


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class EasyFinanceCourseSpider:
    """安越财商院课程爬虫适配器，供 JobManager 调用。"""

    name = "easyfinance_course"
    source = "easyfinance"
    data_type = "COURSE"
    max_items = None
    supported_course_types = ("OPEN_OFFLINE", "OPEN_ONLINE", "INTERNAL")
    coverage_note = (
        "yearly-course 覆盖 OPEN_OFFLINE；live 精选直播覆盖 OPEN_ONLINE；"
        "企业赋能/财经体系/AI 财务转型陪跑覆盖 INTERNAL；越享财税/数字财商院在线学习平台不导入 courses。"
    )

    def pause(self) -> None:
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_easyfinance_courses(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
