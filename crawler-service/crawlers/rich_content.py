import re
from html import escape, unescape
from html.parser import HTMLParser
from typing import Any, MutableMapping
from urllib.parse import urljoin, urlparse

from crawlers.media import apply_content_block


ALLOWED_TAGS = {
    "h1",
    "h2",
    "h3",
    "h4",
    "p",
    "div",
    "span",
    "b",
    "strong",
    "i",
    "em",
    "u",
    "ul",
    "ol",
    "li",
    "br",
    "table",
    "thead",
    "tbody",
    "tr",
    "td",
    "th",
}
BLOCK_TAGS = {"h1", "h2", "h3", "h4", "p", "div", "ul", "ol", "li", "table", "tr"}
DROP_CONTENT_TAGS = {"script", "style", "iframe", "object", "embed", "link", "meta", "form", "input", "button"}
VOID_TAGS = {"br"}
ALLOWED_STYLE_PROPS = {"color", "font-size", "font-weight", "text-align", "margin-left", "padding-left", "line-height"}


def sanitize_rich_html(html: str, base_url: str = "") -> str:
    if not html:
        return ""
    parser = _RichHtmlSanitizer(base_url)
    parser.feed(html)
    parser.close()
    return _compact_html("".join(parser.parts))


def html_to_plain_text(html: str) -> str:
    if not html:
        return ""
    text = re.sub(r"<(?:script|style|iframe|object|embed)[\s\S]*?</(?:script|style|iframe|object|embed)>", " ", html, flags=re.I)
    text = re.sub(r"</(?:p|div|h[1-6]|li|tr|table|ul|ol)\s*>", "\n", text, flags=re.I)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text).replace("\xa0", " ")
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\n\s*", "\n", text)
    return "\n".join(line.strip() for line in text.splitlines() if line.strip()).strip()


def apply_syllabus_rich_content(
    item: MutableMapping[str, Any],
    html: str,
    *,
    plain_text: str = "",
    images: list[dict[str, Any]] | None = None,
    base_url: str = "",
) -> None:
    sanitized = sanitize_rich_html(html, base_url)
    text = (plain_text or "").strip() or html_to_plain_text(sanitized)
    if not sanitized and not text and not images:
        return
    apply_content_block(item, "syllabus", plain_text=text, html=sanitized, images=images)


class _RichHtmlSanitizer(HTMLParser):
    def __init__(self, base_url: str = "") -> None:
        super().__init__(convert_charrefs=True)
        self.base_url = base_url
        self.parts: list[str] = []
        self.open_tags: list[str] = []
        self.drop_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        if tag in DROP_CONTENT_TAGS:
            self.drop_depth += 1
            return
        if self.drop_depth:
            return
        if tag == "img":
            return
        if tag == "a":
            return
        if tag not in ALLOWED_TAGS:
            return
        attr_text = self._attrs(tag, attrs)
        self.parts.append(f"<{tag}{attr_text}>")
        if tag not in VOID_TAGS:
            self.open_tags.append(tag)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in DROP_CONTENT_TAGS:
            if self.drop_depth:
                self.drop_depth -= 1
            return
        if self.drop_depth or tag not in ALLOWED_TAGS or tag in VOID_TAGS:
            return
        if tag in self.open_tags:
            while self.open_tags:
                current = self.open_tags.pop()
                self.parts.append(f"</{current}>")
                if current == tag:
                    break

    def handle_data(self, data: str) -> None:
        if self.drop_depth or not data:
            return
        self.parts.append(escape(data, quote=False))

    def handle_entityref(self, name: str) -> None:
        if not self.drop_depth:
            self.parts.append(f"&{name};")

    def handle_charref(self, name: str) -> None:
        if not self.drop_depth:
            self.parts.append(f"&#{name};")

    def close(self) -> None:
        super().close()
        while self.open_tags:
            self.parts.append(f"</{self.open_tags.pop()}>")

    def _attrs(self, tag: str, attrs: list[tuple[str, str | None]]) -> str:
        clean_attrs: list[str] = []
        for name, value in attrs:
            attr = (name or "").lower().strip()
            raw = value or ""
            if not attr or attr.startswith("on"):
                continue
            if attr == "style":
                style = _sanitize_style(raw)
                if style:
                    clean_attrs.append(f'style="{escape(style, quote=True)}"')
            elif tag in {"td", "th"} and attr in {"colspan", "rowspan"} and re.fullmatch(r"\d{1,2}", raw.strip()):
                clean_attrs.append(f'{attr}="{raw.strip()}"')
        return (" " + " ".join(clean_attrs)) if clean_attrs else ""


def _sanitize_style(value: str) -> str:
    declarations: list[str] = []
    for part in (value or "").split(";"):
        if ":" not in part:
            continue
        name, raw = part.split(":", 1)
        prop = name.strip().lower()
        val = raw.strip()
        lower_val = val.lower()
        if prop not in ALLOWED_STYLE_PROPS:
            continue
        if any(token in lower_val for token in ("expression", "javascript:", "data:", "url(", "@import")):
            continue
        declarations.append(f"{prop}: {val}")
    return "; ".join(declarations)


def _compact_html(value: str) -> str:
    text = re.sub(r">\s+<", "><", value or "")
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\s*(</?(?:h[1-4]|p|div|ul|ol|li|table|tr|td|th)[^>]*>)\s*", r"\1", text)
    text = text.strip()
    return text if html_to_plain_text(text) else ""


def normalize_html_url(base_url: str, value: str | None) -> str:
    raw = (value or "").strip()
    if not raw:
        return ""
    parsed = urlparse(raw)
    if parsed.scheme.lower() in {"javascript", "data", "file"}:
        return ""
    if raw.startswith("//"):
        return "https:" + raw
    return urljoin(base_url, raw)
