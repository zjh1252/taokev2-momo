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

from crawlers.media import media_asset


BASE_URL = "https://www.zpedu.com"
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
    match = re.search(r"/nx/(\d+)\.html", url)
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


def discover_course_items(seed_urls: list[str], limit: int = 50) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    seen: set[str] = set()
    for url in seed_urls:
        html = fetch_text(url)
        for card in re.findall(r"<li>\s*<div class=\"pic\">([\s\S]*?)</span>", html, flags=re.I):
            href_match = re.search(r'href=["\']([^"\']+/nx/\d+\.html)["\']', card, flags=re.I)
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
                }
            )
            if len(items) >= limit:
                return items
        time.sleep(0.1)
    return items


def parse_plans(text: str) -> list[dict[str, str]]:
    plans: list[dict[str, str]] = []
    pattern = r"(\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*(?:[-－]\s*\d{1,2})?\s*日)\s*([\u4e00-\u9fa5]{2,8})"
    for date_text, city in re.findall(pattern, text):
        plans.append({"start_date": re.sub(r"\s+", "", date_text).replace("－", "-"), "location": city, "status": "待确认"})
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


def extract_after_label(text: str, label: str, max_len: int = 500) -> str:
    idx = text.find(label)
    if idx < 0:
        return MISSING
    segment = text[idx + len(label):]
    stops = [pos for pos in (segment.find(x) for x in ("培训信息", "培训大纲", "课程大纲", "培训收益", "培训对象")) if pos > 0]
    if stops:
        segment = segment[: min(stops)]
    return segment.strip(" ：:;；")[:max_len] or MISSING


def parse_course_detail(item: dict[str, str]) -> Dict[str, Any]:
    url = item["url"]
    html = fetch_text(url)
    detail_html = extract_detail_html(html)
    detail_text = clean_html(detail_html)
    title = re.search(r'<h1 class="art-tit">(.*?)</h1>', html, flags=re.S)
    category = re.findall(r'<div class="blk pos">([\s\S]*?)</div>', html)
    category_text = clean_html(category[0]) if category else MISSING
    images = extract_images(detail_html)
    summary = meta_content(html, "description")
    media_assets = ([media_asset("cover", item.get("cover_url", ""), "课程封面")] if item.get("cover_url") else [])
    media_assets += [media_asset("detail_image", url, "课程详情图片") for url in images]
    return {
        "source_course_id": source_id_from_url(url),
        "source_url": url,
        "title": clean_html(title.group(1)) if title else item.get("list_title", MISSING),
        "type": "INTERNAL",
        "category_name_raw": category_text.split(">")[-2].strip() if ">" in category_text else MISSING,
        "cover_url": item.get("cover_url") or (images[0] if images else ""),
        "intro": summary if summary != MISSING else (item.get("list_summary") or detail_text[:800]),
        "summary": (summary if summary != MISSING else detail_text)[:500],
        "syllabus": detail_text,
        "audience": extract_after_label(detail_text, "培训对象"),
        "highlights": extract_after_label(detail_text, "培训收益"),
        "duration_days": parse_duration_days(detail_text),
        "price": parse_price(detail_text),
        "trainer_name_raw": MISSING,
        "plans_json": parse_plans(detail_text),
        "services_json": media_assets,
        "raw_json": {
            "media_assets": media_assets,
            "detail_text_len": len(detail_text),
            "crawled_at": datetime.now().isoformat(),
        },
    }


def iter_zpedu_courses(max_items: int | None = None):
    limit = max_items or 100
    items = discover_course_items(
        [
            f"{BASE_URL}/nx/",
            f"{BASE_URL}/ms/",
            f"{BASE_URL}/nx/403/",
            f"{BASE_URL}/nx/406/",
            f"{BASE_URL}/nx/410/",
        ],
        limit=limit,
    )
    for item in items[:limit]:
        try:
            yield parse_course_detail(item)
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
