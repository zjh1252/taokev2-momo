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

from crawlers.course_utils import enrich_course_record, set_price_fields


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
    html = fetch_text(f"{BASE_URL}/course/")
    links: list[str] = []
    seen: set[str] = set()
    candidates = re.findall(r'https://www\.jiangshitai\.com/(?:course|training)/[^"\']+', html)
    candidates.extend(absolute_url(href) for href in re.findall(r'href=["\'](/(?:course|training)/[^"\']+)["\']', html))
    for href in candidates:
        href = href.split("#", 1)[0].split("?", 1)[0]
        if "/training/" not in href or href in seen:
            continue
        seen.add(href)
        links.append(href)
        if len(links) >= limit:
            break
    return links


def source_id_from_url(url: str) -> str:
    match = re.search(r"/(?:course|training)/([^/]+)", url)
    return match.group(1).replace(".html", "") if match else url.rstrip("/").rsplit("/", 1)[-1]


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


def extract_price_raw(text: str) -> str:
    for pattern in (
        r"(?:课程价格|课程费用|培训费用|费用|价格)[：:\s]*(?:￥|¥)?\s*\d{1,8}(?:\.\d+)?\s*元?",
        r"(?:课程价格|课程费用|培训费用|费用|价格)[：:\s]*(?:面议|待商量|待议|电话咨询|咨询|详询)",
        r"(?:￥|¥)\s*\d{1,8}(?:\.\d+)?\s*元?",
    ):
        match = re.search(pattern, text.replace(",", ""))
        if match:
            return match.group(0)
    return extract_section_after_heading(text, "课程价格", 200)


def clean_teaches(items: list[Any]) -> list[str]:
    cleaned: list[str] = []
    noisy_keywords = (
        "授课时间",
        "课程时间",
        "课程大纲",
        "培训大纲",
        "讲师介绍",
        "讲师简介",
        "报名咨询",
        "课程价格",
        "培训费用",
    )
    for item in items:
        text = clean_html(item, "")
        text = text.strip(" -•·、:：")
        if not text:
            continue
        if text.startswith(("【", "[", "（", "(")) and text.endswith(("】", "]", "）", ")")):
            continue
        if any(keyword in text for keyword in noisy_keywords):
            continue
        if text not in cleaned:
            cleaned.append(text)
    return cleaned


def clean_audience(text: str) -> str:
    if text == MISSING:
        return text
    for marker in ("【培训课时】", "培训课时", "【授课时间】", "授课时间", "课程时间", "培训时间"):
        idx = text.find(marker)
        if idx > 0:
            text = text[:idx]
    return text.strip(" ：:;；、") or MISSING


def extract_category(html: str) -> str:
    match = re.search(r"课程分类\s*:\s*</span>\s*<a[^>]*>(.*?)</a>", html, re.S | re.I)
    return clean_html(match.group(1)) if match else MISSING


def parse_course_detail_html(url: str, html: str) -> Dict[str, Any]:
    course_json = next((item for item in json_ld_objects(html) if item.get("@type") == "Course"), {})
    title = clean_html(course_json.get("name")) if course_json else meta_content(html, "og:title")
    description = clean_html(course_json.get("description")) if course_json else meta_content(html, "description")
    instructor = course_json.get("instructor") if isinstance(course_json.get("instructor"), dict) else {}
    image = course_json.get("image") if isinstance(course_json.get("image"), str) else meta_content(html, "og:image")
    about = course_json.get("about") if isinstance(course_json.get("about"), dict) else {}
    teaches = clean_teaches(course_json.get("teaches") if isinstance(course_json.get("teaches"), list) else [])
    audience_obj = course_json.get("audience") if isinstance(course_json.get("audience"), dict) else {}
    audience = clean_html(audience_obj.get("audienceType")) if audience_obj else extract_section_after_heading(html, "适用对象", 1500)
    audience = clean_audience(audience)
    learning_outcomes = "\n".join(f"- {item}" for item in teaches)
    overview = extract_section_after_heading(html, "课程概要", 1200)
    detail = extract_section_after_heading(html, "课程介绍", 8000)
    syllabus = learning_outcomes or (detail if detail != MISSING else description)
    price_raw = "培训咨询"
    item = {
        "source_course_id": source_id_from_url(url),
        "source_url": url,
        "title": title,
        "type": "INTERNAL",
        "category_name_raw": clean_html(about.get("name")) if about else extract_category(html),
        "cover_url": absolute_url(image),
        "intro": description[:800],
        "summary": description[:500],
        "syllabus": syllabus,
        "audience": audience,
        "highlights": learning_outcomes[:1200] if learning_outcomes else extract_section_after_heading(html, "课程收益", 1200),
        "learning_outcomes": learning_outcomes or MISSING,
        "duration_days": parse_duration_days(str(course_json.get("timeRequired") or "") + " " + overview + " " + description),
        "price": 0,
        "price_raw": price_raw,
        "trainer_name_raw": clean_html(instructor.get("name")) if instructor else MISSING,
        "trainer_source_url": instructor.get("url", "") if instructor else "",
        "plans_json": [],
        "raw_json": {
            "json_ld": course_json,
            "overview": overview,
            "source_entry": "training",
            "source_entry_name": "内训课程",
            "media_assets": [{"type": "cover", "url": absolute_url(image), "label": "课程图片"}] if image else [],
            "detail_text_len": len(detail),
            "field_sources": {
                "category_name_raw": "json_ld.about/html category",
                "audience": "json_ld.audience/html 适用对象",
                "learning_outcomes": "json_ld.teaches",
                "trainer_name_raw": "json_ld.instructor",
            },
            "crawled_at": datetime.now().isoformat(),
        },
    }
    set_price_fields(item, price_raw)
    enrich_course_record(item, fallback_type="INTERNAL")
    item["type"] = "INTERNAL"
    item["raw_json"]["type_evidence"] = "jiangshitai_training_entry_internal"
    return item


def parse_course_detail(url: str) -> Dict[str, Any]:
    return parse_course_detail_html(url, fetch_text(url))


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
    supported_course_types = ("INTERNAL",)
    coverage_note = "企业培训讲师平台，当前以内训课程抓取为主。"

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
