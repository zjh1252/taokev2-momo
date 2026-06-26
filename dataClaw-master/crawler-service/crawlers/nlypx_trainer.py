"""
哪里有培训网讲师爬虫。

依据 crawler-mvp/app.py 和 crawler-poc/crawler_nlypx_trainer.py 中
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
from urllib.parse import urljoin
from typing import Any, AsyncGenerator, Dict, List

from crawlers.media import media_asset


BASE_URL = "https://www.nlypx.com"
LIST_URL = f"{BASE_URL}/jiangshi/"
KNOWN_PAGES = 230
MISSING = "暂无"
MAX_TITLE_LEN = 64
MAX_TAGS_LEN = 500

logger = logging.getLogger(__name__)

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE


def clean_html(value: Any, default: str = MISSING) -> str:
    if value is None:
        return default
    text = re.sub(r"<[^>]+>", " ", str(value))
    text = " ".join(unescape(text).replace("&nbsp;", " ").split())
    return text or default


def absolute_url(value: str) -> str:
    return urljoin(BASE_URL, value or "")


def derive_title_from_bio(bio: str) -> str:
    text = clean_html(bio, "")
    if not text:
        return MISSING
    if "老师，" in text:
        text = text.split("老师，", 1)[1]
    elif "老师," in text:
        text = text.split("老师,", 1)[1]
    first_line = re.split(r"[。；;\n\r]", text, maxsplit=1)[0].strip()
    return (first_line or text)[:MAX_TITLE_LEN] or MISSING


def clip_text(value: Any, limit: int, default: str = MISSING) -> str:
    text = clean_html(value, default)
    if text == default:
        return default
    return text[:limit]


def fetch_text(url: str, timeout: int = 15) -> str:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
    )
    with urllib.request.urlopen(req, timeout=timeout, context=SSL_CTX) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def extract_intro_sections(html: str) -> Dict[str, str]:
    """从讲师简介页提取结构化内容。"""
    sections: Dict[str, str] = {}
    pattern = re.compile(
        r'<div class="pxsjj_con_r1">\s*<h3[^>]*>(.*?)</h3>\s*<div class="pxsjj_nr">(.*?)</div>\s*</div>',
        re.DOTALL,
    )
    for heading_html, body_html in pattern.findall(html):
        heading = clean_html(heading_html, "")
        body = clean_html(body_html)
        if not heading or body == MISSING:
            continue
        if "简介" in heading:
            sections["bio"] = body
        elif "培训课程" in heading:
            sections["training_courses_text"] = body
        elif "客户" in heading or "Case" in heading:
            sections["partial_clients"] = body
    return sections


def extract_course_page(html: str) -> tuple[List[Dict[str, str]], int]:
    """从讲师课程页提取课程列表和总页数。"""
    courses: List[Dict[str, str]] = []
    blocks = re.findall(r'<a id="pxswz_wz" href="([^"]+)">(.*?)</a>', html, re.DOTALL)
    for href, block in blocks:
        title = re.search(r"<h4>(.*?)</h4>", block, re.DOTALL)
        summary = re.search(r"<p>(.*?)</p>", block, re.DOTALL)
        trainer = re.search(r"<dd>\s*<span>(.*?)</span>", block, re.DOTALL)
        duration = re.search(r"<strong>(.*?)</strong>\s*<em>培训时长</em>", block, re.DOTALL)
        title_text = clean_html(title.group(1), "") if title else ""
        if not title_text:
            continue
        cid = re.search(r"/gkk_detail/(\d+)\.html", href)
        courses.append(
            {
                "source_course_id": cid.group(1) if cid else "",
                "title": title_text,
                "summary": clean_html(summary.group(1)) if summary else MISSING,
                "trainer": clean_html(trainer.group(1)) if trainer else MISSING,
                "duration": clean_html(duration.group(1)) if duration else MISSING,
                "source_url": absolute_url(href),
            }
        )
    page_match = re.search(r"(\d+)\s*条记录\s*\d+/(\d+)\s*页", html)
    total_pages = int(page_match.group(2)) if page_match else 1
    return courses, total_pages


def extract_video_page(html: str) -> tuple[List[Dict[str, str]], int]:
    videos: List[Dict[str, str]] = []
    for href, img, title in re.findall(
        r'<a href="(/video_detail/\d+\.html)"[^>]*><img src="([^"]+)"[^>]* /><span>\s*(.*?)</span><em>',
        html,
        re.DOTALL,
    ):
        title_text = clean_html(title, "")
        if not title_text:
            continue
        videos.append(
            {
                "title": title_text,
                "cover_url": absolute_url(img),
                "source_url": absolute_url(href),
            }
        )
    page_match = re.search(r"(\d+)\s*条记录\s*\d+/(\d+)\s*页", html)
    total_pages = int(page_match.group(2)) if page_match else 1
    return videos, total_pages


def fetch_trainer_detail(source_id: str) -> Dict[str, Any]:
    detail: Dict[str, Any] = {}
    if not source_id:
        return detail

    intro_url = f"{BASE_URL}/js_intro/{source_id}.html"
    try:
        intro_html = fetch_text(intro_url)
        detail.update(extract_intro_sections(intro_html))
    except Exception as exc:
        detail["detail_error"] = f"intro: {exc}"

    courses: List[Dict[str, str]] = []
    try:
        first_url = f"{BASE_URL}/js_kc/{source_id}.html"
        first_html = fetch_text(first_url)
        first_courses, total_pages = extract_course_page(first_html)
        courses.extend(first_courses)
        for page in range(2, total_pages + 1):
            page_html = fetch_text(f"{first_url}?&p={page}")
            page_courses, _ = extract_course_page(page_html)
            courses.extend(page_courses)
            time.sleep(0.05)
    except Exception as exc:
        detail["course_error"] = f"courses: {exc}"

    if courses:
        detail["courses_json"] = courses

    videos: List[Dict[str, str]] = []
    try:
        first_url = f"{BASE_URL}/js_video/{source_id}.html"
        first_html = fetch_text(first_url)
        first_videos, total_pages = extract_video_page(first_html)
        videos.extend(first_videos)
        for page in range(2, total_pages + 1):
            page_html = fetch_text(f"{first_url}?&p={page}")
            page_videos, _ = extract_video_page(page_html)
            videos.extend(page_videos)
            time.sleep(0.05)
    except Exception as exc:
        detail["video_error"] = f"videos: {exc}"

    if videos:
        detail["recorded_courses_json"] = videos
    return detail


def parse_list(html: str) -> List[Dict[str, Any]]:
    trainers: List[Dict[str, Any]] = []
    cards = re.findall(r'<div class="jslb_con">(.*?)<div class="clear"></div>\s*</div>', html, re.DOTALL)
    for card in cards:
        tid = re.search(r'<a href="/jiangshi/(\d+)\.html"', card)
        avatar = re.search(r'<img[^>]*src="([^"]+)"', card)
        name = re.search(r"<h4[^>]*>.*?<a[^>]*>([^<]+)</a>", card, re.DOTALL)
        city = re.search(r'<p class="add"><a[^>]*>([^<]+)</a>', card)
        course_html = re.search(r'<p class="zjkc"><a[^>]*>(.*?)</a></p>', card, re.DOTALL)
        bio = re.search(r'<p class="jsjj"><a[^>]*>(.*?)</a></p>', card, re.DOTALL)
        source_id = tid.group(1) if tid else ""
        courses = []
        if course_html:
            courses = [{"title": clean_html(title)} for title in re.findall(r"《([^》]+)》", course_html.group(1))]
        trainers.append(
            {
                "source_trainer_id": source_id,
                "source_url": f"{BASE_URL}/jiangshi/{source_id}.html" if source_id else "",
                "name": clean_html(name.group(1)) if name else MISSING,
                "title": MISSING,
                "avatar": absolute_url(avatar.group(1).strip()) if avatar else "",
                "city": clean_html(city.group(1)) if city else MISSING,
                "bio": clean_html(bio.group(1)) if bio else MISSING,
                "intro": clean_html(bio.group(1)) if bio else MISSING,
                "good_at": MISSING,
                "expertise_tags": MISSING,
                "partial_clients": MISSING,
                "education_json": [],
                "experience_json": [],
                "honors_json": [],
                "books_json": [],
                "courses_json": courses,
                "cases_json": [],
                "recorded_courses_json": [],
                "evaluation_json": [],
            }
        )
    return trainers


def iter_nlypx_trainers(max_items: int | None = None):
    seen: set[str] = set()
    emitted = 0

    for page in range(1, KNOWN_PAGES + 1):
        url = LIST_URL if page == 1 else f"{BASE_URL}/jiangshi/index_{page}.html"
        try:
            rows = parse_list(fetch_text(url))
        except Exception as exc:
            logger.warning("nlypx trainer 列表页抓取失败，跳过 page=%s url=%s error=%s", page, url, exc)
            continue
        if not rows:
            break
        for item in rows:
            key = item["source_trainer_id"] or item["source_url"]
            if key in seen:
                continue
            seen.add(key)
            list_bio = item.get("bio") or MISSING
            detail = fetch_trainer_detail(item["source_trainer_id"])
            full_bio = detail.get("bio") or item.get("bio") or MISSING
            training_courses_text = detail.get("training_courses_text") or MISSING
            if training_courses_text != MISSING:
                item["good_at"] = training_courses_text
                item["expertise_tags"] = clip_text(training_courses_text, MAX_TAGS_LEN)
            item["bio"] = full_bio
            item["intro"] = full_bio
            if item.get("title") == MISSING and full_bio != MISSING:
                item["title"] = derive_title_from_bio(full_bio)
            item["title"] = clip_text(item.get("title"), MAX_TITLE_LEN)
            item["partial_clients"] = detail.get("partial_clients") or MISSING
            if detail.get("courses_json"):
                item["courses_json"] = detail["courses_json"]
            if detail.get("recorded_courses_json"):
                item["recorded_courses_json"] = detail["recorded_courses_json"]
            item["raw_json"] = {
                **item,
                "media_assets": [media_asset("avatar", item["avatar"], "专家头像")] if item.get("avatar") else [],
                "source_list_bio": clean_html(list_bio),
                "training_courses_text": training_courses_text,
                "detail_error": detail.get("detail_error", ""),
                "course_error": detail.get("course_error", ""),
                "video_error": detail.get("video_error", ""),
                "crawled_at": datetime.now().isoformat(),
            }
            yield item
            emitted += 1
            if max_items and emitted >= max_items:
                return
            time.sleep(0.05)
        time.sleep(0.15)

def crawl_nlypx_trainers(max_items: int | None = None) -> List[Dict[str, Any]]:
    return list(iter_nlypx_trainers(max_items))


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class NlypxTrainerSpider:
    """哪里有培训网讲师爬虫适配器，供 JobManager 调用。"""

    name = "nlypx_trainer"
    source = "nlypx"
    data_type = "TRAINER"
    max_items = None

    def pause(self) -> None:
        """兼容 JobManager 的取消流程。"""
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_nlypx_trainers(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
