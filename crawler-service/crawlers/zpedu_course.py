"""中培伟业课程爬虫适配器。"""
import asyncio
import json
import logging
import re
import ssl
import time
import urllib.request
from datetime import datetime
from html import unescape
from typing import Any, AsyncGenerator, Dict, List
from urllib.parse import urljoin

from crawlers.course_utils import append_diagnostic, detect_content_type, enrich_course_record, set_price_fields
from crawlers.media import media_asset


BASE_URL = "https://www.zpedu.com"
OPEN_SEED_URLS = (
    f"{BASE_URL}/",
    f"{BASE_URL}/ms/",
)
INTERNAL_SEED_URLS = (
    f"{BASE_URL}/nx/",
    f"{BASE_URL}/nx/403/",
    f"{BASE_URL}/nx/406/",
    f"{BASE_URL}/nx/410/",
)
RECORDED_HOSTS = ("it.zpedu.com",)
MISSING = "暂无"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
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
                return resp.read().decode(resp.headers.get_content_charset() or "utf-8", errors="ignore")
        except Exception as exc:
            last_error = exc
            if attempt >= retries:
                break
            time.sleep(0.4 * attempt)
    raise RuntimeError(f"request failed after {retries} retries: {url}; {last_error}")


def absolute_url(value: str) -> str:
    return urljoin(BASE_URL, value or "")


def clean_html(value: Any, default: str = MISSING) -> str:
    if value is None:
        return default
    text = str(value)
    text = re.sub(r"<script[\s\S]*?</script>", " ", text, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = " ".join(unescape(text).replace("&nbsp;", " ").split())
    return text or default


def meta_content(html: str, name: str) -> str:
    match = re.search(
        rf'<meta[^>]+name=["\']{re.escape(name)}["\'][^>]+content=["\'](.*?)["\']',
        html,
        flags=re.I | re.S,
    )
    return clean_html(match.group(1)) if match else MISSING


def extract_images(html: str, limit: int = 20) -> list[str]:
    urls: list[str] = []
    seen: set[str] = set()
    for raw in re.findall(r'(?:src|data-original|data-src)=["\']([^"\']+)["\']', html or "", flags=re.I):
        url = absolute_url(raw)
        if not url or url in seen or url.startswith("data:"):
            continue
        seen.add(url)
        urls.append(url)
        if len(urls) >= limit:
            break
    return urls


def source_id_from_url(url: str) -> str:
    match = re.search(r"/(?:nx|ms)/(\d+)\.html", url)
    return match.group(1) if match else url.rstrip("/").rsplit("/", 1)[-1]


def extract_detail_html(html: str) -> str:
    start = html.find('<div class="detail">')
    if start < 0:
        return ""
    start += len('<div class="detail">')
    end = html.find('<div class="art-tags">', start)
    if end < 0:
        end = html.find('<ul class="art-updown">', start)
    if end < 0:
        end = html.find('<div class="art-relevant">', start)
    return html[start:end] if end > start else html[start:]


def discover_course_items(seed_urls: list[str], limit: int = 50, source_entry: str = "internal") -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    seen: set[str] = set()
    for url in seed_urls:
        html = fetch_text(url)
        cards = re.findall(r"<li>\s*<div class=\"pic\">([\s\S]*?</li>)", html, flags=re.I)
        if not cards:
            cards = re.findall(r"<li[^>]*>([\s\S]*?</li>)", html, flags=re.I)
        for card in cards:
            href_match = re.search(r'href=["\']([^"\']+/(?:nx|ms)/\d+\.html)["\']', card, flags=re.I)
            if not href_match:
                continue
            full_url = absolute_url(href_match.group(1))
            if full_url in seen:
                continue
            seen.add(full_url)
            img_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', card, flags=re.I)
            title_match = re.search(r'title=["\']([^"\']+)["\']', card, flags=re.I)
            desc_match = re.search(r"<p>([\s\S]*?)</p>", card, flags=re.I)
            items.append(
                {
                    "url": full_url,
                    "cover_url": absolute_url(img_match.group(1)) if img_match else "",
                    "list_title": clean_html(title_match.group(1)) if title_match else MISSING,
                    "list_summary": clean_html(desc_match.group(1)) if desc_match else MISSING,
                    "source_entry": source_entry,
                }
            )
            if len(items) >= limit:
                return items
        for href in re.findall(r'href=["\']([^"\']+/(?:nx|ms)/\d+\.html)["\']', html, flags=re.I):
            full_url = absolute_url(href)
            if full_url in seen:
                continue
            seen.add(full_url)
            items.append(
                {
                    "url": full_url,
                    "cover_url": "",
                    "list_title": MISSING,
                    "list_summary": MISSING,
                    "source_entry": source_entry,
                }
            )
            if len(items) >= limit:
                return items
        time.sleep(0.1)
    return items


def parse_plans(text: str) -> list[dict[str, str]]:
    plans: list[dict[str, str]] = []
    pattern = r"(\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*(?:[-－]\s*\d{1,2})?\s*日)\s*([\u4e00-\u9fa5、/＋+]{2,20})"
    for date_text, city in re.findall(pattern, text):
        location = city.strip("、/＋+ ")
        plan = {"start_date": re.sub(r"\s+", "", date_text).replace("－", "-"), "location": location, "status": "待确认"}
        if any(word in location for word in ("直播", "线上", "在线", "远程")):
            plan["online_url"] = ""
        plans.append(plan)
    return plans


def parse_duration_days(text: str) -> int:
    match = re.search(r"(\d+)\s*天", text)
    return int(match.group(1)) if match else 0


def parse_price(text: str) -> float:
    normalized = text.replace(",", "")
    match = re.search(r"(?:学习费用|培训费用|课程价格|价格|费用)[：:\s]*(?:￥|¥)?\s*(\d{3,6})(?:\.00)?\s*元?", normalized)
    if not match:
        match = re.search(r"(?:￥|¥)\s*(\d{3,6})(?:\.00)?\s*元?", normalized)
    return float(match.group(1)) if match else 0.0


def extract_price_raw(text: str) -> str:
    for pattern in (
        r"(?:学习费用|培训费用|课程价格|价格|费用)[：:\s]*(?:￥|¥)?\s*\d{1,8}(?:\.\d+)?\s*元?",
        r"(?:学习费用|培训费用|课程价格|价格|费用)[：:\s]*(?:面议|待商量|待议|电话咨询|咨询|详询)",
        r"(?:￥|¥)\s*\d{1,8}(?:\.\d+)?\s*元?",
    ):
        match = re.search(pattern, text.replace(",", ""))
        if match:
            return match.group(0)
    return extract_after_label(text, "培训费用", 120)


def extract_after_label(text: str, label: str, max_len: int = 500) -> str:
    idx = text.find(label)
    if idx < 0:
        return MISSING
    segment = text[idx + len(label):]
    stops = [
        pos
        for pos in (
            segment.find(x)
            for x in (
                "培训信息",
                "课程信息",
                "培训大纲",
                "课程大纲",
                "培训收益",
                "课程收益",
                "培训对象",
                "课程对象",
                "适合对象",
                "培训费用",
                "课程费用",
                "专家讲师",
                "授课讲师",
                "培训特色",
                "课程特色",
                "中培优势",
                "课程安排",
                "证书颁发",
                "参会对象",
            )
        )
        if pos > 0
    ]
    if stops:
        segment = segment[: min(stops)]
    cleaned = segment.strip(" ：:;；")[:max_len]
    cleaned = re.sub(r"[一二三四五六七八九十]+[、.．]\s*[【\[]?$", "", cleaned).strip()
    return cleaned or MISSING


def is_online_plan(plan: dict[str, str]) -> bool:
    text = " ".join(str(plan.get(key, "")) for key in ("location", "city", "address", "online_url"))
    return any(word in text for word in ("直播", "线上", "在线", "远程"))


def classify_course_type(source_entry: str, detail_text: str, plans: list[dict[str, str]]) -> tuple[str, str]:
    if source_entry == "internal":
        return "INTERNAL", "zpedu_internal_seed"
    if plans:
        if all(is_online_plan(plan) for plan in plans):
            return "OPEN_ONLINE", "zpedu_public_schedule_online_only"
        return "OPEN_OFFLINE", "zpedu_public_schedule_has_city"
    if any(word in detail_text for word in ("线上培训", "在线培训", "直播课程", "直播班")):
        return "OPEN_ONLINE", "zpedu_online_keyword"
    return "INTERNAL", "zpedu_no_public_schedule_conservative_internal"


def extract_category(category_text: str, fallback: str = MISSING) -> str:
    if category_text == MISSING:
        return fallback
    parts = [part.strip() for part in re.split(r"[>›/]", category_text) if part.strip()]
    ignored = {"首页", "培训课程", "公开课", "面授课程", "企业内训", "课程"}
    for part in reversed(parts):
        if part not in ignored and len(part) <= 20:
            return part
    return fallback


def parse_course_detail_html(item: dict[str, str], html: str) -> Dict[str, Any]:
    url = item["url"]
    detail_html = extract_detail_html(html)
    detail_text = clean_html(detail_html)
    title = re.search(r'<h1 class="art-tit">(.*?)</h1>', html, flags=re.S)
    category = re.findall(r'<div class="blk pos">([\s\S]*?)</div>', html)
    category_text = clean_html(category[0]) if category else MISSING
    images = extract_images(detail_html)
    summary = meta_content(html, "description")
    media_assets = ([media_asset("cover", item.get("cover_url", ""), "课程封面")] if item.get("cover_url") else [])
    media_assets += [media_asset("detail_image", url, "课程详情图片") for url in images]
    price_raw = extract_price_raw(detail_text)
    final_price_raw = price_raw if price_raw != MISSING else "培训咨询"
    outcomes = extract_after_label(detail_text, "培训收益")
    if outcomes == MISSING:
        outcomes = extract_after_label(detail_text, "课程收益")
    source_entry = item.get("source_entry", "internal")
    plans = parse_plans(detail_text)
    course_type, type_evidence = classify_course_type(source_entry, detail_text, plans)
    first_plan = plans[0] if plans else {}
    first_location = first_plan.get("location") or MISSING
    first_date = first_plan.get("start_date") or MISSING
    schedule_text = f"{first_date} {first_location}".strip() if plans else None
    record = {
        "source_course_id": source_id_from_url(url),
        "source_url": url,
        "title": clean_html(title.group(1)) if title else item.get("list_title", MISSING),
        "type": course_type,
        "category_name_raw": extract_category(category_text, item.get("category_name_raw", MISSING)),
        "cover_url": item.get("cover_url") or (images[0] if images else ""),
        "intro": summary if summary != MISSING else (item.get("list_summary") or detail_text[:800]),
        "summary": (summary if summary != MISSING else detail_text)[:500],
        "syllabus": detail_text,
        "audience": extract_after_label(detail_text, "培训对象")
        if extract_after_label(detail_text, "培训对象") != MISSING
        else extract_after_label(detail_text, "课程对象"),
        "highlights": extract_after_label(detail_text, "培训收益")
        if extract_after_label(detail_text, "培训收益") != MISSING
        else extract_after_label(detail_text, "课程收益"),
        "duration_days": parse_duration_days(detail_text),
        "price": parse_price(detail_text),
        "price_raw": final_price_raw,
        "trainer_name_raw": MISSING,
        "plans_json": plans,
        "schedule": schedule_text,
        "city_name_raw": first_location if first_location != MISSING and not is_online_plan(first_plan) else None,
        "learning_outcomes": outcomes,
        "services_json": media_assets,
        "raw_json": {
            "media_assets": media_assets,
            "detail_text_len": len(detail_text),
            "crawled_at": datetime.now().isoformat(),
            "source_entry": source_entry,
            "type_evidence": type_evidence,
            "field_sources": {
                "category_name_raw": "breadcrumb",
                "plans_json": "detail_text schedule",
                "learning_outcomes": "detail_text 培训收益/课程收益",
                "audience": "detail_text 培训对象/课程对象",
            },
        },
    }
    set_price_fields(record, final_price_raw)
    enrich_course_record(record, fallback_type=course_type)
    record["type"] = course_type
    record["raw_json"]["type_evidence"] = type_evidence
    record["raw_json"]["content_type"] = detect_content_type(detail_text, record.get("title"), record.get("summary"))
    if source_entry == "recorded" or any(host in url for host in RECORDED_HOSTS):
        record["raw_json"]["content_type"] = "RECORDED_VIDEO"
        append_diagnostic(record, "content_type", "recorded_course_entry_skipped", record["raw_json"]["content_type"])
    return record


def parse_course_detail(item: dict[str, str]) -> Dict[str, Any]:
    return parse_course_detail_html(item, fetch_text(item["url"]))


def iter_zpedu_courses(max_items: int | None = None):
    limit = max_items or 100
    open_quota = max(1, limit // 2)
    internal_quota = max(1, limit - open_quota)
    items = discover_course_items(list(OPEN_SEED_URLS), limit=open_quota, source_entry="open")
    items += discover_course_items(list(INTERNAL_SEED_URLS), limit=internal_quota, source_entry="internal")
    seen: set[str] = set()
    for item in items[:limit]:
        key = item["url"]
        if key in seen:
            continue
        seen.add(key)
        try:
            record = parse_course_detail(item)
            if record["raw_json"].get("content_type") in {"RECORDED_VIDEO", "DOCUMENT", "AUDIO"}:
                continue
            yield record
        except Exception as exc:
            logger.warning("zpedu course 详情页抓取失败，跳过 url=%s error=%s", item.get("url"), exc)
        time.sleep(0.1)


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class ZpeduCourseSpider:
    """中培伟业课程爬虫适配器，供 JobManager 调用。"""

    name = "zpedu_course"
    source = "zpedu"
    data_type = "COURSE"
    max_items = None
    supported_course_types = ("INTERNAL", "OPEN_OFFLINE", "OPEN_ONLINE")
    coverage_note = "IT 培训源，企业内训、认证公开课和线上培训需按详情证据区分。"

    def pause(self) -> None:
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_zpedu_courses(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
