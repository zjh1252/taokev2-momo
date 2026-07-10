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

from crawlers.course_utils import detect_content_type, enrich_course_record, set_price_fields
from crawlers.media import extract_image_urls, media_asset, normalize_url


BASE_URL = "https://www.jiangshi99.com"
LIST_URL = f"{BASE_URL}/course/"
OPEN_LIST_URL = f"{BASE_URL}/opencourse/"
ONLINE_LIST_URL = f"{BASE_URL}/Search/Course/0_0_0_0_0_0_0.html"
MISSING = "暂无"


def clean_text(text: Any, default: str = MISSING) -> str:
    if text is None:
        return default
    cleaned = re.sub(r"\s+", " ", str(text)).strip()
    return cleaned or default


def soup_text(node: Any, default: str = MISSING) -> str:
    if node is None:
        return default
    return clean_text(node.get_text(" ", strip=True), default)


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


def absolute_url(href: str) -> str:
    return f"{BASE_URL}{href}" if href.startswith("/") else href


def first_match(text: str, patterns: List[str], default: str = MISSING) -> str:
    for pattern in patterns:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return clean_text(match.group(1), default)
    return default


def extract_text_section(text: str, aliases: List[str], stop_aliases: List[str], limit: int = 1500) -> str:
    positions = []
    for alias in aliases:
        positions.extend((match.start(), alias) for match in re.finditer(re.escape(alias), text))
    if not positions:
        return MISSING
    candidates: List[str] = []
    for start, alias in sorted(positions, key=lambda item: item[0]):
        segment = text[start + len(alias):]
        segment = segment.lstrip(" ：:;；、，,.-—？?\n\t")
        numbered_stops = ["一、", "二、", "三、", "四、", "五、", "六、", "七、", "八、", "九、", "十、"]
        all_stops = stop_aliases + numbered_stops
        stops = [segment.find(stop) for stop in all_stops if segment.find(stop) > 0]
        if stops:
            segment = segment[: min(stops)]
        candidate = clean_text(segment[:limit], MISSING)
        if candidate != MISSING:
            candidates.append(candidate)

    if not candidates:
        return MISSING

    weak_prefixes = ("面授课程", "公开课", "企业内训", "在线咨询", "微信咨询")
    for candidate in candidates:
        if candidate.startswith(weak_prefixes):
            continue
        if len(candidate) > 300 and not any(mark in candidate for mark in ("、", "，", "；", "。")):
            continue
        return candidate
    return candidates[0]


def parse_duration_days(text: str) -> int:
    day_match = re.search(r"(\d+)\s*(?:天|日)", text or "")
    if day_match:
        return int(day_match.group(1))
    hour_match = re.search(r"(\d+)\s*(?:小时|课时)", text or "")
    if hour_match:
        hours = int(hour_match.group(1))
        return max(1, round(hours / 6))
    return 0


def parse_total_hours(text: str) -> int:
    hour_match = re.search(r"(\d+)\s*(?:小时|课时)", text or "")
    if hour_match:
        return int(hour_match.group(1))
    day_match = re.search(r"(\d+)\s*(?:天|日)", text or "")
    if day_match:
        return int(day_match.group(1)) * 6
    return 0


def parse_date(value: str) -> datetime | None:
    try:
        return datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        return None


def build_plan(start_date: str, end_date: str, location: str) -> Dict[str, str]:
    plan = {
        "start_date": start_date,
        "end_date": end_date,
        "location": location,
        "city": location.replace("市", "").split("-")[-1].strip(),
    }
    return {k: v for k, v in plan.items() if v}


def normalize_trainer_name(value: str) -> str:
    text = clean_text(value, "")
    if not text:
        return MISSING
    text = re.split(r"(?:课程背景|培训对象|课程目标|核心目标|授课方法|开课时间)", text)[0]
    teacher_match = re.search(r"([\u4e00-\u9fa5·]{2,12}老师)", text)
    if teacher_match:
        return teacher_match.group(1)
    return clean_text(text[:20], MISSING)


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
                "type": "OPEN_ONLINE",
                "category_name_raw": category,
                "cover_url": normalize_url(BASE_URL, img.get("src", "") if img else ""),
                "duration_raw": duration_raw,
                "total_hours": parse_hours(duration_raw),
                "rating_raw": rating_raw,
                "price": parse_price(price_text),
                "price_raw": price_text,
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


def discover_internal_links(html: str, limit: int) -> List[str]:
    page = BeautifulSoup(html, "html.parser")
    links: List[str] = []
    seen: set[str] = set()
    for anchor in page.select('a[href*="/course/content/"]'):
        href = anchor.get("href", "")
        if "/course/content/" not in href:
            continue
        url = absolute_url(href)
        if url in seen:
            continue
        seen.add(url)
        links.append(url)
        if len(links) >= limit:
            break
    return links


def discover_open_links(html: str, limit: int) -> List[str]:
    page = BeautifulSoup(html, "html.parser")
    links: List[str] = []
    seen: set[str] = set()
    for anchor in page.select('a[href*="/open_course/content/"]'):
        href = anchor.get("href", "")
        if "/open_course/content/" not in href:
            continue
        url = absolute_url(href)
        if url in seen:
            continue
        seen.add(url)
        links.append(url)
        if len(links) >= limit:
            break
    return links


def discover_open_items(html: str, limit: int) -> List[Dict[str, str]]:
    page = BeautifulSoup(html, "html.parser")
    items: List[Dict[str, str]] = []
    seen: set[str] = set()
    for anchor in page.select('a[href*="/open_course/content/"]'):
        href = anchor.get("href", "")
        title = soup_text(anchor, "")
        if not title or "/open_course/content/" not in href:
            continue
        url = absolute_url(href)
        if url in seen:
            continue
        seen.add(url)
        container = anchor
        container_text = title
        for _ in range(5):
            if container.parent is None:
                break
            container = container.parent
            container_text = soup_text(container, "")
            if "¥" in container_text or "授课讲师" in container_text or "开课时间" in container_text:
                break
        items.append(
            {
                "url": url,
                "title": title,
                "price_raw": first_match(container_text, [r"(¥\s*[\d,]+(?:\.\d+)?)"], ""),
                "trainer_name_raw": first_match(container_text, [r"授课讲师[：:]\s*([^\s]+)"], ""),
                "location": first_match(container_text, [r"上课地点[：:]\s*(.+?)\s+开课时间"], ""),
            }
        )
        if len(items) >= limit:
            break
    return items


def parse_internal_detail(html: str, url: str) -> Dict[str, Any]:
    page = BeautifulSoup(html, "html.parser")
    main_node = page.select_one(".main-content") or page.select_one(".course-info") or page.body
    main_text = soup_text(main_node, "")
    all_text = soup_text(page, "")
    title = soup_text(page.select_one("h1"), "")
    trainer = soup_text(page.select_one(".teacher-name"), MISSING)
    category = first_match(all_text, [r"企业内训\s+(.+?)\s+课程时长", r"内训课程\s+[^ ]+\s+([^ ]+)\s+课程详情"])
    duration_text = first_match(all_text, [r"课程时长[：:]\s*([^\s]+)", r"标准课时[：:]\s*([^\s]+)"], "")

    stop_aliases = [
        "课程目标", "培训目标", "课程对象", "适用对象", "面向群体", "课程时长", "课程特色",
        "培训规划", "课程大纲", "学员评价", "授课讲师", "上个课程", "下个课程",
    ]
    intro = extract_text_section(main_text, ["课程背景", "课程简介", "课程介绍"], stop_aliases, 1200)
    outcomes = extract_text_section(main_text, ["课程目标", "培训目标"], stop_aliases, 1200)
    audience = extract_text_section(main_text, ["课程对象", "适用对象", "面向群体"], stop_aliases, 800)
    highlights = extract_text_section(main_text, ["课程特色", "培训特色"], stop_aliases, 1200)
    syllabus = extract_text_section(main_text, ["课程大纲", "培训规划", "课程内容大纲"], ["学员评价", "上个课程", "下个课程"], 3000)
    summary = intro if intro != MISSING else clean_text(main_text[:500], MISSING)

    item = {
        "source_course_id": url.rstrip("/").rsplit("/", 1)[-1].replace(".html", ""),
        "source_url": url,
        "title": title,
        "type": "INTERNAL",
        "category_name_raw": category,
        "cover_url": normalize_url(BASE_URL, page.select_one(".courseimg img").get("src", "") if page.select_one(".courseimg img") else ""),
        "intro": intro if intro != MISSING else summary,
        "summary": summary[:500],
        "syllabus": syllabus if syllabus != MISSING else main_text[:3000],
        "audience": audience,
        "highlights": highlights,
        "learning_outcomes": outcomes,
        "target_audience": audience,
        "duration_days": parse_duration_days(duration_text or main_text),
        "total_hours": parse_total_hours(duration_text or main_text),
        "price_raw": "培训咨询",
        "original_price": 0,
        "trainer_name_raw": trainer,
        "plans_json": [],
        "evaluation_json": parse_course_reviews(html),
        "services_json": [],
        "keywords": " ".join(value for value in [category, title] if value and value != MISSING),
        "raw_json": {
            "source_entry": "course",
            "field_sources": {
                "intro": "main-content/课程背景",
                "learning_outcomes": "main-content/课程目标",
                "audience": "main-content/课程对象",
                "highlights": "main-content/课程特色",
                "syllabus": "main-content/课程大纲",
            },
        },
    }
    set_price_fields(item, item["price_raw"])
    return item


def parse_open_detail(html: str, url: str, base: Dict[str, str] | None = None) -> Dict[str, Any]:
    base = base or {}
    page = BeautifulSoup(html, "html.parser")
    all_text = soup_text(page, "")
    content_nodes = page.select(".div_content")
    content_text = soup_text(content_nodes[0], "") if content_nodes else all_text
    title = soup_text(page.select_one("h1"), "") or base.get("title", "")
    category = first_match(all_text, [r"([^ ]+?)公开课\s+课程详情", r"当前位置：.+?\s([^ ]+?)公开课"])
    price_raw = first_match(all_text, [r"报名费用\s*(￥\s*[\d,]+(?:\.\d+)?)", r"课程费用\s*(￥\s*[\d,]+(?:\.\d+)?)"], MISSING)
    if price_raw == MISSING and base.get("price_raw"):
        price_raw = base["price_raw"]
    start = first_match(all_text, [r"开课时间[：:]\s*(\d{4}-\d{2}-\d{2})"], "")
    end = first_match(all_text, [r"至\s*(\d{4}-\d{2}-\d{2})"], start)
    location = first_match(all_text, [r"开课地点[：:]\s*(.+?)\s+(?:立即报名|微信咨询|在线咨询)", r"上课地点[：:]\s*(.+?)\s+开课时间"], MISSING)
    if location == MISSING and base.get("location"):
        location = base["location"]
    trainer = first_match(all_text, [r"授课讲师[：:]\s*([^\s，,。；;]{2,30})", r"主讲[：:]\s*([^\s，,。；;]{2,30})"], MISSING)
    if trainer == MISSING and base.get("trainer_name_raw"):
        trainer = base["trainer_name_raw"]
    stop_aliases = [
        "培训目标", "课程目标", "核心目标", "培训特色", "课程特色", "课程内容大纲", "课程大纲",
        "详细日程安排", "授课讲师", "学员评价", "课程时长", "授课方法", "怎么解决", "有什么不同", "谁已经在用",
    ]
    intro = extract_text_section(content_text, ["课程背景", "课程简介", "课程介绍"], stop_aliases, 1200)
    outcomes = extract_text_section(content_text, ["核心目标", "培训目标", "课程目标"], stop_aliases, 1200)
    highlights = extract_text_section(content_text, ["培训特色", "课程特色"], stop_aliases, 1200)
    audience = extract_text_section(
        content_text,
        ["培训对象", "培训训对象", "课程对象", "适合对象", "适用对象", "面向群体", "目标学员", "适合人群", "课程定位", "适合谁"],
        stop_aliases,
        800,
    )
    if audience == MISSING or len(audience) > 300 or audience.startswith("面授课程"):
        audience = first_match(
            all_text,
            [r"培训训?对象\s*[：:]\s*(.+?)\s*(?:课程时长|授课方法|开课时间|核心目标|课程目标)"],
            audience,
        )
    if audience.startswith("面授课程") or len(audience) > 300:
        audience = MISSING
    syllabus = extract_text_section(content_text, ["课程内容大纲", "课程大纲", "培训大纲"], ["授课讲师", "学员评价"], 3000)
    start_dt = parse_date(start) if start else None
    end_dt = parse_date(end) if end else start_dt
    duration_days = (end_dt - start_dt).days + 1 if start_dt and end_dt else 0
    plans = [build_plan(start, end, location)] if start else []

    item = {
        "source_course_id": url.rstrip("/").rsplit("/", 1)[-1].replace(".html", ""),
        "source_url": url,
        "title": title,
        "type": "OPEN_OFFLINE",
        "category_name_raw": category,
        "cover_url": normalize_url(BASE_URL, page.select_one(".courseimg img").get("src", "") if page.select_one(".courseimg img") else ""),
        "intro": intro if intro != MISSING else content_text[:1200],
        "summary": (intro if intro != MISSING else content_text)[:500],
        "syllabus": syllabus if syllabus != MISSING else content_text[:3000],
        "audience": audience,
        "highlights": highlights,
        "learning_outcomes": outcomes,
        "target_audience": audience,
        "duration_days": duration_days,
        "total_hours": duration_days * 6 if duration_days else 0,
        "price_raw": price_raw,
        "original_price": 0,
        "trainer_name_raw": normalize_trainer_name(trainer),
        "plans_json": plans,
        "evaluation_json": parse_course_reviews(html),
        "services_json": [],
        "keywords": " ".join(value for value in [category, title] if value and value != MISSING),
        "raw_json": {
            "source_entry": "opencourse",
            "field_sources": {
                "plans_json": "course_intro/开课时间/开课地点",
                "price_raw": "course_intro/报名费用",
                "trainer_name_raw": "div_content/授课讲师",
            },
        },
    }
    set_price_fields(item, price_raw)
    return item


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
        detail["price_raw"] = price_match.group(1)
        set_price_fields(detail, detail["price_raw"])

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
            detail["price_raw"] = alt_price
            set_price_fields(detail, alt_price)

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

    content_type = detect_content_type(html, detail.get("syllabus"), detail.get("intro"), detail.get("summary"))
    if content_type != "COURSE":
        detail.setdefault("raw_json", {})["content_type"] = content_type

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
    target_count = max_items or 100
    internal_target = target_count if max_items is None else max(1, (target_count + 1) // 2)
    open_target = max(0, target_count - internal_target)

    try:
        internal_html = fetch_html(LIST_URL, BASE_URL + "/")
        internal_links = discover_internal_links(internal_html, internal_target)
    except Exception:
        internal_links = []

    for link in internal_links:
        try:
            results.append(parse_internal_detail(fetch_html(link, LIST_URL), link))
            time.sleep(0.2)
        except Exception:
            continue
        if len(results) >= internal_target:
            break

    if len(results) < target_count:
        try:
            open_html = fetch_html(OPEN_LIST_URL, BASE_URL + "/")
            open_items = discover_open_items(open_html, open_target or (target_count - len(results)))
        except Exception:
            open_items = []

        for open_item in open_items:
            link = open_item["url"]
            try:
                results.append(parse_open_detail(fetch_html(link, OPEN_LIST_URL), link, open_item))
                time.sleep(0.2)
            except Exception:
                continue
            if len(results) >= target_count:
                break

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
        existing_raw = course.get("raw_json") if isinstance(course.get("raw_json"), dict) else {}
        course["raw_json"] = {**existing_raw, "media_assets": media_assets, "crawled_at": datetime.now().isoformat()}
        enrich_course_record(course, fallback_type=course.get("type") or "INTERNAL")
        if course["raw_json"].get("content_type") in {"RECORDED_VIDEO", "DOCUMENT", "AUDIO"}:
            continue
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
    supported_course_types = ("INTERNAL", "OPEN_OFFLINE")
    coverage_note = "抓取内训课程和线下公开课；在线录播/视频课程不进入 courses 抓取流程，后续由 video 流程处理。"

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
