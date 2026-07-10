"""HJCN 课程爬虫适配器。

当前 hjcn.com / www.hjcn.com 返回域名出售停放页，爬虫只做可访问性和停放页识别，
不编造课程数据。
"""
import asyncio
import logging
import re
import ssl
import time
import urllib.request
from datetime import datetime
from html import unescape
from typing import Any, AsyncGenerator, Dict, List


BASE_URL = "http://www.hjcn.com"
ALTERNATE_URLS = (
    "http://www.hjcn.com",
    "https://www.hjcn.com",
    "http://hjcn.com",
    "https://hjcn.com",
)
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
logger = logging.getLogger(__name__)

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE


def fetch_text(url: str, timeout: int = 10, retries: int = 2) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            kwargs: dict[str, Any] = {"timeout": timeout}
            if url.startswith("https://"):
                kwargs["context"] = SSL_CTX
            with urllib.request.urlopen(req, **kwargs) as resp:
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
    text = re.sub(r"</(?:p|div|li|tr|h[1-6])\s*>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text).replace("&nbsp;", " ")
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\n\s+", "\n", text)
    return " ".join(text.split()) or default


def extract_title(html: str) -> str:
    match = re.search(r"<title[^>]*>([\s\S]*?)</title>", html, flags=re.I)
    return clean_html(match.group(1)) if match else ""


def classify_probe_error(exc: Exception) -> Dict[str, Any]:
    text = str(exc)
    reason = "source_unreachable"
    if "getaddrinfo failed" in text or "Name or service not known" in text:
        reason = "dns_resolution_failed"
    elif "timed out" in text:
        reason = "source_timeout"
    elif "CERTIFICATE_VERIFY_FAILED" in text:
        reason = "tls_certificate_failed"
    return {
        "collectable": False,
        "reason": reason,
        "error": text[:500],
    }


def parse_site_status(html: str, url: str = BASE_URL) -> Dict[str, Any]:
    text = clean_html(html)
    title = extract_title(html)
    parked_markers = (
        "This Domain Is For Sale",
        "Premium Domain",
        "Buy on Afternic",
        "Buy on Aliyun",
        "Buy on Sedo",
        "Buy on Dynadot",
        "Nameslink",
        "is For Sale",
        "域名出售",
        "域名停放",
    )
    is_parked = any(marker in text for marker in parked_markers) or any(marker in title for marker in parked_markers)
    has_course_signals = any(
        word in text
        for word in (
            "公开课",
            "线上课",
            "直播课",
            "内训",
            "课程",
            "培训",
            "开课",
            "讲师",
            "企业定制",
        )
    )
    if is_parked:
        reason = "domain_parking_for_sale"
    elif not has_course_signals:
        reason = "no_course_signals_on_homepage"
    else:
        reason = "course_signals_found"
    return {
        "url": url,
        "title": title,
        "is_parked": is_parked,
        "has_course_signals": has_course_signals,
        "collectable": (not is_parked) and has_course_signals,
        "reason": reason,
        "raw_text_sample": text[:500],
    }


def probe_source() -> Dict[str, Any]:
    errors: list[dict[str, Any]] = []
    for url in ALTERNATE_URLS:
        try:
            html = fetch_text(url)
            status = parse_site_status(html, url)
            status["checked_urls"] = list(ALTERNATE_URLS)
            return status
        except Exception as exc:
            item = classify_probe_error(exc)
            item["url"] = url
            errors.append(item)
    return {
        "url": BASE_URL,
        "collectable": False,
        "reason": "all_candidate_urls_unreachable",
        "checked_urls": list(ALTERNATE_URLS),
        "errors": errors,
    }


def coverage_notes() -> list[str]:
    return [
        "OPEN_OFFLINE 未覆盖：hjcn.com / www.hjcn.com 当前返回域名出售停放页，未发现公开课课表、开课日期、城市或价格字段。",
        "OPEN_ONLINE 未覆盖：hjcn.com / www.hjcn.com 当前返回域名出售停放页，未发现线上公开课或直播入口。",
        "INTERNAL 未覆盖：hjcn.com / www.hjcn.com 当前返回域名出售停放页，未发现内训、企业定制或咨询方案入口。",
        "当前实现保留可运行适配器和停放页识别逻辑，避免把域名交易页误采为课程数据。",
    ]


def iter_hjcn_courses(max_items: int | None = None):
    status = probe_source()
    if not status.get("collectable"):
        logger.warning("hjcn source is not collectable: reason=%s status=%s", status.get("reason"), status)
        return
    logger.warning("hjcn source unexpectedly has course signals, but no parser is enabled yet")
    return
    yield  # pragma: no cover


def crawl_hjcn_courses(max_items: int | None = None) -> List[Dict[str, Any]]:
    return list(iter_hjcn_courses(max_items))


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class HjcnCourseSpider:
    """HJCN 课程爬虫适配器，供 JobManager 调用。"""

    name = "hjcn_course"
    source = "hjcn"
    data_type = "COURSE"
    max_items = None
    supported_course_types: tuple[str, ...] = ()
    coverage_note = (
        "hjcn.com / www.hjcn.com 当前返回域名出售停放页，未发现可采集的公开课、线上课或内训课入口；"
        "适配器只识别不可采集状态并返回空结果。"
    )

    def pause(self) -> None:
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_hjcn_courses(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
