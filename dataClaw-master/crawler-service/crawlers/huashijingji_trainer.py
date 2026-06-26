"""
华师经纪讲师爬虫。

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
LIST_URL = f"{BASE_URL}/index/teacher/index"
KNOWN_PAGES = 34
MISSING = "暂无"
logger = logging.getLogger(__name__)


def clean_html(value: Any, default: str = MISSING) -> str:
    if value is None:
        return default
    text = re.sub(r"<[^>]+>", " ", str(value))
    text = " ".join(unescape(unescape(text)).split())
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
    trainers: List[Dict[str, Any]] = []
    cards = re.findall(r'<a href="(/index/teacher/home\?id=\d+)"[^>]*class="teacher-box[^"]*"(.*?)</a>', html, re.DOTALL)
    for href, card_html in cards:
        tid = re.search(r"id=(\d+)", href)
        avatar = re.search(r'<img[^>]*src="([^"]+)"', card_html)
        name = re.search(r"<h5[^>]*>([^<]+)</h5>", card_html)
        city = re.search(r'<p class="text-black-50[^"]*">([^<]+)</p>', card_html)
        expertise = re.search(r"擅长[：:]?\s*(.*?)</p>", card_html, re.DOTALL)
        title = re.search(r'<p class="flex-1[^"]*">([^<]+)</p>', card_html)
        trainers.append(
            {
                "source_trainer_id": tid.group(1) if tid else "",
                "source_url": f"{BASE_URL}{href}",
                "name": clean_html(name.group(1)) if name else MISSING,
                "title": clean_html(title.group(1)) if title else MISSING,
                "avatar": normalize_url(BASE_URL, avatar.group(1) if avatar else ""),
                "city": clean_html(city.group(1)) if city else MISSING,
                "bio": MISSING,
                "intro": MISSING,
                "good_at": clean_html(expertise.group(1)) if expertise else MISSING,
                "expertise_tags": clean_html(expertise.group(1)) if expertise else MISSING,
                "partial_clients": MISSING,
                "education_json": [],
                "experience_json": [],
                "honors_json": [],
                "books_json": [],
                "courses_json": [],
                "cases_json": [],
                "evaluation_json": {},
            }
        )
    return trainers


def parse_detail(html: str) -> Dict[str, Any]:
    """从讲师主页补充个人资历和主讲课程。"""
    detail: Dict[str, Any] = {}

    bio = re.search(r'<p style="white-space:\s*pre-line"[^>]*>(.*?)</p>', html, re.DOTALL)
    if bio:
        bio_text = clean_html(bio.group(1))
        detail["bio"] = bio_text
        detail["intro"] = bio_text

    courses = []
    for card in re.findall(r'<a href="(/index/[Cc]ourse/details\?id=\d+)"[^>]*class="course-box(.*?)</a>', html, re.DOTALL):
        href, card_html = card
        cid = re.search(r"id=(\d+)", href)
        title = re.search(r'<h5[^>]*>([^<]+)</h5>', card_html)
        tags = re.search(r"<label[^>]*>([^<]*)</label>", card_html)
        audience = re.search(r"授课对象[：:]?\s*([^<]*)</p>", card_html)
        desc = re.search(r'<p class="text[^"]*"[^>]*>(.*?)</p>', card_html, re.DOTALL)
        cover = re.search(r'data-original="([^"]+)"', card_html) or re.search(r'<img[^>]*src="([^"]+)"', card_html)
        title_text = clean_html(title.group(1), "") if title else ""
        if not title_text:
            continue
        courses.append(
            {
                "source_course_id": cid.group(1) if cid else "",
                "title": title_text,
                "category": clean_html(tags.group(1)) if tags else MISSING,
                "audience": clean_html(audience.group(1)) if audience else MISSING,
                "summary": clean_html(desc.group(1)) if desc else MISSING,
                "cover_url": normalize_url(BASE_URL, cover.group(1) if cover else ""),
                "source_url": f"{BASE_URL}{href}",
            }
        )
    if courses:
        detail["courses_json"] = courses

    return detail


def parse_customer_detail(html: str) -> str:
    clients = re.search(r"<h3[^>]*>服务客户</h3>.*?<p[^>]*white-space:\s*pre-line[^>]*>(.*?)</p>", html, re.DOTALL)
    if not clients:
        return MISSING
    return clean_html(clients.group(1))


def parse_cases_detail(html: str) -> List[Dict[str, str]]:
    cases: List[Dict[str, str]] = []
    for title, date in re.findall(
        r'<span\s+class="news2-box[^"]*">[\s\S]*?<h5 class="title[^"]*">([\s\S]*?)</h5>[\s\S]*?<label[^>]*>([\d:\- ]+)</label>',
        html,
        re.DOTALL,
    ):
        case_title = clean_html(title, "")
        if not case_title:
            continue
        cases.append(
            {
                "title": case_title,
                "client": MISSING,
                "description": "",
                "date": clean_html(date, ""),
            }
        )
    return cases


def parse_online_courses_detail(html: str) -> List[Dict[str, str]]:
    courses: List[Dict[str, str]] = []
    for href, cover, label, title in re.findall(
        r'<a href="([^"]+)"[^>]*class="course-thumb"[\s\S]*?<img data-original="([^"]+)"[\s\S]*?<span class="label">([^<]*)</span>[\s\S]*?<h4[^>]*>\s*<a [^>]*>([^<]+)</a>',
        html,
        re.DOTALL,
    ):
        course_title = clean_html(title, "")
        if not course_title:
            continue
        courses.append(
            {
                "title": course_title,
                "category": clean_html(label),
                "cover_url": normalize_url(BASE_URL, cover),
                "source_url": href,
            }
        )
    return courses


def iter_huashijingji_trainers(max_items: int | None = None):
    seen: set[str] = set()
    emitted = 0

    for page in range(1, KNOWN_PAGES + 1):
        url = LIST_URL if page == 1 else f"{LIST_URL}?page={page}"
        try:
            rows = parse_list(fetch_text(url))
        except Exception as exc:
            logger.warning("huashijingji trainer 列表页抓取失败，跳过 page=%s url=%s error=%s", page, url, exc)
            continue
        if not rows:
            break
        for item in rows:
            key = item["source_trainer_id"] or item["source_url"]
            if key in seen:
                continue
            seen.add(key)
            detail_error = ""
            try:
                detail = parse_detail(fetch_text(item["source_url"]))
                item.update({k: v for k, v in detail.items() if v not in ("", None)})
                customer_text = parse_customer_detail(
                    fetch_text(f"{BASE_URL}/index/teacher/customer?id={item['source_trainer_id']}")
                )
                if customer_text != MISSING:
                    item["partial_clients"] = customer_text
                cases = parse_cases_detail(
                    fetch_text(f"{BASE_URL}/index/teacher/cases?id={item['source_trainer_id']}")
                )
                if cases:
                    item["cases_json"] = cases
                online_courses = parse_online_courses_detail(
                    fetch_text(f"{BASE_URL}/index/teacher/video?id={item['source_trainer_id']}")
                )
                if online_courses:
                    item["recorded_courses_json"] = online_courses
            except Exception as exc:
                detail_error = str(exc)
            item["raw_json"] = {
                **item,
                "media_assets": [media_asset("avatar", item["avatar"], "专家头像")] if item.get("avatar") else [],
                "crawled_at": datetime.now().isoformat(),
            }
            if detail_error:
                item["raw_json"]["detail_error"] = detail_error
            yield item
            emitted += 1
            if max_items and emitted >= max_items:
                return
        time.sleep(0.1)

def crawl_huashijingji_trainers(max_items: int | None = None) -> List[Dict[str, Any]]:
    return list(iter_huashijingji_trainers(max_items))


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class HuashiJingjiTrainerSpider:
    """华师经纪讲师爬虫适配器，供 JobManager 调用。"""

    name = "huashijingji_trainer"
    source = "huashijingji"
    data_type = "TRAINER"
    max_items = None

    def pause(self) -> None:
        """兼容 JobManager 的取消流程。"""
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_huashijingji_trainers(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
