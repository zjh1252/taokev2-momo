import re
from urllib.parse import urljoin


def normalize_url(base_url: str, value: str | None) -> str:
    """把来源站点的相对地址、协议相对地址统一成完整 URL。"""
    if not value:
        return ""
    url = str(value).strip()
    if not url or url.startswith("data:"):
        return ""
    if url.startswith("//"):
        return "https:" + url
    return urljoin(base_url, url)


def extract_image_urls(html: str, base_url: str, limit: int = 20) -> list[str]:
    """从 HTML 片段中提取图片 URL，保持顺序并去重。"""
    urls: list[str] = []
    seen: set[str] = set()
    for raw in re.findall(r'(?:src|data-original|data-src)=["\']([^"\']+)["\']', html or "", re.IGNORECASE):
        url = normalize_url(base_url, raw)
        if not url or url in seen:
            continue
        seen.add(url)
        urls.append(url)
        if len(urls) >= limit:
            break
    return urls


def media_asset(kind: str, url: str, label: str = "") -> dict[str, str]:
    return {"type": kind, "url": url, "label": label}
