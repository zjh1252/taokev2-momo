"""
哪里有培训网课程爬虫。

依据 crawler-mvp/app.py 和 crawler-poc/crawler_nlypx_course.py 中
已经验证过的 SSR 分类页解析逻辑迁移。该站点同一课程会出现在多个分类，
因此适配器内按 source_course_id 先做同批去重。
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

from crawlers.course_utils import enrich_course_record, safe_update, set_price_fields
from crawlers.media import extract_image_urls, media_asset


BASE_URL = "https://www.nlypx.com"
MISSING = "暂无"
MAX_TITLE_LEN = 200
MAX_SUMMARY_LEN = 500
MAX_CATEGORY_LEN = 100
MAX_KEYWORDS_LEN = 500
MAX_TRAINER_LEN = 100
MAX_LONG_FIELD_LEN = 1500
logger = logging.getLogger(__name__)

CATEGORY_NAMES = {
    101: "营销管理",
    102: "人力资源",
    103: "生产研发",
    104: "采购物流",
    105: "财务管理",
    106: "战略管理",
    107: "领导艺术",
    108: "综合技能",
    109: "其它课程",
    110: "线上课程",
}

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE


def clean_html(value: Any, default: str = MISSING) -> str:
    if value is None:
        return default
    text = str(value).replace("<!--", " ").replace("-->", " ")
    text = re.sub(r"<[^>]+>", " ", text)
    text = " ".join(unescape(text).replace("&nbsp;", " ").split())
    return text or default


def absolute_url(value: str) -> str:
    return urljoin(BASE_URL, value or "")


def fetch_text(url: str, timeout: int = 15) -> str:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
    )
    with urllib.request.urlopen(req, timeout=timeout, context=SSL_CTX) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def parse_int(value: Any) -> int:
    match = re.search(r"\d+", str(value or "").replace(",", ""))
    return int(match.group()) if match else 0


def parse_price(value: Any) -> float:
    match = re.search(r"\d+(?:\.\d+)?", str(value or "").replace(",", ""))
    return float(match.group()) if match else 0


def clip_text(value: Any, limit: int, default: str = MISSING) -> str:
    text = clean_html(value, default)
    if text == default:
        return default
    return text[:limit]


def extract_meta_description(html: str) -> str:
    match = re.search(
        r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']',
        html,
        re.DOTALL | re.IGNORECASE,
    )
    return clean_html(match.group(1)) if match else MISSING


def extract_breadcrumb_category(html: str) -> str:
    location = re.search(r'<div class="location[^"]*">([\s\S]*?)</div>', html, re.DOTALL | re.IGNORECASE)
    if not location:
        return MISSING
    links = [clean_html(text, "") for text in re.findall(r"<a[^>]*>([\s\S]*?)</a>", location.group(1), re.DOTALL)]
    links = [item for item in links if item and item not in ("哪里有培训网", "企业培训公开课", "公开课程培训")]
    if not links:
        return MISSING
    category = links[-1]
    category = re.sub(r"(培训)?(课程|公开课|培训班)$", "", category).strip()
    return category or links[-1]


def infer_course_type(plans: List[Dict[str, str]] | None, fallback: str = "OPEN_OFFLINE") -> str:
    if not plans:
        return fallback
    locations = [clean_html(plan.get("location"), "") for plan in plans]
    if locations and all(location in ("在线课程", "线上课程", "线上", "在线") for location in locations if location):
        return "OPEN_ONLINE"
    return "OPEN_OFFLINE"


def extract_between(html: str, start: str, end: str | None = None) -> str:
    start_pos = html.find(start)
    if start_pos < 0:
        return ""
    start_pos += len(start)
    if end:
        end_pos = html.find(end, start_pos)
        if end_pos > start_pos:
            return html[start_pos:end_pos]
    return html[start_pos:]


def derive_intro_from_syllabus(syllabus_text: str) -> str:
    text = clean_html(syllabus_text, "")
    if not text:
        return MISSING
    for marker in ("参加对象", "内容大纲", "课程对象", "课程大纲"):
        if marker in text:
            candidate = text.split(marker, 1)[0].strip(" ：:;；-")
            return candidate or text[:300]
    return text[:300] or MISSING


def extract_labeled_text(text: str, aliases: tuple[str, ...], stop_aliases: tuple[str, ...], limit: int = MAX_LONG_FIELD_LEN) -> str:
    source = clean_html(text, "")
    if not source:
        return MISSING
    positions = []
    for alias in aliases:
        positions.extend((match.start(), alias) for match in re.finditer(re.escape(alias), source))
    if not positions:
        return MISSING
    for start, alias in sorted(positions, key=lambda item: item[0]):
        segment = source[start + len(alias):].lstrip(" ：:;；、，,.-—】]）)\n\t")
        stops = [
            segment.find(stop)
            for stop in stop_aliases
            if stop not in aliases and segment.find(stop) > 0
        ]
        if stops:
            segment = segment[: min(stops)]
        candidate = clean_html(segment[:limit], "")
        candidate = re.sub(r"[一二三四五六七八九十]+[、.．]\s*[【\[]?$", "", candidate).strip()
        if candidate and len(candidate) >= 8:
            return candidate
    return MISSING


def is_noisy_section(value: str) -> bool:
    if value == MISSING:
        return False
    noisy_markers = (
        "在线报名", "付款信息", "上一篇", "下一篇", "师资介绍", "讲师介绍", "参会对象",
        "已开课时间", "转载：http", "输入验证", "开户名",
    )
    if any(marker in value for marker in noisy_markers):
        return True
    if len(value) > 1000 and re.search(r"第[一二三四五六七八九十]+[篇部分章]", value):
        return True
    return False


def extract_detail_sections(detail_text: str, meta_description: str) -> Dict[str, str]:
    stop_aliases = (
        "课程收益", "培训收益", "学习收益", "学习收获", "课程目标", "培训目标", "您将获得",
        "课程亮点", "课程特色", "课程优势", "核心价值",
        "适用对象", "培训对象", "目标学员", "适宜人群", "参加对象", "课程对象", "参训对象",
        "授课形式", "课程大纲", "培训大纲", "内容大纲", "日程安排", "已开课时间", "授课讲师",
        "讲师介绍", "讲师简介", "师资介绍", "师资简介", "参会对象", "转载", "上一篇", "下一篇", "在线报名", "付款信息",
    )
    sources = [detail_text, meta_description if meta_description != MISSING else ""]
    outcomes = MISSING
    highlights = MISSING
    audience = MISSING
    for source in sources:
        if outcomes == MISSING:
            outcomes = extract_labeled_text(
                source,
                ("课程收益", "培训收益", "学习收益", "学习收获", "课程目标", "培训目标", "您将获得"),
                stop_aliases,
                1200,
            )
        if highlights == MISSING:
            highlights = extract_labeled_text(
                source,
                ("课程亮点", "课程特色", "课程优势"),
                stop_aliases,
                1000,
            )
        if audience == MISSING:
            audience = extract_labeled_text(
                source,
                ("适用对象", "培训对象", "目标学员", "适宜人群", "参加对象", "课程对象", "参训对象"),
                stop_aliases,
                800,
            )
    return {
        "learning_outcomes": MISSING if is_noisy_section(outcomes) else outcomes,
        "highlights": MISSING if is_noisy_section(highlights) else highlights,
        "audience": MISSING if is_noisy_section(audience) else audience,
    }


def parse_detail(html: str) -> Dict[str, Any]:
    """从课程详情页补充课程介绍、日程和大纲。"""
    detail: Dict[str, Any] = {}
    detail_images: List[str] = []
    meta_description = extract_meta_description(html)
    category = extract_breadcrumb_category(html)
    if category != MISSING:
        detail["category_name_raw"] = category

    title = re.search(r'<div[^>]*font-size:\s*20px[^>]*>(.*?)</div>', html, re.DOTALL)
    if title:
        detail["title"] = clip_text(title.group(1), MAX_TITLE_LEN)

    tab = re.search(r'<div class="tab"><span>(.*?)</span>', html, re.DOTALL)
    if tab:
        tab_text = clean_html(tab.group(1), "")
        trainer = re.search(r"讲师[：:]\s*([^ ]+)", tab_text)
        views = re.search(r"浏览次数[：:]\s*(\d+)", tab_text)
        if trainer:
            detail["trainer_name_raw"] = clean_html(trainer.group(1))
        if views:
            detail["view_count"] = parse_int(views.group(1))

    meta_block = re.search(r'<div style="margin-left:55px ">(.*?)</div>', html, re.DOTALL)
    if meta_block:
        meta_text = clean_html(meta_block.group(1), "")
        price = re.search(r"课程价格[：:]\s*([^ ]+)", meta_text)
        duration = re.search(r"培训天数[：:]\s*([0-9.]+)", meta_text)
        trainer = re.search(r"培训讲师[：:]\s*([^ ]+)", meta_text)
        if price:
            detail["price_raw"] = clean_html(price.group(1), "")
            set_price_fields(detail, detail["price_raw"])
        if duration:
            detail["duration_days"] = parse_price(duration.group(1))
        if trainer:
            detail["trainer_name_raw"] = clean_html(trainer.group(1))

    intro = re.search(r'<div class="kc_jj">\s*(.*?)</div>', html, re.DOTALL)
    if intro:
        intro_text = clean_html(intro.group(1))
        if intro_text != MISSING:
            detail["intro"] = intro_text
            detail["summary"] = intro_text[:MAX_SUMMARY_LEN]
        detail_images.extend(extract_image_urls(intro.group(1), BASE_URL))

    audience_block = re.search(r'<div class="kc_jj_1">\s*(.*?)</div>\s*<div class="h20">', html, re.DOTALL)
    if audience_block:
        audience = [clean_html(text, "") for text in re.findall(r"<a[^>]*>(.*?)</a>", audience_block.group(1), re.DOTALL)]
        audience = [item.lstrip("· ").strip() for item in audience if item]
        if audience:
            detail["audience"] = "、".join(audience)
            detail["target_audience"] = detail["audience"]

    schedule_html = extract_between(html, '<a name="rcap" id="rcap"></a>', '<a name="kcdg" id="kcdg"></a>')
    plans: List[Dict[str, str]] = []
    for date, location in re.findall(r'<div class="kc_ap">\s*<span[^>]*>(.*?)</span>\s*<em[^>]*>(.*?)</em>\s*</div>', schedule_html, re.DOTALL):
        plans.append(
            {
                "location": clean_html(location),
                "start_date": clean_html(date),
                "status": "待确认",
            }
        )
    if plans:
        detail["plans_json"] = plans
        detail["type"] = infer_course_type(plans)

    syllabus = re.search(r'<div class="kc_dg">(.*?)</div>\s*<div class="h20">', html, re.DOTALL)
    syllabus_text = ""
    if syllabus:
        syllabus_text = clean_html(syllabus.group(1))
        detail["syllabus"] = syllabus_text
        detail_images.extend(extract_image_urls(syllabus.group(1), BASE_URL))

    sections = extract_detail_sections(syllabus_text, meta_description)
    if sections["learning_outcomes"] != MISSING:
        detail["learning_outcomes"] = sections["learning_outcomes"]
    if sections["highlights"] != MISSING:
        detail["highlights"] = sections["highlights"]
    if sections["audience"] != MISSING:
        detail["audience"] = sections["audience"]
        detail["target_audience"] = sections["audience"]

    intro_text = clean_html(detail.get("intro"), "")
    if len(intro_text) < 20 and meta_description != MISSING:
        detail["intro"] = meta_description
        detail["summary"] = meta_description[:MAX_SUMMARY_LEN]

    intro_text = clean_html(detail.get("intro"), "")
    if len(intro_text) < 20 and detail.get("syllabus") not in (None, MISSING):
        derived_intro = derive_intro_from_syllabus(detail["syllabus"])
        if derived_intro != MISSING:
            detail["intro"] = derived_intro
            detail["summary"] = derived_intro[:MAX_SUMMARY_LEN]

    if detail_images:
        deduped = list(dict.fromkeys(detail_images))
        detail["cover_url"] = deduped[0]
        detail["services_json"] = [media_asset("detail_image", url, "课程详情图片") for url in deduped]

    return detail


def total_pages(html: str) -> int:
    match = re.search(r"(\d+)\s*条记录.*?(\d+)\s*页", html)
    if match:
        return int(match.group(2))
    pages = re.findall(r"\?&p=(\d+)", html)
    return max(int(page) for page in pages) if pages else 1


def parse_list(html: str, category_name: str = MISSING, default_type: str = "OPEN_OFFLINE") -> List[Dict[str, Any]]:
    courses: List[Dict[str, Any]] = []
    rows = re.findall(
        r'<tr>\s*<td><a href="/gkk_detail/(\d+)\.html"[^>]*>([^<]+(?:<[^>]+>[^<]*</[^>]+)?)</a></td>\s*'
        r"<td>[^<]*<a[^>]*>([^<]*)</a></td>\s*"
        r"<td>([^<]*)</td>\s*"
        r"<td>([^<]*)</td>\s*"
        r"<td>([^<]*)</td>\s*"
        r"<td>([^<]*)</td>\s*"
        r"<td[^>]*>([^<]*)</td>",
        html,
        re.DOTALL,
    )
    page_category = category_name if category_name != MISSING else extract_breadcrumb_category(html)
    for cid, title_html, location, train_date, trainer, price, duration, popularity in rows:
        location_text = clean_html(location)
        train_date_text = clean_html(train_date)
        plans = [
            {
                "location": location_text,
                "start_date": train_date_text,
                "status": "待确认",
            }
        ]
        item = {
                "source_course_id": cid,
                "source_url": f"{BASE_URL}/gkk_detail/{cid}.html",
                "title": clip_text(title_html, MAX_TITLE_LEN),
                "type": infer_course_type(plans, default_type),
                "category_name_raw": page_category,
                "cover_url": "",
                "intro": MISSING,
                "summary": MISSING,
                "syllabus": MISSING,
                "audience": MISSING,
                "highlights": MISSING,
                "duration_days": parse_int(duration),
                "keywords": MISSING,
                "trainer_name_raw": clip_text(trainer, MAX_TRAINER_LEN),
                "price": parse_price(price),
                "plans_json": plans,
                "evaluation_json": [],
                "target_audience": MISSING,
                "learning_outcomes": MISSING,
                "services_json": [],
                "view_count": parse_int(popularity),
                "raw_json": {
                    "location": location_text,
                    "train_date": train_date_text,
                    "price_raw": clean_html(price),
                    "duration_raw": clean_html(duration),
                    "popularity_raw": clean_html(popularity, "0"),
                },
            }
        set_price_fields(item, price)
        courses.append(item)
    return courses


def iter_nlypx_courses(max_items: int | None = None):
    seen: set[str] = set()
    emitted = 0

    for category in range(101, 111):
        category_name = CATEGORY_NAMES.get(category, MISSING)
        default_type = "OPEN_ONLINE" if category == 110 else "OPEN_OFFLINE"
        first_url = f"{BASE_URL}/gongkaike/{category}_0_0_0_0_0_0.html"
        try:
            first_html = fetch_text(first_url)
        except Exception as exc:
            logger.warning("nlypx course 分类首页抓取失败，跳过 category=%s url=%s error=%s", category, first_url, exc)
            continue
        pages = total_pages(first_html)
        for page in range(1, pages + 1):
            page_url = first_url if page == 1 else f"{first_url}?&p={page}"
            try:
                html = first_html if page == 1 else fetch_text(page_url)
            except Exception as exc:
                logger.warning("nlypx course 列表页抓取失败，跳过 category=%s page=%s url=%s error=%s", category, page, page_url, exc)
                continue
            rows = parse_list(html, category_name, default_type)
            if not rows:
                break
            for item in rows:
                key = item["source_course_id"] or item["source_url"]
                if key in seen:
                    continue
                seen.add(key)
                detail_error = ""
                try:
                    detail = parse_detail(fetch_text(item["source_url"]))
                    safe_update(item, detail)
                    if isinstance(detail.get("raw_json"), dict):
                        item.setdefault("raw_json", {}).update(detail["raw_json"])
                except Exception as exc:
                    detail_error = str(exc)
                item["title"] = clip_text(item.get("title"), MAX_TITLE_LEN)
                item["summary"] = clip_text(item.get("summary"), MAX_SUMMARY_LEN)
                item["learning_outcomes"] = clip_text(item.get("learning_outcomes"), MAX_LONG_FIELD_LEN)
                item["highlights"] = clip_text(item.get("highlights"), 1000)
                item["audience"] = clip_text(item.get("audience"), 800)
                item["category_name_raw"] = clip_text(item.get("category_name_raw"), MAX_CATEGORY_LEN)
                item["type"] = infer_course_type(item.get("plans_json"), item.get("type") or default_type)
                item["keywords"] = clip_text(item.get("keywords"), MAX_KEYWORDS_LEN)
                item["trainer_name_raw"] = clip_text(item.get("trainer_name_raw"), MAX_TRAINER_LEN)
                enrich_course_record(item, fallback_type=default_type)
                item["raw_json"] = {
                    **item["raw_json"],
                    "category": category,
                    "detail_error": detail_error,
                    "media_assets": (
                        ([media_asset("cover", item["cover_url"], "课程封面")] if item.get("cover_url") else [])
                        + (item.get("services_json") or [])
                    ),
                    "crawled_at": datetime.now().isoformat(),
                }
                yield item
                emitted += 1
                if max_items and emitted >= max_items:
                    return
                time.sleep(0.05)
            time.sleep(0.2)

def crawl_nlypx_courses(max_items: int | None = None) -> List[Dict[str, Any]]:
    return list(iter_nlypx_courses(max_items))


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class NlypxCourseSpider:
    """哪里有培训网课程爬虫适配器，供 JobManager 调用。"""

    name = "nlypx_course"
    source = "nlypx"
    data_type = "COURSE"
    max_items = None
    supported_course_types = ("OPEN_ONLINE", "OPEN_OFFLINE")
    coverage_note = "公开课源，按在线/线下排期区分线上公开课和线下公开课。"

    def pause(self) -> None:
        """兼容 JobManager 的取消流程。"""
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_nlypx_courses(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
