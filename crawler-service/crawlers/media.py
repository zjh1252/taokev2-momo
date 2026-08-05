import re
from urllib.parse import urljoin
from typing import Any, MutableMapping


def normalize_url(base_url: str, value: str | None) -> str:
    """把来源站点的相对地址、协议相对地址统一成完整 URL。"""
    if not value:
        return ""
    url = str(value).strip()
    if not url or url.startswith("data:") or url.lower().startswith("file:"):
        return ""
    if url.startswith("//"):
        return "https:" + url
    return urljoin(base_url, url)


def extract_image_urls(html: str, base_url: str, limit: int = 20) -> list[str]:
    """从 HTML 片段中提取图片 URL，保持顺序并去重。"""
    urls: list[str] = []
    seen: set[str] = set()
    source = re.sub(r"<script[\s\S]*?</script>", " ", html or "", flags=re.I)
    source = re.sub(r"<style[\s\S]*?</style>", " ", source, flags=re.I)
    for tag in re.findall(r"<img\b[^>]*>", source, flags=re.I):
        match = re.search(r'(?:src|data-original|data-src)=["\']([^"\']+)["\']', tag, re.IGNORECASE)
        if not match:
            continue
        raw = match.group(1)
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


def content_type_for(text: str = "", html: str = "", images: list[dict[str, Any]] | None = None) -> str:
    has_text = bool((text or "").strip() or (html or "").strip())
    has_images = bool(images)
    if has_text and has_images:
        return "MIXED"
    if has_images:
        return "IMAGE"
    return "TEXT"


def apply_content_block(
    item: MutableMapping[str, Any],
    prefix: str,
    *,
    plain_text: str = "",
    html: str = "",
    images: list[dict[str, Any]] | None = None,
) -> None:
    image_items = images or []
    if plain_text:
        item[f"{prefix}_plain_text"] = plain_text
    if html:
        item[f"{prefix}_html"] = html
    if image_items:
        item[f"{prefix}_images"] = image_items
        item[f"{prefix}_images_json"] = image_items
    if plain_text or html or image_items:
        item[f"{prefix}_content_type"] = content_type_for(plain_text, html, image_items)


def apply_semantic_media_from_services(item: MutableMapping[str, Any]) -> None:
    """Promote explicitly typed media assets into review-only semantic fields."""
    typed_assets = {"syllabus_image": [], "site_photo": [], "honor_certificate": []}
    for asset in _iter_media_assets(item):
        kind = str(asset.get("type") or "")
        url = str(asset.get("url") or "")
        if kind in typed_assets and url:
            typed_assets[kind].append(asset)

    if typed_assets["syllabus_image"] and not item.get("syllabus_images"):
        apply_content_block(
            item,
            "syllabus",
            plain_text=str(item.get("syllabus") or ""),
            images=typed_assets["syllabus_image"],
        )
    if typed_assets["site_photo"] and not item.get("site_photos_images"):
        apply_content_block(item, "site_photos", images=typed_assets["site_photo"])
    if typed_assets["honor_certificate"] and not item.get("honor_certificates_images"):
        apply_content_block(item, "honor_certificates", images=typed_assets["honor_certificate"])


def _iter_media_assets(item: MutableMapping[str, Any]) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for asset in item.get("services_json") or []:
        if isinstance(asset, dict):
            result.append(asset)
    raw_json = item.get("raw_json")
    if isinstance(raw_json, dict):
        for asset in raw_json.get("media_assets") or []:
            if isinstance(asset, dict):
                result.append(asset)
    return result
