"""讲师台内训课程爬虫适配器。"""
import asyncio
import json
import logging
import re
import ssl
import time
import urllib.request
from datetime import datetime
from html import unescape
from typing import Any, AsyncGenerator, Dict
from urllib.parse import urljoin


BASE_URL = "https://www.jiangshitai.com"
ASSET_BASE_URL = "https://to.jiangshitai.com"
MISSING = "暂无"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
logger = logging.getLogger(__name__)

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE


def fetch_text(url: str, timeout: int = 20, retries: int = 3) -> str:
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
    if not value:
        return ""
    if value.startswith("//"):
        return "https:" + value
    if value.startswith("/uploads/") or value.startswith("/public/"):
        return urljoin(ASSET_BASE_URL, value)
    return urljoin(BASE_URL, value)


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
        rf'<meta[^>]+(?:name|property)=["\']{re.escape(name)}["\'][^>]+content=["\'](.*?)["\']',
        html,
        flags=re.I | re.S,
    )
    return clean_html(match.group(1)) if match else MISSING


def json_ld_objects(html: str) -> list[dict]:
    objects: list[dict] = []
    for raw in re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>([\s\S]*?)</script>', html, re.I):
        try:
            value = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if isinstance(value, dict) and isinstance(value.get("@graph"), list):
            objects.extend([item for item in value["@graph"] if isinstance(item, dict)])
        elif isinstance(value, dict):
            objects.append(value)
    return objects


def discover_course_links(limit: int = 50) -> list[str]:
    html = fetch_text(f"{BASE_URL}/c_3_0_0_0_0_0_0.html")
    links: list[str] = []
    seen: set[str] = set()
    for href in re.findall(r'https://www\.jiangshitai\.com/course/\d+\.html', html):
        if href in seen:
            continue
        seen.add(href)
        links.append(href)
        if len(links) >= limit:
            break
    return links


def source_id_from_url(url: str) -> str:
    match = re.search(r"/course/(\d+)\.html", url)
    return match.group(1) if match else url.rstrip("/").rsplit("/", 1)[-1]


def extract_section_after_heading(html: str, heading: str, max_len: int = 3000) -> str:
    idx = html.find(heading)
    if idx < 0:
        return MISSING
    segment = html[idx : idx + 12000]
    next_match = re.search(r'<div class="f-h3"|<div class="s_tit"|<footer|</section>\s*</section>\s*</div>\s*</div>', segment[200:], re.I)
    if next_match:
        segment = segment[: 200 + next_match.start()]
    return clean_html(segment)[:max_len]


def parse_duration_days(text: str) -> float:
    match = re.search(r"(\d+(?:\.\d+)?)\s*[-至~]?\s*(?:\d+(?:\.\d+)?)?\s*天", text)
    return float(match.group(1)) if match else 0


def parse_price(text: str) -> float:
    normalized = text.replace(",", "")
    match = re.search(r"(?:课程价格|课程费用|培训费用|费用|价格)[：:\s]*(?:￥|¥)?\s*(\d{3,6})(?:\.00)?", normalized)
    if not match:
        match = re.search(r"(?:￥|¥)\s*(\d{3,6})(?:\.00)?", normalized)
    return float(match.group(1)) if match else 0.0


def extract_category(html: str) -> str:
    match = re.search(r"课程分类\s*:\s*</span>\s*<a[^>]*>(.*?)</a>", html, re.S | re.I)
    return clean_html(match.group(1)) if match else MISSING


def parse_course_detail(url: str) -> Dict[str, Any]:
    html = fetch_text(url)
    course_json = next((item for item in json_ld_objects(html) if item.get("@type") == "Course"), {})
    title = clean_html(course_json.get("name")) if course_json else meta_content(html, "og:title")
    description = clean_html(course_json.get("description")) if course_json else meta_content(html, "description")
    instructor = course_json.get("instructor") if isinstance(course_json.get("instructor"), dict) else {}
    image = course_json.get("image") if isinstance(course_json.get("image"), str) else meta_content(html, "og:image")
    overview = extract_section_after_heading(html, "课程概要", 1200)
    detail = extract_section_after_heading(html, "课程介绍", 8000)
    audience = extract_section_after_heading(html, "适用对象", 1500)
    return {
        "source_course_id": source_id_from_url(url),
        "source_url": url,
        "title": title,
        "type": "INTERNAL",
        "category_name_raw": extract_category(html),
        "cover_url": absolute_url(image),
        "intro": description[:800],
        "summary": description[:500],
        "syllabus": detail if detail != MISSING else description,
        "audience": audience,
        "highlights": extract_section_after_heading(html, "课程收益", 1200),
        "duration_days": parse_duration_days(overview + " " + description),
        "price": parse_price(overview + " " + detail),
        "trainer_name_raw": clean_html(instructor.get("name")) if instructor else MISSING,
        "trainer_source_url": instructor.get("url", "") if instructor else "",
        "plans_json": [],
        "raw_json": {
            "json_ld": course_json,
            "overview": overview,
            "media_assets": [{"type": "cover", "url": absolute_url(image), "label": "课程图片"}] if image else [],
            "detail_text_len": len(detail),
            "crawled_at": datetime.now().isoformat(),
        },
    }


def iter_jiangshitai_courses(max_items: int | None = None):
    limit = max_items or 100
    for url in discover_course_links(limit=limit):
        try:
            yield parse_course_detail(url)
        except Exception as exc:
            logger.warning("jiangshitai course 详情页抓取失败，跳过 url=%s error=%s", url, exc)
        time.sleep(0.1)


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class JiangshitaiCourseSpider:
    """讲师台内训课程爬虫适配器，供 JobManager 调用。"""

    name = "jiangshitai_course"
    source = "jiangshitai"
    data_type = "COURSE"
    max_items = None

    def pause(self) -> None:
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_jiangshitai_courses(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
