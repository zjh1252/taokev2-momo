"""
中华培训讲师网（51jiangshi.com）专家爬虫。

站点列表：/teacher/index.html?page=N
讲师主页：/space_{id}/index.html
"""
import asyncio
import re
import time
import urllib.request
from datetime import datetime
from typing import Any, AsyncGenerator, Dict, List

from bs4 import BeautifulSoup

from crawlers.media import media_asset, normalize_url


BASE_URL = "http://www.51jiangshi.com"
LIST_URL = f"{BASE_URL}/teacher/index.html"
MISSING = "暂无"


def clean_text(text: Any, default: str = MISSING) -> str:
    if text is None:
        return default
    cleaned = re.sub(r"\s+", " ", str(text)).strip()
    return cleaned or default


def parse_int(value: Any, default: int = 0) -> int:
    if value is None:
        return default
    match = re.search(r"\d+", str(value).replace(",", ""))
    return int(match.group()) if match else default


def fetch_html(url: str, referer: str = LIST_URL) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
            ),
            "Referer": referer,
            "Accept-Language": "zh-CN,zh;q=0.9",
        },
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        raw = resp.read()
        charset = resp.headers.get_content_charset() or "gb2312"
        return raw.decode(charset, errors="ignore")


def extract_list_page(html: str) -> List[Dict[str, Any]]:
    trainers: List[Dict[str, Any]] = []
    page = BeautifulSoup(html, "html.parser")

    for card in page.select(".content-list-inner-txt-mode"):
        name_el = card.select_one(".txt-mode-one-newtitle a")
        if not name_el:
            continue

        href = name_el.get("href", "")
        source_trainer_id = ""
        if href:
            match = re.search(r"space_(\d+)", href)
            source_trainer_id = match.group(1) if match else href.rstrip("/").split("_")[-1]
        source_url = normalize_url(BASE_URL, href)

        title_el = card.select_one(".txt-mode-left .txt-mode-one-sub-tips")
        price_el = card.select_one(".txt-mode-right .txt-mode-one-sub-tips")
        price_match = re.search(r"(\d+)\s*元", price_el.get_text(" ", strip=True) if price_el else "")

        expertise_links = []
        for row in card.select(".content-list-inner-txt-mode-two .txt-mode-left"):
            label = row.select_one(".txt-mode-one-title")
            if not label or "擅长" not in label.get_text():
                continue
            expertise_links = [
                clean_text(link.get_text(" ", strip=True), "")
                for link in row.select("a")
            ]
            expertise_links = [tag for tag in expertise_links if tag]

        city = ""
        for row in card.select(".content-list-inner-txt-mode-two .txt-mode-left"):
            label = row.select_one(".txt-mode-one-title")
            if not label or "常驻地" not in label.get_text():
                continue
            city_el = row.select_one(".txt-mode-one-course a") or row.select_one(".txt-mode-one-course")
            city = clean_text(city_el.get_text(" ", strip=True) if city_el else "", "")

        intro_el = card.select_one(".content-list-inner-txt-mode-three")
        avatar_el = card.select_one(".list-img img")

        trainers.append(
            {
                "source_trainer_id": source_trainer_id or clean_text(name_el.get_text(" ", strip=True)),
                "source_url": source_url,
                "name": clean_text(name_el.get_text(" ", strip=True)),
                "title": clean_text(title_el.get_text(" ", strip=True) if title_el else ""),
                "avatar": normalize_url(BASE_URL, avatar_el.get("src", "") if avatar_el else ""),
                "bio": clean_text(intro_el.get_text(" ", strip=True) if intro_el else ""),
                "expertise_tags": ", ".join(expertise_links) if expertise_links else MISSING,
                "city": city or MISSING,
                "daily_price": parse_int(price_match.group(1) if price_match else None, 0),
            }
        )

    return trainers


def extract_detail(html: str) -> Dict[str, Any]:
    page = BeautifulSoup(html, "html.parser")
    intro = page.select_one(".jsjj, .jianjie, .teacher-intro, .content-list-inner-txt-mode-three")
    courses = []
    for link in page.select("a[href*='show_']"):
        title = clean_text(link.get_text(" ", strip=True), "")
        href = link.get("href", "")
        if not title or len(title) < 4:
            continue
        courses.append(
            {
                "title": title,
                "duration": "",
                "category": "",
                "summary": "",
                "cover_url": "",
                "source_url": normalize_url(BASE_URL, href),
            }
        )

    unique_courses: List[Dict[str, Any]] = []
    seen: set[str] = set()
    for course in courses:
        key = course["title"]
        if key in seen:
            continue
        seen.add(key)
        unique_courses.append(course)

    return {
        "bio": clean_text(intro.get_text(" ", strip=True) if intro else "", ""),
        "courses_json": unique_courses[:20],
    }


def normalize_trainer(base: Dict[str, Any], detail: Dict[str, Any] | None = None) -> Dict[str, Any]:
    detail = detail or {}
    avatar = normalize_url(BASE_URL, base.get("avatar") or "")
    bio = detail.get("bio") or base.get("bio") or MISSING
    expertise = base.get("expertise_tags") or MISSING
    courses_json = detail.get("courses_json") or []

    return {
        "source_trainer_id": base.get("source_trainer_id") or base.get("name") or "unknown",
        "source_url": base.get("source_url", ""),
        "name": base.get("name") or MISSING,
        "title": base.get("title") or MISSING,
        "avatar": avatar,
        "bio": bio,
        "intro": bio,
        "good_at": expertise,
        "expertise_tags": expertise,
        "teaching_years": 0,
        "partial_clients": MISSING,
        "city": base.get("city") or MISSING,
        "daily_price": base.get("daily_price") or 0,
        "education_json": [],
        "experience_json": [],
        "honors_json": [],
        "books_json": [],
        "courses_json": courses_json,
        "cases_json": [],
        "evaluation_json": {},
        "raw_json": {
            **base,
            **detail,
            "media_assets": [media_asset("avatar", avatar, "专家头像")] if avatar else [],
            "crawled_at": datetime.now().isoformat(),
        },
    }


def crawl_peixun_trainers(
    max_pages: int = 5,
    with_details: bool = False,
    max_items: int | None = None,
) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    seen_ids: set[str] = set()

    for page_no in range(1, max_pages + 1):
        if max_items is not None and len(results) >= max_items:
            break

        url = LIST_URL if page_no == 1 else f"{LIST_URL}?page={page_no}"
        html = fetch_html(url)
        trainers = extract_list_page(html)
        if not trainers:
            break

        for trainer in trainers:
            if max_items is not None and len(results) >= max_items:
                break

            trainer_id = str(trainer.get("source_trainer_id") or "")
            if trainer_id in seen_ids:
                continue
            seen_ids.add(trainer_id)

            detail = None
            if with_details and trainer.get("source_url"):
                try:
                    detail_html = fetch_html(f"{trainer['source_url'].rstrip('/')}/jianjie.html")
                    detail = extract_detail(detail_html)
                    time.sleep(0.8)
                except Exception:
                    detail = None

            results.append(normalize_trainer(trainer, detail))

        time.sleep(0.6)

    return results


class PeixunTrainerSpider:
    """中华培训讲师网专家爬虫适配器。"""

    name = "peixun_trainer"
    source = "peixun"
    data_type = "TRAINER"
    max_items = None
    max_pages = 5
    with_details = False

    def pause(self) -> None:
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        records = await asyncio.to_thread(
            crawl_peixun_trainers,
            self.max_pages,
            self.with_details,
            self.max_items,
        )
        seen: set[str] = set()
        for record in records:
            key = f"{self.source}:{record.get('source_trainer_id') or record.get('source_url')}"
            if key in seen:
                continue
            seen.add(key)
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
