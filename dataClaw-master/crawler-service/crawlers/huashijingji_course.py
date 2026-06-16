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

from crawlers.media import media_asset, normalize_url


BASE_URL = "https://www.huashijingji.com"
LIST_URL = f"{BASE_URL}/index/course/index"
KNOWN_PAGES = 305
MISSING = "暂无"
logger = logging.getLogger(__name__)


def clean_html(value: Any, default: str = MISSING) -> str:
    if value is None:
        return default
    text = re.sub(r"<[^>]+>", " ", str(value))
    text = " ".join(unescape(text).split())
    return text or default


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
    cards = re.findall(r'<a href="(/index/course/details\?id=\d+)"[^>]*class="course-box(.*?)</a>', html, re.DOTALL)
    for href, card_html in cards:
        cid = re.search(r"id=(\d+)", href)
        title = re.search(r'<h5[^>]*class="title[^"]*"[^>]*>([^<]+)</h5>', card_html)
        cover = re.search(r'data-original="([^"]+)"', card_html) or re.search(r'<img[^>]*src="([^"]+)"', card_html)
        desc = re.search(r'<p class="text[^"]*"[^>]*>(.*?)</p>', card_html, re.DOTALL)
        tags = re.search(r"<label[^>]*>([^<]+)</label>", card_html)
        audience = re.search(r"授课对象[：:]?\s*([^<]*)</p>", card_html)
        trainer = re.search(r"讲师[：:]?\s*([^<]*)</p>", card_html)
        description = clean_html(desc.group(1))[:500] if desc else MISSING
        courses.append(
            {
                "source_course_id": cid.group(1) if cid else "",
                "source_url": f"{BASE_URL}{href}",
                "title": clean_html(title.group(1)) if title else MISSING,
                "type": "OPEN_OFFLINE",
                "category_name_raw": clean_html(tags.group(1)) if tags else MISSING,
                "cover_url": normalize_url(BASE_URL, cover.group(1) if cover else ""),
                "intro": description,
                "summary": description,
                "syllabus": MISSING,
                "audience": clean_html(audience.group(1)) if audience else MISSING,
                "highlights": MISSING,
                "duration_days": 0,
                "keywords": clean_html(tags.group(1)) if tags else MISSING,
                "trainer_name_raw": clean_html(trainer.group(1)) if trainer else MISSING,
                "plans_json": [],
                "evaluation_json": [],
                "target_audience": clean_html(audience.group(1)) if audience else MISSING,
                "learning_outcomes": MISSING,
                "services_json": [],
            }
        )
    return courses


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

    for page in range(1, KNOWN_PAGES + 1):
        url = LIST_URL if page == 1 else f"{LIST_URL}?page={page}"
        try:
            rows = parse_list(fetch_text(url))
        except Exception as exc:
            logger.warning("huashijingji course 列表页抓取失败，跳过 page=%s url=%s error=%s", page, url, exc)
            continue
        if not rows:
            break
        for item in rows:
            key = item["source_course_id"] or item["source_url"]
            if key in seen:
                continue
            seen.add(key)
            detail_error = ""
            try:
                detail = parse_detail(fetch_text(item["source_url"]))
                item.update({k: v for k, v in detail.items() if v not in ("", None)})
            except Exception as exc:
                detail_error = str(exc)
            media_assets = [media_asset("cover", item["cover_url"], "课程封面")] if item.get("cover_url") else []
            if media_assets:
                item["services_json"] = media_assets
            item["raw_json"] = {**item, "media_assets": media_assets, "crawled_at": datetime.now().isoformat()}
            if detail_error:
                item["raw_json"]["detail_error"] = detail_error
            yield item
            emitted += 1
            if max_items and emitted >= max_items:
                return
        time.sleep(0.1)

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
