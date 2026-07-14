"""高培商院课程爬虫适配器。"""
import asyncio
import logging
import re
import time
import urllib.request
from datetime import datetime
from html import unescape
from typing import Any, AsyncGenerator, Dict, Iterable, List
from urllib.parse import urljoin

from crawlers.course_utils import append_diagnostic, detect_content_type, enrich_course_record, set_price_fields
from crawlers.rich_content import apply_syllabus_rich_content


BASE_URL = "http://www.gaopei.org"
HOME_URL = BASE_URL
INTERNAL_LIST_URL = f"{BASE_URL}/gaopei/nxkcxt/list_1891.html"
INTERNAL_CATEGORY_URLS = [
    INTERNAL_LIST_URL,
    f"{BASE_URL}/gaopei/nxkcxt/list_1923.html",
    f"{BASE_URL}/gaopei/nxkcxt/qynx_1891_208.html",
    f"{BASE_URL}/gaopei/nxkcxt/qynx_1891_209.html",
    f"{BASE_URL}/gaopei/nxkcxt/qynx_1891_134.html",
    f"{BASE_URL}/gaopei/nxkcxt/qynx_1891_179.html",
]
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
MISSING = "暂无"
logger = logging.getLogger(__name__)


def fetch_text(url: str, timeout: int = 25, retries: int = 3) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                charset = resp.headers.get_content_charset() or "utf-8"
                return resp.read().decode(charset, errors="ignore")
        except Exception as exc:
            last_error = exc
            if attempt >= retries:
                break
            time.sleep(0.4 * attempt)
    raise RuntimeError(f"request failed after {retries} retries: {url}; {last_error}")


def clean_html(value: Any, default: str = "") -> str:
    if value is None:
        return default
    text = str(value)
    text = re.sub(r"<script[\s\S]*?</script>", " ", text, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<!--[\s\S]*?-->", " ", text)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"</p\s*>", "\n", text, flags=re.I)
    text = re.sub(r"</div\s*>", "\n", text, flags=re.I)
    text = re.sub(r"</li\s*>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text).replace("&nbsp;", " ")
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\n\s+", "\n", text)
    text = " ".join(text.split())
    return text or default


def absolute_url(value: str) -> str:
    return urljoin(BASE_URL + "/", value or "")


def source_id_from_url(url: str) -> str:
    match = re.search(r"_([0-9]+)\.html", url)
    if match:
        return match.group(1)
    return url.rstrip("/").rsplit("/", 1)[-1]


def meta_content(html: str, name: str) -> str:
    match = re.search(
        rf'<meta[^>]+name=["\']{re.escape(name)}["\'][^>]+content=["\'](.*?)["\']',
        html,
        flags=re.I | re.S,
    )
    return clean_html(match.group(1), MISSING) if match else MISSING


def extract_title(html: str, fallback: str = MISSING) -> str:
    for pattern in (
        r'<h1[^>]*>([\s\S]*?)</h1>',
        r"<title[^>]*>([\s\S]*?)</title>",
    ):
        match = re.search(pattern, html, flags=re.I | re.S)
        if not match:
            continue
        title = clean_html(match.group(1), fallback)
        title = re.sub(r"\s*[-_].*(高培商院|企业内训|公开课).*$", "", title).strip()
        if title and len(title) <= 180:
            return title
    return fallback


def breadcrumb_category(html: str, default: str = MISSING) -> str:
    match = re.search(r"当前位置：([\s\S]*?)(?:</p>|<!--面包屑导航 end-->)", html, flags=re.I)
    if not match:
        return default
    text = clean_html(match.group(1), default)
    parts = [part.strip() for part in re.split(r">>|>|浏览文章", text) if part.strip()]
    parts = [part for part in parts if part not in {"高培商院", "企业内训"}]
    return parts[-1] if parts else default


SECTION_STOPS = (
    "一、课程背景",
    "二、授课对象",
    "三、授课时数",
    "四、授课方法",
    "五、课程收益",
    "六、课程大纲",
    "三、培训特色",
    "三、课程特色",
    "四、授课风格",
    "五、课程时长",
    "六、课程形式",
    "七、课程大纲",
    "【课程分类】",
    "【课程内容】",
    "【课程目的】",
    "【上课方式】",
    "【讲师特点】",
    "【课程大纲】",
    "课程背景：",
    "课程核心亮点：",
    "课程收益：",
    "课程收益",
    "课程对象：",
    "授课对象",
    "培训对象：",
    "适合对象：",
    "课程大纲",
    "上一篇",
    "下一篇",
    "精品课程",
    "推荐课程",
)


def extract_detail_text(html: str) -> str:
    text = clean_html(html)
    anchors = ["课程简介：", "课程背景：", "【课程分类】", "项目简介："]
    positions = [text.find(anchor) for anchor in anchors if text.find(anchor) >= 0]
    if positions:
        text = text[min(positions):]
    for stop in ("精品课程", "推荐课程", "友情链接", "Copyright"):
        pos = text.find(stop)
        if pos > 800:
            text = text[:pos]
    return text


def extract_detail_html(html: str) -> str:
    anchors = ["课程简介：", "课程背景：", "【课程分类】", "项目简介："]
    positions = [html.find(anchor) for anchor in anchors if html.find(anchor) >= 0]
    start = min(positions) if positions else 0
    end = len(html)
    for stop in ("精品课程", "推荐课程", "友情链接", "Copyright"):
        pos = html.find(stop, start + 1)
        if pos > start:
            end = min(end, pos)
    return html[start:end]


def extract_after_labels(text: str, labels: Iterable[str], limit: int = 1800) -> str:
    positions: list[tuple[int, str]] = []
    for label in labels:
        pos = text.find(label)
        if pos >= 0:
            positions.append((pos, label))
    if not positions:
        return MISSING
    start, label = min(positions, key=lambda item: item[0])
    segment = text[start + len(label):].lstrip(" ：:【】")
    stops = []
    for stop in SECTION_STOPS:
        if stop in labels:
            continue
        pos = segment.find(stop)
        if pos > 0:
            stops.append(pos)
    if stops:
        segment = segment[: min(stops)]
    return segment.strip(" ：:【】")[:limit] or MISSING


def extract_intro(text: str, fallback: str = MISSING) -> str:
    intro = extract_after_labels(text, ("一、课程背景", "课程背景：", "课程背景", "【课程内容】", "项目简介：", "课程简介："), 1400)
    if intro != MISSING:
        return intro
    return fallback if fallback != MISSING else text[:700]


def extract_learning_outcomes(text: str) -> str:
    for labels in (
        ("五、课程收益", "课程收益：", "课程收益", "培训收益：", "学习收益："),
        ("【课程目的】", "课程目的：", "课程目标："),
        ("课程核心亮点：",),
    ):
        value = extract_after_labels(text, labels, 1800)
        if value != MISSING:
            return value
    return MISSING


def extract_audience(text: str) -> str:
    return extract_after_labels(text, ("二、授课对象", "授课对象", "课程对象：", "培训对象：", "适合对象：", "适用对象：", "学员对象："), 1000)


def extract_highlights(text: str) -> str:
    return extract_after_labels(text, ("课程核心亮点：", "【上课方式】", "【讲师特点】", "课程特色："), 1200)


def extract_syllabus(text: str) -> str:
    syllabus = extract_after_labels(text, ("六、课程大纲", "【课程大纲】", "课程大纲：", "课程大纲"), 5000)
    return syllabus if syllabus != MISSING else text[:5000]


def parse_duration_days(*values: Any) -> int:
    text = " ".join(clean_html(value) for value in values if value)
    match = re.search(r"培训天数\s*([0-9]+(?:\s*-\s*[0-9]+)?)(?:天)?", text)
    if not match:
        match = re.search(r"([0-9]+)(?:\s*-\s*[0-9]+)?\s*天", text)
    if match:
        return max(1, int(match.group(1).split("-")[0].strip()))
    return 0


def extract_cover_url(html: str) -> str:
    match = re.search(r'<div[^>]+class=["\'][^"\']*neixuninfo_img[^"\']*["\'][^>]*>[\s\S]*?<img[^>]+src=["\']([^"\']+)["\']', html, re.I)
    if match:
        return absolute_url(match.group(1))
    return ""


def extract_trainer(html: str, text: str, item: dict[str, Any]) -> str:
    match = re.search(r'<div[^>]+class=["\'][^"\']*course_show[^"\']*["\'][^>]*>[\s\S]*?<h3[^>]*>\s*<b>([\s\S]*?)</b>', html, re.I)
    if match:
        return clean_html(match.group(1), MISSING)
    match = re.search(r"主讲老师[:：]\s*([^\s，,。；;]+)", text)
    if match:
        return clean_html(match.group(1), MISSING)
    return item.get("trainer_name_raw") or MISSING


def parse_internal_list_rows(html: str, *, limit: int | None = None) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    pattern = r'<a[^>]+href=["\']([^"\']*/gaopei/nxkcxt/[^"\']+_\d+_\d+\.html)["\'][^>]*>([\s\S]*?)</a>'
    for href, body in re.findall(pattern, html, flags=re.I):
        url = absolute_url(href)
        if url in seen:
            continue
        body_text = clean_html(body, MISSING)
        if body_text in {"查看详细", MISSING} or len(body_text) < 4:
            continue
        if re.search(r"/(?:szxt|alxt|bgkc)/", url):
            continue
        seen.add(url)
        title = body_text
        duration_match = re.search(r"培训天数\s*([0-9]+(?:-[0-9]+)?天?)", body_text)
        category_match = re.search(r"培训天数[^主]*?天\s*([^主]+?)\s*主讲老师", body_text)
        trainer_match = re.search(r"主讲老师[:：]\s*([^\s]+)", body_text)
        title = re.split(r"培训天数|主讲老师", title)[0].strip()
        rows.append(
            {
                "url": url,
                "source_course_id": source_id_from_url(url),
                "title": title.strip("《》") or body_text[:80],
                "category_name_raw": clean_html(category_match.group(1), MISSING) if category_match else MISSING,
                "duration_days": clean_html(duration_match.group(1), "") if duration_match else "",
                "trainer_name_raw": clean_html(trainer_match.group(1), MISSING) if trainer_match else MISSING,
                "type": "INTERNAL",
                "source_entry": "internal_course_list",
            }
        )
        if limit and len(rows) >= limit:
            break
    return rows


def parse_internal_detail_html(item: dict[str, Any], html: str) -> Dict[str, Any]:
    detail_text = extract_detail_text(html)
    full_text = clean_html(html)
    summary = meta_content(html, "description")
    duration_days = parse_duration_days(item.get("duration_days"), full_text)
    trainer = extract_trainer(html, full_text, item)
    category = item.get("category_name_raw")
    if not category or category == MISSING:
        category = breadcrumb_category(html)
    record: Dict[str, Any] = {
        "source_course_id": item.get("source_course_id") or source_id_from_url(item["url"]),
        "source_url": item["url"],
        "title": extract_title(html, item.get("title") or MISSING).strip("《》"),
        "type": "INTERNAL",
        "category_name_raw": category,
        "cover_url": extract_cover_url(html),
        "intro": extract_intro(detail_text, summary),
        "summary": (summary if summary != MISSING else extract_intro(detail_text, summary))[:500],
        "syllabus": extract_syllabus(detail_text),
        "audience": extract_audience(detail_text),
        "target_audience": "",
        "learning_outcomes": extract_learning_outcomes(detail_text),
        "highlights": extract_highlights(detail_text),
        "duration_days": duration_days,
        "total_hours": float(duration_days * 6) if duration_days else 0,
        "original_price": 0,
        "keywords": meta_content(html, "keywords"),
        "trainer_name_raw": trainer,
        "plans_json": [],
        "services_json": [],
        "raw_json": {
            "source_entry": item.get("source_entry", "internal_course_list"),
            "source_entry_name": "企业内训",
            "content_type": "COURSE",
            "type_evidence": "gaopei_nxkcxt_internal_course",
            "category_evidence": "list card or breadcrumb",
            "field_sources": {
                "plans_json": "企业内训课程库无公开固定排期",
                "price": "内训咨询/面议",
                "trainer_name_raw": "列表主讲老师或详情课程师资",
                "learning_outcomes": "详情课程目的/课程收益/课程核心亮点",
                "audience": "详情培训对象/课程对象",
                "syllabus": "详情课程大纲或课程简介正文",
            },
            "coverage_notes": [
                "INTERNAL 已覆盖：企业内训栏目和首页课程卡片提供课程详情，详情页提供师资、分类、简介、目的/亮点和大纲。",
                "OPEN_OFFLINE 未导入 courses：未发现带公开开课时间、城市、价格的可靠公开课列表；站点标题中的公开课属于 SEO 文案。",
                "OPEN_ONLINE 未导入 courses：未发现可确认的线上公开课/直播课排期入口。",
            ],
            "diagnostics": [],
        },
    }
    apply_syllabus_rich_content(
        record,
        extract_detail_html(html),
        plain_text="" if record["syllabus"] == MISSING else record["syllabus"],
        base_url=BASE_URL,
    )
    set_price_fields(record, "内训咨询")
    append_diagnostic(record, "plans_json", "internal_course_has_no_public_schedule")
    if detect_content_type(detail_text, record["title"]) in {"RECORDED_VIDEO", "DOCUMENT", "AUDIO", "ARTICLE"}:
        record["raw_json"]["content_type"] = detect_content_type(detail_text, record["title"])
    enrich_course_record(record, fallback_type="INTERNAL")
    record["type"] = "INTERNAL"
    record["raw_json"]["content_type"] = "COURSE"
    record["raw_json"]["type_evidence"] = "gaopei_nxkcxt_internal_course"
    return record


def discover_internal_items(limit: int) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    seen: set[str] = set()
    for url in [HOME_URL] + INTERNAL_CATEGORY_URLS:
        try:
            page_items = parse_internal_list_rows(fetch_text(url), limit=limit)
        except Exception as exc:
            logger.warning("gaopei internal list failed url=%s error=%s", url, exc)
            continue
        for item in page_items:
            if item["url"] in seen:
                continue
            seen.add(item["url"])
            items.append(item)
            if len(items) >= limit:
                return items
    return items


def iter_gaopei_courses(max_items: int | None = None):
    limit = max_items or 100
    candidates = discover_internal_items(limit)
    seen: set[str] = set()
    for item in candidates[:limit]:
        key = f"{item.get('source_course_id')}:{item.get('type')}"
        if key in seen:
            continue
        seen.add(key)
        try:
            html = fetch_text(item["url"])
            record = parse_internal_detail_html(item, html)
            if record.get("raw_json", {}).get("content_type") in {"RECORDED_VIDEO", "DOCUMENT", "AUDIO", "ARTICLE"}:
                continue
            yield record
        except Exception as exc:
            logger.warning("gaopei course detail failed, skip url=%s error=%s", item.get("url"), exc)
        time.sleep(0.1)


def crawl_gaopei_courses(max_items: int | None = None) -> List[Dict[str, Any]]:
    return list(iter_gaopei_courses(max_items))


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class GaopeiCourseSpider:
    """高培商院课程爬虫适配器，供 JobManager 调用。"""

    name = "gaopei_course"
    source = "gaopei"
    data_type = "COURSE"
    max_items = None
    supported_course_types = ("INTERNAL",)
    coverage_note = (
        "企业内训课程库覆盖 INTERNAL；未发现带公开排期、城市和价格的可靠公开课列表，也未发现线上公开课入口。"
    )

    def pause(self) -> None:
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_gaopei_courses(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
