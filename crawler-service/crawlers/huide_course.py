"""惠德培训课程爬虫适配器。"""
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


BASE_URL = "http://www.huide.net"
HOME_URL = f"{BASE_URL}/"
OPEN_LIST_URL = f"{BASE_URL}/OpenClass.aspx"
TRAINING_URL = f"{BASE_URL}/Training.aspx"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
MISSING = "暂无"
logger = logging.getLogger(__name__)

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

CITY_PROVINCES = {
    "北京": ("北京市", "北京市"),
    "上海": ("上海市", "上海市"),
    "深圳": ("广东省", "深圳市"),
}

CITY_TABS = {
    "con_two_1": "北京",
    "con_two_2": "上海",
    "con_two_3": "深圳",
}


def fetch_text(url: str, timeout: int = 18, retries: int = 2) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                raw = resp.read()
                charset = resp.headers.get_content_charset() or "utf-8"
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
    match = re.search(r"id=(\d+)", url, flags=re.I)
    return match.group(1) if match else url


def normalize_city(value: Any) -> dict[str, str]:
    raw = clean_html(value)
    for city, (province, city_name) in CITY_PROVINCES.items():
        if city in raw:
            return {
                "province_name_raw": province,
                "province": province,
                "city": city_name,
                "city_name_raw": city_name,
                "location": raw or city,
                "address": raw or city,
                "sourceLocationText": raw or city,
            }
    if raw:
        return {"city": raw, "city_name_raw": raw, "location": raw, "address": raw, "sourceLocationText": raw}
    return {}


def parse_dates(text: str) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for match in re.finditer(r"(?:(\d{4})年\s*)?(\d{1,2})月\s*(\d{1,2})(?:[-—至到](\d{1,2}))?日?(?:\s*([北京上海深圳]{2}))?", text):
        year = int(match.group(1) or 2026)
        month = int(match.group(2))
        start_day = int(match.group(3))
        end_day = int(match.group(4) or start_day)
        city = match.group(5) or ""
        start = f"{year:04d}-{month:02d}-{start_day:02d}"
        end = f"{year:04d}-{month:02d}-{end_day:02d}"
        plan: dict[str, Any] = {
            "startDate": start,
            "start_date": start,
            "endDate": end,
            "end_date": end,
            "startTime": start,
            "endTime": end,
            "sourceDateText": match.group(0),
            "type": "OFFLINE",
        }
        plan.update(normalize_city(city))
        result.append(plan)
    return result


def extract_between(text: str, starts: tuple[str, ...], stops: tuple[str, ...], limit: int = 3000) -> str:
    candidates = [(text.find(s), s) for s in starts if text.find(s) >= 0]
    if not candidates:
        return MISSING
    for pos, label in sorted(candidates, key=lambda item: item[0]):
        segment = text[pos + len(label):].strip(" ：:")
        # Huide detail pages put tab labels directly after section titles, e.g.
        # "课程目标 课程纲要 相关资料 学员反馈 正文...".
        for _ in range(4):
            changed = False
            for nav_label in ("课程目标", "课程纲要", "课程大纲", "相关资料", "学员反馈"):
                if segment.startswith(nav_label):
                    segment = segment[len(nav_label):].strip(" ：:")
                    changed = True
            if not changed:
                break
        stop_positions = [segment.find(stop) for stop in stops if segment.find(stop) > 0]
        if stop_positions:
            segment = segment[: min(stop_positions)]
        cleaned = clean_html(segment, MISSING).strip(" ：:")
        if cleaned not in {MISSING, "课程目标", "课程纲要", "课程大纲", "相关资料", "学员反馈"} and len(cleaned) >= 8:
            return cleaned[:limit]
    return MISSING


def split_table_cells(row_html: str) -> list[str]:
    return [clean_html(cell) for cell in re.findall(r"<td[^>]*>([\s\S]*?)</td>", row_html, flags=re.I)]


def build_list_plan(month: int, cell_html: str, city: str, source_url: str, price_raw: str) -> dict[str, Any] | None:
    text = clean_html(cell_html)
    match = re.search(r"(\d{1,2})(?:[-—至到](\d{1,2}))?", text)
    if not match:
        return None
    start_day = int(match.group(1))
    end_day = int(match.group(2) or start_day)
    start = f"2026-{month:02d}-{start_day:02d}"
    end = f"2026-{month:02d}-{end_day:02d}"
    signup_match = re.search(r'href=["\']([^"\']*Registration\.aspx[^"\']*)["\']', cell_html, flags=re.I)
    signup_url = absolute_url(unescape(signup_match.group(1))) if signup_match else source_url
    plan: dict[str, Any] = {
        "startDate": start,
        "start_date": start,
        "endDate": end,
        "end_date": end,
        "startTime": start,
        "endTime": end,
        "sourceDateText": f"2026年{month}月{text}",
        "signupUrl": signup_url,
        "priceRaw": price_raw,
        "type": "OFFLINE",
    }
    plan.update(normalize_city(city))
    return plan


def parse_open_table_items(open_html: str, max_items: int | None = None) -> list[dict[str, Any]]:
    items_by_id: dict[str, dict[str, Any]] = {}
    for tab_id, city in CITY_TABS.items():
        tab_start = open_html.find(f'id="{tab_id}"')
        if tab_start < 0:
            continue
        table_end = open_html.find("</table>", tab_start)
        section = open_html[tab_start : table_end + len("</table>")] if table_end > tab_start else open_html[tab_start:]
        category = "惠德公开课"
        for row_html in re.findall(r"<tr[^>]*>([\s\S]*?)</tr>", section, flags=re.I):
            if "Systems.aspx?ids=" in row_html:
                category = clean_html(row_html, category)
                continue
            link = re.search(r'<a[^>]+href=["\']([^"\']*Systems\.aspx\?id=\d+)["\'][^>]*>([\s\S]*?)</a>', row_html, flags=re.I)
            if not link:
                continue
            cells = split_table_cells(row_html)
            if len(cells) < 3:
                continue
            title = clean_html(link.group(2)).strip("· ")
            url = absolute_url(link.group(1))
            source_id = source_id_from_url(url)
            duration_days = int(float(cells[1])) if re.fullmatch(r"\d+(?:\.\d+)?", cells[1]) else 0
            price_raw = cells[2]
            item = items_by_id.setdefault(
                source_id,
                {
                    "source_course_id": source_id,
                    "source_url": url,
                    "url": url,
                    "title": title,
                    "category_name_raw": category,
                    "duration_days": duration_days,
                    "price_raw": price_raw,
                    "plans_json": [],
                    "source_entry": "openclass_city_table",
                },
            )
            if not item.get("duration_days") and duration_days:
                item["duration_days"] = duration_days
            if not item.get("price_raw") and price_raw:
                item["price_raw"] = price_raw
            item["category_name_raw"] = item.get("category_name_raw") or category
            cell_htmls = re.findall(r"<td[^>]*>([\s\S]*?)</td>", row_html, flags=re.I)
            for month, cell_html in enumerate(cell_htmls[3:15], start=1):
                plan = build_list_plan(month, cell_html, city, url, item.get("price_raw") or price_raw)
                if plan:
                    item["plans_json"].append(plan)
    items = list(items_by_id.values())
    today = datetime.now().date()

    def has_future_plan(value: dict[str, Any]) -> bool:
        for plan in value.get("plans_json") or []:
            try:
                if datetime.strptime(plan.get("startDate", ""), "%Y-%m-%d").date() >= today:
                    return True
            except Exception:
                continue
        return False

    items.sort(key=lambda value: (0 if has_future_plan(value) else 1, 0 if value.get("plans_json") else 1, value.get("source_course_id", "")))
    return items[:max_items] if max_items else items


def discover_items(max_items: int | None = None) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    seen: set[str] = set()
    open_html = fetch_text(OPEN_LIST_URL)
    table_items = parse_open_table_items(open_html, max_items)
    if table_items:
        return table_items
    for href, label in re.findall(r'<a[^>]+href=["\']([^"\']*Systems\.aspx\?id=\d+)["\'][^>]*>([\s\S]*?)</a>', open_html, re.I):
        title = clean_html(label).strip("· ")
        if not title or len(title) < 4 or "..." in title:
            continue
        url = absolute_url(href)
        key = source_id_from_url(url)
        if key in seen:
            continue
        seen.add(key)
        candidates.append({"source_course_id": key, "source_url": url, "url": url, "title": title, "source_entry": "openclass_table"})
        if max_items and len(candidates) >= max_items:
            return candidates
    if max_items and len(candidates) >= max_items:
        return candidates
    html = fetch_text(HOME_URL)
    for href, label in re.findall(r'<a[^>]+href=["\']([^"\']*Systems\.aspx\?id=\d+)["\'][^>]*>([\s\S]*?)</a>', html, re.I):
        title = clean_html(label).strip("· ")
        if not title or len(title) < 4:
            continue
        url = absolute_url(href)
        key = source_id_from_url(url)
        if key in seen:
            continue
        seen.add(key)
        candidates.append({"source_course_id": key, "source_url": url, "url": url, "title": title, "source_entry": "homepage_recent_courses"})
        if max_items and len(candidates) >= max_items:
            break
    return candidates


def parse_detail_html(item: dict[str, Any], html: str) -> Dict[str, Any]:
    text = clean_html(html)
    title = item.get("title") or MISSING
    crumb = re.search(r"首页\s*>\s*课程体系\s*>\s*([^>]+?)\s*>\s*([^ ]+.*?)\s+\2", text)
    category = item.get("category_name_raw") or (clean_html(crumb.group(1), "惠德公开课") if crumb else "惠德公开课")
    if crumb:
        title = clean_html(crumb.group(2), title)
    duration_match = re.search(r"《?[^《》]{2,80}》?\s+(\d+(?:\.\d+)?)天", text)
    duration_days = int(float(duration_match.group(1))) if duration_match else int(item.get("duration_days") or 0)
    price_match = re.search(r"([￥¥]\s*\d+(?:\.\d+)?\s*元?|电询|培训咨询)", text)
    price_raw = item.get("price_raw") or (price_match.group(1) if price_match else "")
    trainer = extract_between(text, ("授课讲师", "讲师介绍", "讲师简介"), ("课程目标", "课程纲要", "课程大纲", "惠德声明"), 500)
    outcomes = extract_between(text, ("课程目标",), ("课程纲要", "课程大纲", "相关资料", "学员反馈"), 1600)
    syllabus = extract_between(text, ("课程大纲", "课程纲要"), ("讲师介绍", "讲师简介", "相关资料", "学员反馈", "惠德声明"), 5000)
    audience = extract_between(text, ("适合人群", "培训对象", "适用对象", "报名要求"), ("课程目标", "课程大纲", "课程纲要", "证书颁发", "惠德AI", "惠德声明"), 1200)
    date_segment = extract_between(text, ("直播日期", "开题日期", "开课日期", "开课时间"), ("授课讲师", "课程目标", "课程纲要", "咨询电话"), 500)
    plans = parse_dates(date_segment if date_segment != MISSING else text[:2500])
    has_list_plans = bool(item.get("plans_json"))
    if has_list_plans:
        plans = item["plans_json"]
    removed_past_plans = 0
    if plans:
        today = datetime.now().date()
        future_plans: list[dict[str, Any]] = []
        for plan in plans:
            try:
                start_date = datetime.strptime(plan.get("startDate", ""), "%Y-%m-%d").date()
            except Exception:
                future_plans.append(plan)
                continue
            if start_date >= today:
                future_plans.append(plan)
            else:
                removed_past_plans += 1
        if future_plans:
            plans = future_plans
    online_evidence_text = f"{title} {text[:2500]}"
    is_online = not has_list_plans and any(word in online_evidence_text for word in ("直播", "线上", "在线课程", "在线公开课", "云课堂", "网络课"))
    course_type = "OPEN_ONLINE" if is_online else "OPEN_OFFLINE"
    for plan in plans:
        plan["signupUrl"] = plan.get("signupUrl") or item.get("source_url")
        plan["priceRaw"] = plan.get("priceRaw") or price_raw
        plan["type"] = "ONLINE" if is_online else "OFFLINE"
        if is_online:
            plan["onlineUrl"] = item.get("source_url")
            plan["location"] = plan.get("location") or "在线直播"
    record: Dict[str, Any] = {
        "source_course_id": item.get("source_course_id"),
        "source_url": item.get("source_url"),
        "title": title,
        "type": course_type,
        "category_name_raw": category,
        "cover_url": "",
        "intro": outcomes,
        "summary": outcomes[:500] if outcomes != MISSING else "",
        "syllabus": syllabus,
        "audience": audience,
        "target_audience": "",
        "learning_outcomes": outcomes,
        "highlights": "",
        "duration_days": duration_days,
        "total_hours": float(duration_days * 6) if duration_days else 0,
        "original_price": 0,
        "keywords": category,
        "trainer_name_raw": trainer.split("老师")[0][:40] + ("老师" if "老师" in trainer[:60] else "") if trainer != MISSING else "",
        "plans_json": plans[:6],
        "services_json": [],
        "raw_json": {
            "source_entry": item.get("source_entry"),
            "content_type": "COURSE",
            "price_raw": price_raw,
            "type_evidence": "detail text contains online/live words" if is_online else "detail/list course page with offline schedule clues",
            "field_sources": {
                "plans_json": "公开课全年课表或详情页直播日期/开题日期/开课日期",
                "price": "公开课全年课表或详情页价格文本",
                "audience": "详情页适合人群/培训对象",
                "learning_outcomes": "详情页课程目标",
                "syllabus": "详情页课程大纲/课程纲要",
            },
            "coverage_notes": coverage_notes(),
            "diagnostics": [],
        },
    }
    set_price_fields(record, price_raw)
    if not plans:
        append_diagnostic(record, "plans_json", "source_detail_schedule_missing_or_unparsed")
    if removed_past_plans:
        append_diagnostic(record, "plans_json", "past_schedule_removed", f"removed={removed_past_plans}")
    for plan in plans:
        if course_type == "OPEN_OFFLINE" and not plan.get("province_name_raw"):
            append_diagnostic(record, "plans_json.province_name_raw", "source_location_needs_manual_review", plan.get("sourceDateText"))
    if audience == MISSING:
        append_diagnostic(record, "audience", "source_detail_audience_missing")
    if outcomes == MISSING:
        append_diagnostic(record, "learning_outcomes", "source_detail_outcomes_missing")
    enrich_course_record(record, fallback_type=course_type)
    record["type"] = course_type
    if not price_raw:
        record["raw_json"]["price_parse_status"] = "MISSING"
    return record


def coverage_notes() -> list[str]:
    return [
        "OPEN_OFFLINE 已覆盖：从近期课程和公开课课程体系页抓取线下班课，详情页补充日期、城市线索、讲师、目标和大纲。",
        "OPEN_ONLINE 已覆盖：标题或详情出现直播、线上、在线、云课堂时按线上公开课处理，保留线上入口链接。",
        "INTERNAL 未导入：Training.aspx 主要是企业内训介绍/需求登记，不是具体可入库课程详情。",
    ]


def iter_huide_courses(max_items: int | None = None):
    for item in discover_items(max_items):
        try:
            html = fetch_text(item["url"])
            yield parse_detail_html(item, html)
        except Exception as exc:
            logger.warning("huide detail failed url=%s error=%s", item.get("url"), exc)
        time.sleep(0.1)


def crawl_huide_courses(max_items: int | None = None) -> List[Dict[str, Any]]:
    return list(iter_huide_courses(max_items))


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class HuideCourseSpider:
    name = "huide_course"
    source = "huide"
    data_type = "COURSE"
    max_items = None
    supported_course_types = ("OPEN_OFFLINE", "OPEN_ONLINE")
    coverage_note = "公开课/近期课程覆盖 OPEN_OFFLINE 与 OPEN_ONLINE；企业内训栏目只有需求登记，未导入具体内训课。"

    def pause(self) -> None:
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_huide_courses(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
