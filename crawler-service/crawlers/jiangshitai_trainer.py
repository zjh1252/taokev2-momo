"""讲师台讲师爬虫适配器。"""
import asyncio
import logging
import re
import time
from datetime import datetime
from typing import Any, AsyncGenerator, Dict

from crawlers.media import media_asset
from crawlers.jiangshitai_course import BASE_URL, MISSING, absolute_url, clean_html, fetch_text, meta_content


logger = logging.getLogger(__name__)


def discover_trainer_links(limit: int = 80) -> list[str]:
    html = fetch_text(f"{BASE_URL}/j_4_0_0_0_0_0.html")
    links: list[str] = []
    seen: set[str] = set()
    for href in re.findall(r'https://www\.jiangshitai\.com/lecturer/[^"\']+\.html', html):
        if href in seen or "/course.html" in href or "/brief.html" in href:
            continue
        seen.add(href)
        links.append(href)
        if len(links) >= limit:
            break
    return links


def source_id_from_url(url: str) -> str:
    match = re.search(r"/lecturer/([^/]+)\.html", url)
    return match.group(1) if match else url.rstrip("/").rsplit("/", 1)[-1]


def extract_bio(html: str) -> str:
    """只提取讲师详情页“简介”板块正文，避开页面头部和弹窗模板。"""
    match = re.search(
        r'<div class="s_tit">\s*<h3>简介</h3>[\s\S]*?</div>\s*'
        r'<div class="signature">\s*<section class="simditor">\s*<section class="simditor-body">([\s\S]*?)</section>\s*</section>',
        html,
        re.I,
    )
    if match:
        return clean_html(match.group(1))
    return MISSING


def parse_trainer_detail(url: str) -> Dict[str, Any]:
    html = fetch_text(url)
    name_match = re.search(r'<h1[^>]*>[\s\S]*?<a[^>]*>(.*?)</a>[\s\S]*?</h1>', html, re.I)
    title_match = re.search(r'<div class="f-user-2">[\s\S]*?<h4>(.*?)</h4>', html, re.I | re.S)
    avatar_match = re.search(r'<img[^>]+class=["\']avatar["\'][^>]+src=["\']([^"\']+)["\']', html, re.I)
    field_match = re.search(r"授课领域：[\s\S]*?<span[^>]*class=[\"'][^\"']*profession[^\"']*[\"'][^>]*>([\s\S]*?)</span>", html, re.I)
    fee_match = re.search(r"授课费用：[\s\S]*?<span[^>]*>([\s\S]*?)</span>", html, re.I)
    bio = extract_bio(html)
    courses = []
    for href, title in re.findall(r'<a[^>]+href=["\'](https://www\.jiangshitai\.com/course/\d+\.html)["\'][^>]*>(.*?)</a>', html, re.I | re.S):
        title_text = clean_html(title)
        record = {"title": title_text, "url": href}
        if title_text != MISSING and record not in courses:
            courses.append(record)
    avatar_url = absolute_url(avatar_match.group(1)) if avatar_match else meta_content(html, "og:image")
    name = clean_html(name_match.group(1)) if name_match else meta_content(html, "og:title").replace("讲师", "")
    return {
        "source_trainer_id": source_id_from_url(url),
        "source_url": url,
        "name": name,
        "title": clean_html(title_match.group(1)) if title_match else meta_content(html, "description")[:64],
        "avatar": avatar_url,
        "bio": bio,
        "intro": meta_content(html, "description"),
        "good_at": clean_html(field_match.group(1)) if field_match else MISSING,
        "expertise_tags": clean_html(field_match.group(1)) if field_match else MISSING,
        "partial_clients": MISSING,
        "education_json": [],
        "experience_json": [],
        "honors_json": [],
        "books_json": [],
        "courses_json": courses[:20],
        "cases_json": [],
        "evaluation_json": [],
        "raw_json": {
            "fee_raw": clean_html(fee_match.group(1)) if fee_match else MISSING,
            "media_assets": [media_asset("avatar", avatar_url, "专家头像")] if avatar_url else [],
            "detail_text_len": len(bio),
            "crawled_at": datetime.now().isoformat(),
        },
    }


def iter_jiangshitai_trainers(max_items: int | None = None):
    limit = max_items or 100
    for url in discover_trainer_links(limit=limit):
        try:
            yield parse_trainer_detail(url)
        except Exception as exc:
            logger.warning("jiangshitai trainer 详情页抓取失败，跳过 url=%s error=%s", url, exc)
        time.sleep(0.1)


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class JiangshitaiTrainerSpider:
    """讲师台讲师爬虫适配器，供 JobManager 调用。"""

    name = "jiangshitai_trainer"
    source = "jiangshitai"
    data_type = "TRAINER"
    max_items = None

    def pause(self) -> None:
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_jiangshitai_trainers(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
