"""
讲师宝课程爬虫。

依据 crawler-poc/crawler_jiangshi_course.py 和
crawler-poc/docs/01-jiangshi99.md 中已经验证过的选择器迁移。
"""
import asyncio
import re
import time
import urllib.request
from datetime import datetime
from typing import Any, AsyncGenerator, Dict, List

from bs4 import BeautifulSoup

from crawlers.media import extract_image_urls, media_asset, normalize_url


BASE_URL = "https://www.jiangshi99.com"
LIST_URL = f"{BASE_URL}/Search/Course/0_0_0_0_0_0_0.html"


def clean_text(text: Any, default: str = "暂无") -> str:
    if text is None:
        return default
    cleaned = re.sub(r"\s+", " ", str(text)).strip()
    return cleaned or default


def parse_price(text: Any) -> float:
    if not text:
        return 0
    match = re.search(r"\d+(?:\.\d+)?", str(text).replace(",", ""))
    return float(match.group()) if match else 0


def parse_hours(text: Any) -> int:
    if not text:
        return 0
    match = re.search(r"\d+", str(text))
    return int(match.group()) if match else 0


def strip_html(html: str, limit: int = 1500) -> str:
    text = re.sub(r"<[^>]+>", " ", html or "")
    return clean_text(text)[:limit]


def fetch_html(url: str, referer: str) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
            ),
            "Referer": referer,
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        },
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        html = resp.read().decode("utf-8", errors="ignore")
    if "滑动验证页面" in html or "访问验证" in html:
        raise RuntimeError(f"jiangshibao waf blocked: {url}")
    return html


def parse_course_reviews(html: str) -> List[Dict[str, Any]]:
    reviews: List[Dict[str, Any]] = []
    if "还没有评价信息" in html:
        return []

    evaluate_block_match = re.search(
        r'<div[^>]+id="evaluate"[^>]*>([\s\S]*?)</div>\s*</div>',
        html,
        re.DOTALL,
    )
    evaluate_html = evaluate_block_match.group(1) if evaluate_block_match else html

    for part in evaluate_html.split('<div class="score-item">')[1:]:
        block = part[:2500]
        nickname_match = re.search(r'<div class="nickname[^"]*">([^<]+)</div>', block)
        content_match = re.search(r'<div class="content">([\s\S]*?)</div>', block)
        date_match = re.search(r'<span>(\d{4}-\d{2}-\d{2}[^<]*)</span>', block)
        rating_match = re.search(r'style="width:\s*(\d+)%', block)

        content = strip_html(content_match.group(1), 500) if content_match else "暂无"
        if content == "暂无":
            continue

        reviews.append(
            {
                "user_name": clean_text(nickname_match.group(1) if nickname_match else "", "匿名用户"),
                "content": content,
                "created_at": clean_text(date_match.group(1) if date_match else "", ""),
                "rating": int(rating_match.group(1)) / 20 if rating_match else 0,
            }
        )
    return reviews


def parse_course_catalog(html: str) -> str:
    sections: List[str] = []
    for catalog_match in re.finditer(r"<dl>(.*?)</dl>", html, re.DOTALL):
        block = catalog_match.group(1)
        chapter_title = ""
        dt_match = re.search(r"<dt>(.*?)</dt>", block, re.DOTALL)
        if dt_match:
            chapter_title = strip_html(dt_match.group(1), 200)

        lessons: List[str] = []
        for lesson_match in re.finditer(r"<dd>(.*?)</dd>", block, re.DOTALL):
            lesson_block = lesson_match.group(1)
            lesson_name_match = re.search(r'<div class="lesson-name[^"]*">([\s\S]*?)</div>', lesson_block)
            lesson_type_match = re.search(r'<div class="lesson-type">\s*([\s\S]*?)\s*</div>', lesson_block)
            duration_match = re.search(r'<div class="duration">\s*([\s\S]*?)\s*</div>', lesson_block)
            lesson_name = strip_html(lesson_name_match.group(1), 200) if lesson_name_match else "暂无"
            lesson_type = strip_html(lesson_type_match.group(1), 50) if lesson_type_match else ""
            duration = strip_html(duration_match.group(1), 50) if duration_match else ""
            suffix = " / ".join([value for value in [lesson_type, duration] if value])
            lessons.append(f"- {lesson_name}" + (f" ({suffix})" if suffix else ""))

        if chapter_title or lessons:
            section = chapter_title if chapter_title else "课程目录"
            if lessons:
                section += "\n" + "\n".join(lessons)
            sections.append(section)

    return "\n\n".join(sections)[:3000]


def parse_list(html: str) -> List[Dict[str, Any]]:
    courses: List[Dict[str, Any]] = []
    page = BeautifulSoup(html, "html.parser")

    for card in page.select(".course-item"):
        title_el = card.select_one(".course-item-title a")
        title = clean_text(title_el.get_text(" ", strip=True) if title_el else "", "")
        href = title_el.get("href", "") if title_el else ""
        cid_match = re.search(r"/(\d+)\.html", href) if href else None
        if not title or not cid_match:
            continue

        img = card.select_one(".course-item-thumb img")
        labels = card.select(".label span")
        category = clean_text(labels[0].get_text(" ", strip=True) if len(labels) > 0 else "")
        duration_raw = ""
        rating_raw = ""
        for label in labels:
            value = clean_text(label.get_text(" ", strip=True), "")
            if "课时" in value:
                duration_raw = value
            if "好评" in value or "%" in value:
                rating_raw = value

        price_el = card.select_one(".price-v, .price")
        price_text = clean_text(price_el.get_text(" ", strip=True) if price_el else "", "")

        courses.append(
            {
                "source_course_id": cid_match.group(1),
                "source_url": f"{BASE_URL}{href}" if href.startswith("/") else href,
                "title": title,
                "type": "ONLINE",
                "category_name_raw": category,
                "cover_url": normalize_url(BASE_URL, img.get("src", "") if img else ""),
                "duration_raw": duration_raw,
                "total_hours": parse_hours(duration_raw),
                "rating_raw": rating_raw,
                "price": parse_price(price_text),
                "original_price": 0,
                "level": "暂无",
                "intro": "暂无",
                "summary": "暂无",
                "highlights": "暂无",
                "audience": "暂无",
                "target_audience": "暂无",
                "learning_outcomes": "暂无",
                "syllabus": "暂无",
                "trainer_name_raw": "暂无",
                "plans_json": [],
                "evaluation_json": [],
                "services_json": [],
                "keywords": category,
            }
        )

    return courses


def parse_detail(html: str) -> Dict[str, Any]:
    detail: Dict[str, Any] = {}
    detail_images = extract_image_urls(html, BASE_URL)
    if detail_images:
        detail["services_json"] = [media_asset("detail_image", url, "课程详情图片") for url in detail_images]

    price_match = re.search(
        r'class="price-preferential"[^>]*>\s*(?:<span>.*?</span>)?\s*([0-9]+(?:\.[0-9]+)?)',
        html,
        re.DOTALL,
    )
    if price_match:
        detail["price"] = parse_price(price_match.group(1))

    original_price_match = re.search(
        r'class="price-original"[^>]*>\s*(?:<span>.*?</span>)?\s*([0-9]+(?:\.[0-9]+)?)',
        html,
        re.DOTALL,
    )
    if original_price_match:
        detail["original_price"] = parse_price(original_price_match.group(1))

    cover_match = re.search(
        r'<div class="thumb[^"]*">\s*<img[^>]+src="([^"]+)"',
        html,
        re.DOTALL,
    )
    if cover_match:
        detail["cover_url"] = normalize_url(BASE_URL, cover_match.group(1))

    title_match = re.search(r"<h1>([^<]+)</h1>", html)
    if not title_match:
        title_match = re.search(r'<h1[^>]*class="title[^"]*"[^>]*>([^<]+)</h1>', html)
    if title_match:
        detail["title"] = clean_text(title_match.group(1), "")

    desc_match = re.search(r'<div class="desc[^"]*">([\s\S]*?)</div>', html)
    if not desc_match:
        desc_match = re.search(r'<p class="short">([\s\S]*?)</p>', html)
    if desc_match:
        desc = strip_html(desc_match.group(1), 500)
        detail["summary"] = desc
        if detail.get("intro") in (None, "", "暂无"):
            detail["intro"] = desc

    if "price" not in detail:
        alt_price_match = re.search(r'<div class="price[^"]*"[\s\S]*?<p[^>]*>(免费|[0-9]+(?:\.[0-9]+)?)</p>', html)
        if alt_price_match:
            alt_price = clean_text(alt_price_match.group(1), "")
            detail["price"] = 0 if alt_price == "免费" else parse_price(alt_price)

    intro_match = re.search(r'<div class="main-content"[^>]*>(.*?)</div>', html, re.DOTALL)
    if not intro_match:
        intro_match = re.search(r'<div class="div_content[^"]*" id="intro"[^>]*>(.*?)</div>\s*</div>', html, re.DOTALL)
    if not intro_match:
        intro_match = re.search(r'class="course-intro[^"]*"[^>]*>(.*?)</div>', html, re.DOTALL)
    if not intro_match:
        intro_match = re.search(r'class="course-desc[^"]*"[^>]*>(.*?)</div>', html, re.DOTALL)
    if not intro_match:
        intro_match = re.search(r"课程简介(.*?)(?:课程大纲|课程目录)", html, re.DOTALL)
    if intro_match:
        intro_html = intro_match.group(1)
        intro_text = strip_html(intro_html, 1000)
        if "<img" in intro_html and len(intro_text) < 80 and detail.get("summary") not in (None, "", "暂无"):
            detail["intro"] = detail["summary"]
        else:
            detail["intro"] = intro_text
            detail["summary"] = detail["intro"]
        detail_images.extend(extract_image_urls(intro_html, BASE_URL))

    if detail.get("intro") in ("", "暂无") and detail.get("summary") not in ("", "暂无", None):
        detail["intro"] = detail["summary"]

    teacher_match = re.search(r"讲师[：:]\s*([^<\n]{2,20})", html)
    if not teacher_match:
        teacher_match = re.search(r'<div class="teacher-name">[\s\S]*?<div class="name"><a [^>]*>([^<]+)</a>', html)
    if not teacher_match:
        teacher_match = re.search(r'<a href="/home/[^"]+" title="([^"]+)">[^<]*</a>\s*<span></span>\s*<a href="/online_course/', html)
    if teacher_match:
        detail["trainer_name_raw"] = clean_text(teacher_match.group(1))

    lesson_count_match = re.search(r'共\s*(\d+)\s*节', html)
    if lesson_count_match and not detail.get("total_hours"):
        detail["total_hours"] = int(lesson_count_match.group(1))

    syllabus = parse_course_catalog(html)
    if syllabus:
        detail["syllabus"] = syllabus
    else:
        outline_match = re.search(r"(?:课程大纲|课程目录)(.*?)(?:讲师介绍|$)", html, re.DOTALL)
        if outline_match:
            detail["syllabus"] = strip_html(outline_match.group(1), 1500)

    reviews = parse_course_reviews(html)
    if reviews:
        detail["evaluation_json"] = reviews

    return detail


def crawl_jiangshibao_courses(
    max_pages: int = 20,
    with_details: bool = False,
    max_items: int | None = None,
) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []

    for page_num in range(1, max_pages + 1):
        url = f"{LIST_URL}?page={page_num}" if page_num > 1 else LIST_URL
        try:
            html = fetch_html(url, BASE_URL + "/")
        except Exception:
            break
        batch = parse_list(html)
        if not batch:
            break
        results.extend(batch)
        if max_items and len(results) >= max_items:
            results = results[:max_items]
            break
        time.sleep(0.5)

    if with_details:
        for course in results:
            try:
                html = fetch_html(course["source_url"], LIST_URL)
                if html:
                    course.update(parse_detail(html))
                time.sleep(0.3)
            except Exception:
                pass

    seen: set[str] = set()
    unique: List[Dict[str, Any]] = []
    for course in results:
        key = course["source_course_id"]
        if key in seen:
            continue
        seen.add(key)
        media_assets = []
        if course.get("cover_url"):
            media_assets.append(media_asset("cover", course["cover_url"], "课程封面"))
        media_assets.extend(course.get("services_json") or [])
        course["raw_json"] = {**course, "media_assets": media_assets, "crawled_at": datetime.now().isoformat()}
        unique.append(course)

    return unique


class JiangshiBaoCourseSpider:
    """讲师宝课程爬虫适配器，供 JobManager 调用。"""

    name = "jiangshibao_course"
    source = "jiangshibao"
    data_type = "COURSE"
    max_items = None
    max_pages = 20
    with_details = True

    def pause(self) -> None:
        """兼容 JobManager 的取消流程。"""
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        records = await asyncio.to_thread(
            crawl_jiangshibao_courses,
            self.max_pages,
            self.with_details,
            self.max_items,
        )
        for record in records:
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
