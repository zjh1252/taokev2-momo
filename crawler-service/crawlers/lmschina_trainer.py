"""
企学宝讲师爬虫。

依据 crawler-mvp/app.py 和 crawler-poc/crawler_lmschina_trainer.py 中
已经验证过的游客登录接口、分页接口和字段映射迁移。
"""
import asyncio
import json
import math
import time
import urllib.request
from datetime import datetime
from http.cookiejar import CookieJar
from typing import Any, AsyncGenerator, Dict, List

from crawlers.media import media_asset


BASE_URL = "https://mall.lmschina.net"
API_URL = f"{BASE_URL}/api/bdm/sys/getBasicEntityPage/teacher_.shtml"
PAGE_SIZE = 20
MISSING = "暂无"


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


def map_trainer(row: Dict[str, Any]) -> Dict[str, Any]:
    type_relations = row.get("type_relations", []) or []
    expertise = ", ".join([item.get("type_name", "") for item in type_relations if item.get("type_name")])
    institution_list = row.get("institutionList", []) or []
    if not institution_list:
        institution_list = row.get("organizations", []) or []
    institution = ""
    if institution_list:
        first_org = institution_list[0]
        institution = first_org.get("institution_name") or first_org.get("org_name") or ""
    remarks = row.get("remarks", "") or MISSING
    teacher_title = row.get("teacher_title", "") or ""
    title = teacher_title or remarks

    avatar = row.get("teacher_avatar", "") or ""
    trainer_id = str(row.get("id", "") or "")
    result = {
        "source_trainer_id": trainer_id,
        "source_url": f"{BASE_URL}/api/bdm/sys/getBasicEntity/teacher_.shtml?id={trainer_id}",
        "name": row.get("name", "") or MISSING,
        "title": title,
        "avatar": avatar,
        "one_line_intro": remarks,
        "bio": remarks,
        "intro": remarks,
        "good_at": expertise or MISSING,
        "expertise_tags": expertise or MISSING,
        "teaching_years": 0,
        "city": row.get("grade_name", "") or MISSING,
        "daily_price": str(row.get("course_pay", "")) if row.get("course_pay") else MISSING,
        "phone": row.get("user_name", "") or MISSING,
        "institution": institution or MISSING,
        "partial_clients": MISSING,
        "education_json": [],
        "experience_json": [],
        "honors_json": [],
        "books_json": [],
        "courses_json": [],
        "cases_json": [],
        "evaluation_json": {},
        "raw_json": row,
    }
    result["raw_json"] = {
        **row,
        "media_assets": [media_asset("avatar", avatar, "专家头像")] if avatar else [],
    }
    return result


def iter_lmschina_trainers(max_items: int | None = None):
    opener = make_opener()
    extra = "&customSortOder=desc&enabled=true"
    first = fetch_json(
        f"{API_URL}?ts={timestamp_ms()}&pageSize={PAGE_SIZE}&page=1{extra}",
        opener=opener,
    )
    if first.get("code") != 0:
        raise RuntimeError(f"企学宝讲师 API 返回异常: {first.get('msg') or first.get('data')}")

    total = int(first.get("data", {}).get("total", 0) or 0)
    total_pages = math.ceil(total / PAGE_SIZE) if total else 0
    seen: set[str] = set()
    emitted = 0

    for page in range(1, total_pages + 1):
        data = first if page == 1 else fetch_json(
            f"{API_URL}?ts={timestamp_ms()}&pageSize={PAGE_SIZE}&page={page}{extra}",
            opener=opener,
        )
        rows = data.get("data", {}).get("rows", []) if data.get("code") == 0 else []
        for row in rows:
            item = map_trainer(row)
            key = item["source_trainer_id"] or item["name"]
            if key in seen:
                continue
            seen.add(key)
            yield item
            emitted += 1
            if max_items and emitted >= max_items:
                return
        time.sleep(0.3)

def crawl_lmschina_trainers(max_items: int | None = None) -> List[Dict[str, Any]]:
    return list(iter_lmschina_trainers(max_items))


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class LmschinaTrainerSpider:
    """企学宝讲师爬虫适配器，供 JobManager 调用。"""

    name = "lmschina_trainer"
    source = "lmschina"
    data_type = "TRAINER"
    max_items = None

    def pause(self) -> None:
        """兼容 JobManager 的取消流程。"""
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_lmschina_trainers(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
