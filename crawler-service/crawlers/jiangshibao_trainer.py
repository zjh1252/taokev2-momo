"""
讲师宝专家爬虫。

依据 crawler-poc/crawler_jiangshi_trainer.py 和
crawler-poc/docs/01-jiangshi99.md 中已经验证过的选择器迁移。
"""
import asyncio
import re
import time
import urllib.request
from datetime import datetime
from typing import Any, AsyncGenerator, Dict, List

from bs4 import BeautifulSoup

from crawlers.media import media_asset, normalize_url


BASE_URL = "https://www.jiangshi99.com"
LIST_URL = f"{BASE_URL}/Search/Teacher/0_0_0_0_0_0_0.html"


def clean_text(text: Any, default: str = "暂无") -> str:
    if text is None:
        return default
    cleaned = re.sub(r"\s+", " ", str(text)).strip()
    return cleaned or default


def optional_text(text: Any) -> str:
    return clean_text(text, "")


def parse_int(value: Any, default: int = 0) -> int:
    if value is None:
        return default
    match = re.search(r"\d+", str(value).replace(",", ""))
    return int(match.group()) if match else default


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


def extract_list_page(html: str) -> List[Dict[str, Any]]:
    """从讲师列表页提取卡片基础信息。"""
    trainers: List[Dict[str, Any]] = []
    page = BeautifulSoup(html, "html.parser")

    for card in page.select(".teacher-item"):
        name_el = card.select_one("h4 a") or card.select_one(".union a")
        href = name_el.get("href", "") if name_el else ""
        source_url = f"{BASE_URL}{href}" if href.startswith("/") else href
        source_trainer_id = href.rstrip("/").split("/")[-1] if href else ""

        major = card.select_one(".major")
        desc = card.select_one(".desc")
        subsidy = card.select_one(".subsidy")
        score_el = card.select_one(".score span") or card.select_one(".extend .score span")
        tel_el = card.select_one(".tel") or card.select_one(".extend .tel")

        domains = [
            clean_text(domain.get_text(" ", strip=True), "")
            for domain in card.select(".domain a")
        ]
        domains = [domain for domain in domains if domain]

        course_names = []
        course_el = card.select_one(".course .c")
        if course_el:
            course_names = [
                clean_text(name, "")
                for name in course_el.get_text(" ", strip=True).split("，")
            ]
            course_names = [name for name in course_names if len(name) > 2]

        all_text = card.get_text(" ", strip=True)
        years_match = re.search(r"(?:授课年限|授课经验)[：:]\s*(\d+)", all_text)
        city_match = re.search(r"常驻城市[：:]?\s*(\S+)", all_text)
        annual_match = re.search(r"年授课量[：:]\s*(\d+)", all_text)
        price_match = re.search(
            r"(\d+)\s*元/天",
            subsidy.get_text(" ", strip=True) if subsidy else "",
        )

        trainers.append(
            {
                "source_trainer_id": source_trainer_id,
                "source_url": source_url,
                "name": clean_text(name_el.get_text(" ", strip=True) if name_el else ""),
                "title": clean_text(major.get_text(" ", strip=True) if major else ""),
                "avatar": normalize_url(BASE_URL, optional_text(card.select_one(".avatar img").get("src", "") if card.select_one(".avatar img") else "")),
                "bio": clean_text(desc.get_text(" ", strip=True) if desc else ""),
                "expertise_tags": ", ".join(domains) if domains else "暂无",
                "teaching_years": parse_int(years_match.group(1) if years_match else None, 0),
                "city": clean_text(city_match.group(1) if city_match else ""),
                "annual_days": parse_int(annual_match.group(1) if annual_match else None, 0),
                "daily_price": parse_int(price_match.group(1) if price_match else None, 0),
                "score": clean_text(score_el.get_text(" ", strip=True) if score_el else ""),
                "phone": clean_text(tel_el.get_text(" ", strip=True) if tel_el else ""),
                "course_names": course_names,
            }
        )

    return trainers


def extract_detail(html: str) -> Dict[str, Any]:
    """从讲师详情页补充简介、荣誉、课程等字段。"""
    page = BeautifulSoup(html, "html.parser")
    name = (
        page.select_one(".t-title h3")
        or page.select_one(".card-general .name h3")
        or page.select_one(".teacher-name .name a")
        or page.select_one("h1")
    )
    intro = page.select_one(".t-desc p, .t-desc, .intro, [class*='intro']")
    major = page.select_one(".t-info .major, .card-general .major, .major")

    tags = [clean_text(tag.get_text(" ", strip=True), "") for tag in page.select(".domain-blcok a, .domain-block a")]
    honors = [
        clean_text(honor.get_text(" ", strip=True), "")
        for honor in page.select(".honor .items span")
    ]

    courses = []
    for item in page.select(".train-item"):
        title_el = item.select_one(".item-title a")
        title = clean_text(title_el.get_text(" ", strip=True), "") if title_el else ""
        if not title:
            continue
        duration_el = item.select_one(".arg span:first-child i")
        category_el = item.select_one(".arg span:last-child")
        cover_el = item.select_one(".thumb img")
        href = title_el.get("href", "") if title_el else ""
        courses.append(
            {
                "title": title,
                "duration": clean_text(duration_el.get_text(" ", strip=True) if duration_el else ""),
                "category": clean_text(category_el.get_text(" ", strip=True) if category_el else ""),
                "summary": "",
                "cover_url": normalize_url(BASE_URL, cover_el.get("src", "") if cover_el else ""),
                "source_url": f"{BASE_URL}{href}" if href.startswith("/") else href,
            }
        )

    all_text = page.get_text(" ", strip=True)
    years_match = re.search(r"(?:授课年限|授课经验)[：:]\s*(\d+)", all_text)
    city_match = re.search(r"常驻城市[：:]?\s*(\S+)", all_text)
    price_match = re.search(r"日常课酬[：:]?\s*(\d+)", all_text)
    days_match = re.search(r"年授课量[：:]\s*(\d+)", all_text)
    clients_match = re.search(r"(?:服务客户|部分客户|合作客户)[：:]?\s*(.{10,500})", all_text)

    return {
        "name": clean_text(name.get_text(" ", strip=True) if name else "", ""),
        "avatar": normalize_url(BASE_URL, optional_text(page.select_one(".avatar img").get("src", "") if page.select_one(".avatar img") else "")),
        "bio": clean_text(intro.get_text(" ", strip=True) if intro else "", ""),
        "expertise_tags": ", ".join([tag.strip() for tag in tags if tag.strip()]),
        "title": clean_text(major.get_text(" ", strip=True) if major else "", ""),
        "honors_json": [{"name": honor, "authority": "", "date": "", "description": ""} for honor in honors if honor],
        "courses_json": courses,
        "teaching_years": parse_int(years_match.group(1) if years_match else None, 0),
        "city": clean_text(city_match.group(1) if city_match else "", ""),
        "daily_price": parse_int(price_match.group(1) if price_match else None, 0),
        "annual_days": parse_int(days_match.group(1) if days_match else None, 0),
        "partial_clients": clean_text(clients_match.group(1)[:500] if clients_match else ""),
    }


def normalize_trainer(base: Dict[str, Any], detail: Dict[str, Any] | None = None) -> Dict[str, Any]:
    detail = detail or {}
    course_names = base.get("course_names") or []
    courses_json = detail.get("courses_json") or [
        {"title": name, "type": "", "category": "", "summary": ""}
        for name in course_names
    ]

    avatar = normalize_url(BASE_URL, detail.get("avatar") or base.get("avatar") or "")
    return {
        "source_trainer_id": base.get("source_trainer_id") or base.get("name") or "unknown",
        "source_url": base.get("source_url", ""),
        "name": detail.get("name") or base.get("name") or "暂无",
        "title": detail.get("title") or base.get("title") or "暂无",
        "avatar": avatar,
        "bio": detail.get("bio") or base.get("bio") or "暂无",
        "intro": detail.get("bio") or base.get("bio") or "暂无",
        "good_at": detail.get("expertise_tags") or base.get("expertise_tags") or "暂无",
        "expertise_tags": detail.get("expertise_tags") or base.get("expertise_tags") or "暂无",
        "teaching_years": detail.get("teaching_years") or base.get("teaching_years") or 0,
        "partial_clients": detail.get("partial_clients") or "暂无",
        "education_json": [],
        "experience_json": [],
        "honors_json": detail.get("honors_json") or [],
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


def crawl_jiangshibao_trainers(
    max_pages: int = 20,
    with_details: bool = False,
    max_items: int | None = None,
) -> List[Dict[str, Any]]:
    """全量爬取讲师宝专家。默认先走列表页，和 POC 快速模式一致。"""
    results: List[Dict[str, Any]] = []

    all_trainers: List[Dict[str, Any]] = []
    for page_num in range(1, max_pages + 1):
        url = f"{LIST_URL}?page={page_num}" if page_num > 1 else LIST_URL
        try:
            html = fetch_html(url, BASE_URL + "/")
        except Exception:
            break

        page_trainers = extract_list_page(html)
        if not page_trainers:
            break

        all_trainers.extend(page_trainers)
        if max_items and len(all_trainers) >= max_items:
            all_trainers = all_trainers[:max_items]
            break
        time.sleep(1)

    for trainer in all_trainers:
        detail = None
        if with_details and trainer.get("source_url"):
            try:
                html = fetch_html(trainer["source_url"], LIST_URL)
                if html:
                    detail = extract_detail(html)
                time.sleep(1.2)
            except Exception:
                detail = None
        results.append(normalize_trainer(trainer, detail))

    return results


class JiangshiBaoTrainerSpider:
    """讲师宝专家爬虫适配器，供 JobManager 调用。"""

    name = "jiangshibao_trainer"
    source = "jiangshibao"
    data_type = "TRAINER"
    max_items = None
    max_pages = 20
    with_details = True

    def pause(self) -> None:
        """兼容 JobManager 的取消流程。"""
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        records = await asyncio.to_thread(
            crawl_jiangshibao_trainers,
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
