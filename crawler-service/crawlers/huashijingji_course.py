"""
华师经纪课程爬虫。

依据 crawler-mvp/app.py 和 crawler-poc/docs/03-huashijingji.md 中
已经验证过的 SSR 列表页解析逻辑迁移。
"""
import asyncio
import logging
import re
import ssl
import time
import urllib.request
from datetime import datetime
from html import unescape
from typing import Any, AsyncGenerator, Dict, List

from bs4 import BeautifulSoup

from crawlers.course_utils import append_diagnostic, detect_content_type, enrich_course_record, set_price_fields
from crawlers.media import media_asset, normalize_url


BASE_URL = "https://www.huashijingji.com"
LIST_URL = f"{BASE_URL}/index/course/index"
COPYRIGHT_ENTRY_URLS = (
    f"{BASE_URL}/index/project/winning",
    f"{BASE_URL}/index/copyright/know",
    f"{BASE_URL}/index/copyright/huayin",
    f"{BASE_URL}/index/copyright/danze",
    f"{BASE_URL}/index/copyright/shimen",
)
ONLINE_ENTRY_URLS = (
    f"{BASE_URL}/index/online/ksb",
    f"{BASE_URL}/index/online/dzkj",
    f"{BASE_URL}/index/online/api",
    f"{BASE_URL}/index/online/content",
    f"{BASE_URL}/index/online/cooperation",
)
KNOWN_PAGES = 305
MISSING = "暂无"
logger = logging.getLogger(__name__)


def clean_html(value: Any, default: str = MISSING) -> str:
    if value is None:
        return default
    text = re.sub(r"<[^>]+>", " ", str(value))
    text = " ".join(unescape(text).split())
    return text or default


def soup_text(node: Any, default: str = MISSING) -> str:
    if node is None:
        return default
    return clean_html(node.get_text(" ", strip=True), default)


def absolute_url(href: str) -> str:
    if not href:
        return ""
    if href.startswith("http://") or href.startswith("https://"):
        return href
    return f"{BASE_URL}{href}" if href.startswith("/") else f"{BASE_URL}/{href}"


def first_match(text: str, patterns: List[str], default: str = MISSING) -> str:
    for pattern in patterns:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return clean_html(match.group(1), default)
    return default


def fetch_text(url: str, timeout: int = 10, retries: int = 3) -> str:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
    )
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read().decode(resp.headers.get_content_charset() or "utf-8", errors="ignore")
        except (urllib.error.URLError, urllib.error.HTTPError, ConnectionResetError, TimeoutError, ssl.SSLError, OSError) as exc:
            last_error = exc
            if attempt >= retries:
                break
            time.sleep(0.5 * attempt)
    raise RuntimeError(f"请求失败，已重试 {retries} 次: {url}; {last_error}")


def parse_list(html: str) -> List[Dict[str, Any]]:
    courses: List[Dict[str, Any]] = []
    page = BeautifulSoup(html, "html.parser")
    for card in page.select("a.course-box"):
        href = card.get("href", "")
        if "/index/course/details" not in href:
            continue
        cid = re.search(r"id=(\d+)", href)
        title = soup_text(card.select_one(".title"), "")
        cover_el = card.select_one("img")
        cover = cover_el.get("data-original") or cover_el.get("src", "") if cover_el else ""
        description = soup_text(card.select_one("p.text"), MISSING)
        category = soup_text(card.select_one("label"), MISSING)
        card_text = soup_text(card, "")
        audience = first_match(card_text, [r"授课对象[：:]?\s*(.+?)(?:讲师[：:]|$)"])
        trainer = first_match(card_text, [r"讲师[：:]?\s*(.+)$"])
        courses.append(
            {
                "source_course_id": cid.group(1) if cid else "",
                "source_url": absolute_url(href),
                "title": title or MISSING,
                "type": "INTERNAL",
                "category_name_raw": category,
                "cover_url": normalize_url(BASE_URL, cover),
                "intro": description,
                "summary": description,
                "syllabus": description if len(description) > 80 else MISSING,
                "audience": audience,
                "highlights": description,
                "duration_days": 0,
                "keywords": category,
                "trainer_name_raw": trainer,
                "plans_json": [],
                "evaluation_json": [],
                "target_audience": audience,
                "learning_outcomes": description,
                "services_json": [],
                "raw_json": {
                    "source_entry": "course",
                    "source_entry_name": "找课程",
                    "field_sources": {
                        "category_name_raw": "course card label",
                        "learning_outcomes": "course card description",
                        "audience": "course card 授课对象",
                        "trainer_name_raw": "course card 讲师",
                    },
                },
            }
        )
    return courses


def parse_category_links(html: str, limit: int = 20) -> List[str]:
    page = BeautifulSoup(html, "html.parser")
    links: List[str] = []
    seen: set[str] = set()
    for anchor in page.select('a[href*="/index/course/index?fid="]'):
        href = anchor.get("href", "")
        url = absolute_url(href)
        if url in seen:
            continue
        seen.add(url)
        links.append(url)
        if len(links) >= limit:
            break
    return links


def parse_copyright_detail(html: str, url: str) -> Dict[str, Any]:
    page = BeautifulSoup(html, "html.parser")
    title = soup_text(page.select_one("h1"), "")
    if not title:
        title = soup_text(page.select_one("title"), MISSING)
    text = soup_text(page, "")
    meta_desc = ""
    meta = page.select_one('meta[name="description"]')
    if meta:
        meta_desc = clean_html(meta.get("content", ""), "")
    summary = meta_desc or clean_html(text[:800], MISSING)
    cover = ""
    for img in page.select("img"):
        src = img.get("data-original") or img.get("src", "")
        if src and not any(skip in src for skip in ("logo", "tel.png", "favicon")):
            cover = src
            break
    category = "版权课程"
    item = {
        "source_course_id": url.rstrip("/").rsplit("/", 1)[-1],
        "source_url": url,
        "title": title.replace(" - 华师经纪", ""),
        "type": "INTERNAL",
        "category_name_raw": category,
        "cover_url": normalize_url(BASE_URL, cover),
        "intro": summary,
        "summary": summary[:500],
        "syllabus": first_match(text, [r"(?:课程体系|课程内容|项目内容|核心模块)\s*(.+?)(?:适用|服务|合作|$)"], MISSING),
        "audience": first_match(text, [r"(?:适用对象|适合对象|服务对象|目标客户)\s*(.+?)(?:课程|项目|服务|$)"], MISSING),
        "highlights": first_match(text, [r"(?:课程特色|项目特色|核心优势|产品优势)\s*(.+?)(?:课程|项目|服务|$)"], summary[:500]),
        "duration_days": 0,
        "keywords": category,
        "trainer_name_raw": MISSING,
        "plans_json": [],
        "evaluation_json": [],
        "target_audience": MISSING,
        "learning_outcomes": first_match(text, [r"(?:课程收益|项目收益|学习收益|培训收益)\s*(.+?)(?:课程|项目|服务|$)"], summary),
        "services_json": [],
        "raw_json": {
            "source_entry": "copyright",
            "source_entry_name": "版权课程",
            "field_sources": {
                "summary": "meta description/page text",
                "category_name_raw": "版权课程入口",
            },
        },
    }
    set_price_fields(item, "项目咨询")
    return item


def parse_online_entry(html: str, url: str) -> Dict[str, Any]:
    page = BeautifulSoup(html, "html.parser")
    title = soup_text(page.select_one("h1"), "")
    if not title:
        title = soup_text(page.select_one("title"), MISSING)
    text = soup_text(page, "")
    return {
        "source_url": url,
        "title": title,
        "content_type": detect_content_type(text, "线上课程 电子课件 API 课件 内容资源"),
        "reason": "online_or_courseware_entry_not_imported_to_courses",
    }


def finalize_course_record(item: Dict[str, Any], *, media_assets: List[Dict[str, Any]], detail_error: str = "") -> Dict[str, Any]:
    if media_assets:
        item["services_json"] = media_assets
    raw_json = item.get("raw_json") if isinstance(item.get("raw_json"), dict) else {}
    item["raw_json"] = {**raw_json, "media_assets": media_assets, "crawled_at": datetime.now().isoformat()}
    set_price_fields(item, item.get("price_raw") or item["raw_json"].get("price_raw") or "培训咨询")
    if detail_error:
        item["raw_json"]["detail_error"] = detail_error
        append_diagnostic(item, "detail", "detail_fetch_failed", detail_error)
    enrich_course_record(item, fallback_type="INTERNAL")
    if item["raw_json"].get("source_entry") in {"course", "copyright"} and not item.get("plans_json"):
        item["type"] = "INTERNAL"
        item["raw_json"]["type_evidence"] = f"{item['raw_json'].get('type_evidence', '')},huashijingji_{item['raw_json'].get('source_entry')}_without_public_schedule"
    return item


def parse_price_value(price_text: str) -> float:
    match = re.search(r"\d+(?:\.\d+)?", price_text.replace(",", ""))
    return float(match.group()) if match else 0


def extract_section(html: str, title: str) -> str:
    match = re.search(
        rf'<h3[^>]*>{re.escape(title)}</h3>[\s\S]*?<p style="white-space:\s*pre-line"[^>]*>(.*?)</p>',
        html,
        re.DOTALL,
    )
    return clean_html(match.group(1)) if match else MISSING


def parse_detail(html: str) -> Dict[str, Any]:
    detail: Dict[str, Any] = {}

    title = re.search(r'<h1[^>]*>([^<]+)</h1>', html)
    if title:
        detail["title"] = clean_html(title.group(1))

    meta = re.search(r'<div class="bg-page-2[^"]*"[^>]*>(.*?)</div>', html, re.DOTALL)
    if meta:
        meta_text = clean_html(meta.group(1), "")
        price_text_match = re.search(r"价格[：:]\s*([^\n ]+)", meta_text)
        duration_match = re.search(r"上课时间[：:]\s*([0-9.]+)\s*天", meta_text)
        audience_match = re.search(r"授课对象[：:]\s*(.+?)(?:授课讲师|$)", meta_text)
        trainer_match = re.search(r"授课讲师[：:]\s*(.+)$", meta_text)
        if price_text_match:
            price_text = clean_html(price_text_match.group(1), "")
            detail["price_text"] = price_text or MISSING
            detail["price_raw"] = price_text or MISSING
            detail["price"] = parse_price_value(price_text)
        if duration_match:
            detail["duration_days"] = parse_price_value(duration_match.group(1))
        if audience_match:
            audience = clean_html(audience_match.group(1))
            detail["audience"] = audience
            detail["target_audience"] = audience
        if trainer_match:
            detail["trainer_name_raw"] = clean_html(trainer_match.group(1))

    background = extract_section(html, "课程背景")
    if background != MISSING:
        detail["intro"] = background
        detail["summary"] = background[:500]

    objectives = extract_section(html, "课程目标")
    if objectives == MISSING:
        objectives = extract_section(html, "课程收益")
    if objectives != MISSING:
        detail["learning_outcomes"] = objectives
        detail["highlights"] = objectives[:500]

    syllabus = extract_section(html, "课程大纲")
    if syllabus != MISSING:
        detail["syllabus"] = syllabus

    return detail


def iter_huashijingji_courses(max_items: int | None = None):
    seen: set[str] = set()
    emitted = 0
    list_urls = [LIST_URL]

    try:
        first_page = fetch_text(LIST_URL)
        list_urls.extend(parse_category_links(first_page, limit=12))
        page_rows = parse_list(first_page)
    except Exception as exc:
        logger.warning("huashijingji course 首页抓取失败 url=%s error=%s", LIST_URL, exc)
        page_rows = []

    for item in page_rows:
        key = item["source_course_id"] or item["source_url"]
        if key in seen:
            continue
        seen.add(key)
        detail_error = ""
        try:
            detail = parse_detail(fetch_text(item["source_url"], timeout=5, retries=1))
            item.update({k: v for k, v in detail.items() if v not in ("", None, MISSING)})
        except Exception as exc:
            detail_error = str(exc)
        media_assets = [media_asset("cover", item["cover_url"], "课程封面")] if item.get("cover_url") else []
        finalize_course_record(item, media_assets=media_assets, detail_error=detail_error)
        if item["raw_json"].get("content_type") in {"RECORDED_VIDEO", "DOCUMENT", "AUDIO"}:
            continue
        yield item
        emitted += 1
        if max_items and emitted >= max_items:
            return

    for url in list_urls[1:]:
        try:
            rows = parse_list(fetch_text(url))
        except Exception as exc:
            logger.warning("huashijingji course 分类页抓取失败，跳过 url=%s error=%s", url, exc)
            continue
        for item in rows:
            key = item["source_course_id"] or item["source_url"]
            if key in seen:
                continue
            seen.add(key)
            detail_error = ""
            try:
                detail = parse_detail(fetch_text(item["source_url"], timeout=5, retries=1))
                item.update({k: v for k, v in detail.items() if v not in ("", None)})
            except Exception as exc:
                detail_error = str(exc)
            media_assets = [media_asset("cover", item["cover_url"], "课程封面")] if item.get("cover_url") else []
            finalize_course_record(item, media_assets=media_assets, detail_error=detail_error)
            if item["raw_json"].get("content_type") in {"RECORDED_VIDEO", "DOCUMENT", "AUDIO"}:
                continue
            yield item
            emitted += 1
            if max_items and emitted >= max_items:
                return
        time.sleep(0.1)

    for url in COPYRIGHT_ENTRY_URLS:
        if max_items and emitted >= max_items:
            return
        try:
            item = parse_copyright_detail(fetch_text(url), url)
        except Exception as exc:
            logger.warning("huashijingji copyright 页面抓取失败，跳过 url=%s error=%s", url, exc)
            continue
        key = item["source_course_id"] or item["source_url"]
        if key in seen:
            continue
        seen.add(key)
        media_assets = [media_asset("cover", item["cover_url"], "课程封面")] if item.get("cover_url") else []
        finalize_course_record(item, media_assets=media_assets)
        if item["raw_json"].get("content_type") in {"RECORDED_VIDEO", "DOCUMENT", "AUDIO"}:
            continue
        yield item
        emitted += 1

    for url in ONLINE_ENTRY_URLS:
        try:
            info = parse_online_entry(fetch_text(url), url)
            logger.info("huashijingji online entry skipped: %s", info)
        except Exception as exc:
            logger.warning("huashijingji online 页面识别失败 url=%s error=%s", url, exc)

def crawl_huashijingji_courses(max_items: int | None = None) -> List[Dict[str, Any]]:
    return list(iter_huashijingji_courses(max_items))


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class HuashiJingjiCourseSpider:
    """华师经纪课程爬虫适配器，供 JobManager 调用。"""

    name = "huashijingji_course"
    source = "huashijingji"
    data_type = "COURSE"
    max_items = None
    supported_course_types = ("INTERNAL", "OPEN_ONLINE")
    coverage_note = "课程经纪/版权/线上课程入口并存，当前以内训或线上课程证据兜底诊断。"

    def pause(self) -> None:
        """兼容 JobManager 的取消流程。"""
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_huashijingji_courses(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
