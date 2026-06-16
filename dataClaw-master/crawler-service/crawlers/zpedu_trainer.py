"""中培伟业专家爬虫适配器。"""
import asyncio
import logging
import re
import time
from datetime import datetime
from typing import Any, AsyncGenerator, Dict

from crawlers.media import media_asset
from crawlers.zpedu_course import BASE_URL, MISSING, absolute_url, clean_html, extract_after_label, extract_detail_html, extract_images, fetch_text


logger = logging.getLogger(__name__)


def discover_trainer_links(limit: int = 80) -> list[str]:
    html = fetch_text(f"{BASE_URL}/zj/")
    links: list[str] = []
    seen: set[str] = set()
    for href in re.findall(r'href=["\']([^"\']+/zj/\d+\.html)["\']', html, flags=re.I):
        full_url = absolute_url(href)
        if full_url in seen:
            continue
        seen.add(full_url)
        links.append(full_url)
        if len(links) >= limit:
            break
    return links


def source_id_from_url(url: str) -> str:
    match = re.search(r"/zj/(\d+)\.html", url)
    return match.group(1) if match else url.rstrip("/").rsplit("/", 1)[-1]


def parse_trainer_detail(url: str) -> Dict[str, Any]:
    html = fetch_text(url)
    detail_html = extract_detail_html(html)
    detail_text = clean_html(detail_html)
    title = re.search(r'<h1 class="art-tit">(.*?)</h1>', html, flags=re.S)
    avatar = re.search(r'<div class="teacher-pic">\s*<img[^>]+src=["\']([^"\']+)["\']', html, flags=re.S)
    images = extract_images(detail_html)
    avatar_url = absolute_url(avatar.group(1)) if avatar else (images[0] if images else "")
    media_assets = [media_asset("avatar", avatar_url, "专家头像")] if avatar_url else []
    expertise = extract_after_label(detail_text, "授课方向及领域专长", 500)
    title_text = expertise[:64] if expertise != MISSING else MISSING
    return {
        "source_trainer_id": source_id_from_url(url),
        "source_url": url,
        "name": clean_html(title.group(1)) if title else MISSING,
        "title": title_text,
        "avatar": avatar_url,
        "bio": detail_text,
        "intro": detail_text,
        "good_at": expertise,
        "expertise_tags": expertise,
        "partial_clients": extract_after_label(detail_text, "服务客户", 1000),
        "education_json": [],
        "experience_json": [],
        "honors_json": [],
        "books_json": [],
        "courses_json": [],
        "cases_json": [],
        "evaluation_json": [],
        "raw_json": {
            "media_assets": media_assets,
            "detail_text_len": len(detail_text),
            "crawled_at": datetime.now().isoformat(),
        },
    }


def iter_zpedu_trainers(max_items: int | None = None):
    limit = max_items or 100
    for url in discover_trainer_links(limit=limit):
        try:
            yield parse_trainer_detail(url)
        except Exception as exc:
            logger.warning("zpedu trainer 详情页抓取失败，跳过 url=%s error=%s", url, exc)
        time.sleep(0.1)


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class ZpeduTrainerSpider:
    """中培伟业专家爬虫适配器，供 JobManager 调用。"""

    name = "zpedu_trainer"
    source = "zpedu"
    data_type = "TRAINER"
    max_items = None

    def pause(self) -> None:
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_zpedu_trainers(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
