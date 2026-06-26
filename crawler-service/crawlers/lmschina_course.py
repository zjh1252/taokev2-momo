"""
企学宝课程爬虫。

依据 crawler-mvp/app.py 和 crawler-poc/crawler_lmschina_course.py 中
已经验证过的游客登录接口、分页接口和字段映射迁移。
"""
import asyncio
import json
import math
import re
import time
import urllib.request
from datetime import datetime
from http.cookiejar import CookieJar
from typing import Any, AsyncGenerator, Dict, List

from crawlers.media import media_asset


BASE_URL = "https://mall.lmschina.net"
API_URL = f"{BASE_URL}/api/bdm/activity/getBasicEntityPage/activity_.shtml"
PAGE_SIZE = 50
MISSING = "暂无"
HELPER_NAMES = {"培训小助手"}


def timestamp_ms() -> int:
    return int(time.time() * 1000)


def make_opener() -> urllib.request.OpenerDirector:
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(CookieJar()))
    fetch_json(
        f"{BASE_URL}/api/wechat/loginByGuest.shtml?ts={timestamp_ms()}&siteId=0066&language=zh_CN&timeOffset=-480",
        opener=opener,
    )
    return opener


def fetch_json(url: str, opener: urllib.request.OpenerDirector | None = None) -> Dict[str, Any]:
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "Referer": f"{BASE_URL}/static/admin/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
    )
    open_fn = opener.open if opener else urllib.request.urlopen
    with open_fn(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8", errors="ignore"))


def normalize_text(value: Any) -> str:
    text = str(value or "").strip()
    return text if text else ""


def clean_html(value: Any) -> str:
    text = re.sub(r"<[^>]+>", " ", str(value or ""))
    text = " ".join(text.replace("&nbsp;", " ").split())
    return text


def extract_trainer_name(row: Dict[str, Any]) -> str:
    teachers = row.get("teachers", []) or []
    names: list[str] = []
    for teacher in teachers:
        if not isinstance(teacher, dict):
            continue
        name = normalize_text(teacher.get("teacher_name") or teacher.get("name"))
        if name and name not in HELPER_NAMES and name not in names:
            names.append(name)
    if names:
        return "、".join(names)

    creator_name = normalize_text(row.get("creator_name"))
    if row.get("creator_role") == "TRAINER" and creator_name and creator_name not in HELPER_NAMES:
        return creator_name
    return MISSING


def enrich_course_from_detail(item: Dict[str, Any], detail: Dict[str, Any]) -> None:
    summary_html = detail.get("summary") or ""
    summary_text = clean_html(summary_html)
    media_texts = detail.get("summary_media_texts", []) or []
    image_urls = [
        media.get("value")
        for media in media_texts
        if isinstance(media, dict) and media.get("type") == "img" and media.get("value")
    ]

    if summary_text:
        item["intro"] = summary_text
        item["summary"] = summary_text
        item["syllabus"] = summary_text
    elif image_urls:
        image_summary = "课程详情为图片资料，详见原始图片：" + "、".join(image_urls[:3])
        item["intro"] = image_summary
        item["summary"] = image_summary
        item["syllabus"] = image_summary

    target_users = detail.get("target_users") or clean_html(detail.get("target_users_locales") or "")
    objective = detail.get("objective") or clean_html(detail.get("objective_locales") or "")
    if target_users:
        item["audience"] = str(target_users)
        item["target_audience"] = str(target_users)
    if objective:
        item["learning_outcomes"] = str(objective)

    catalogs = detail.get("catalogs", []) or []
    if catalogs and catalogs[0].get("name"):
        item["category_name_raw"] = catalogs[0]["name"]
    item["train_time_range"] = detail.get("train_time_range", item.get("train_time_range", "")) or ""
    services = []
    if item.get("cover_url"):
        services.append(media_asset("cover", item["cover_url"], "课程封面"))
    services.extend(media_asset("summary_image", url, "课程详情长图") for url in image_urls)
    item["services_json"] = services
    item["raw_json"] = {
        **item.get("raw_json", {}),
        "detail": detail,
        "media_assets": services,
    }


def map_course(row: Dict[str, Any]) -> Dict[str, Any]:
    catalogs = row.get("catalogs", []) or []
    category_name = catalogs[0].get("name", "") if catalogs else ""
    activity_type = row.get("activity_type", "")
    source_id = str(row.get("id", "") or "")

    cover_url = row.get("activity_cover", "") or ""
    return {
        "source_course_id": source_id,
        "source_url": f"{BASE_URL}/static/admin/#/activity/detail/{source_id}",
        "title": row.get("activity_name", "") or MISSING,
        "type": "OPEN_OFFLINE" if activity_type != "COURSE" else "INTERNAL",
        "category_name_raw": category_name or MISSING,
        "cover_url": cover_url,
        "duration_days": row.get("class_hour", 0) or 0,
        "train_time_range": row.get("train_time_range", "") or "",
        "trainer_name_raw": extract_trainer_name(row),
        "price": row.get("enroll_fee", 0) or 0,
        "original_price": row.get("site_lease_fee", 0) or 0,
        "org_name": row.get("org_name", "") or "",
        "course_count": row.get("course_count", 0) or 0,
        "visit_count": row.get("visits_amount", 0) or 0,
        "view_count": row.get("visits_amount", 0) or 0,
        "keywords": MISSING,
        "level": MISSING,
        "intro": MISSING,
        "summary": MISSING,
        "highlights": MISSING,
        "audience": MISSING,
        "target_audience": MISSING,
        "learning_outcomes": MISSING,
        "syllabus": MISSING,
        "plans_json": [],
        "evaluation_json": [],
        "services_json": [],
        "popularity": row.get("upvote_amount", 0) or 0,
        "reference_price": row.get("site_buyout_fee", 0) or 0,
        "raw_json": {
            **row,
            "media_assets": [media_asset("cover", cover_url, "课程封面")] if cover_url else [],
        },
    }


def iter_lmschina_courses(max_items: int | None = None):
    opener = make_opener()
    first = fetch_json(f"{API_URL}?ts={timestamp_ms()}&pageSize={PAGE_SIZE}&page=1", opener=opener)
    if first.get("code") != 0:
        raise RuntimeError(f"企学宝课程 API 返回异常: {first.get('msg') or first.get('data')}")

    total = int(first.get("data", {}).get("total", 0) or 0)
    total_pages = math.ceil(total / PAGE_SIZE) if total else 0
    seen: set[str] = set()
    emitted = 0

    for page in range(1, total_pages + 1):
        data = first if page == 1 else fetch_json(
            f"{API_URL}?ts={timestamp_ms()}&pageSize={PAGE_SIZE}&page={page}",
            opener=opener,
        )
        rows = data.get("data", {}).get("rows", []) if data.get("code") == 0 else []
        for row in rows:
            item = map_course(row)
            key = item["source_course_id"] or item["source_url"]
            if key in seen:
                continue
            seen.add(key)
            try:
                detail = fetch_json(
                    f"{BASE_URL}/api/bdm/activity/getBasicEntity/activity_.shtml?ts={timestamp_ms()}&id={item['source_course_id']}",
                    opener=opener,
                )
                if detail.get("code") == 0 and isinstance(detail.get("data"), dict):
                    enrich_course_from_detail(item, detail["data"])
                else:
                    item["raw_json"] = {
                        **item.get("raw_json", {}),
                        "detail_error": detail.get("data") or detail.get("msg") or "详情 API 返回异常",
                    }
            except Exception as exc:
                item["raw_json"] = {**item.get("raw_json", {}), "detail_error": str(exc)}
            yield item
            emitted += 1
            if max_items and emitted >= max_items:
                return
        time.sleep(0.3)

def crawl_lmschina_courses(max_items: int | None = None) -> List[Dict[str, Any]]:
    return list(iter_lmschina_courses(max_items))


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class LmschinaCourseSpider:
    """企学宝课程爬虫适配器，供 JobManager 调用。"""

    name = "lmschina_course"
    source = "lmschina"
    data_type = "COURSE"
    max_items = None

    def pause(self) -> None:
        """兼容 JobManager 的取消流程。"""
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_lmschina_courses(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
