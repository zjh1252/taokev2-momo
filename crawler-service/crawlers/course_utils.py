import re
from dataclasses import dataclass
from html import unescape
from typing import Any, Dict, Iterable, List, Mapping, MutableMapping, Optional


MISSING_TEXTS = {"", "-", "--", "暂无", "待补充", "未知", "null", "None", "none"}

PRICE_FREE_WORDS = ("免费", "零元", "公益")
PRICE_NEGOTIABLE_WORDS = ("面议", "待商量", "待议", "咨询", "电话咨询", "联系客服", "详询", "电询", "议价")

ONLINE_WORDS = ("在线课程", "线上课程", "线上", "在线", "直播", "远程", "网络课程")
OFFLINE_WORDS = ("线下", "面授", "现场", "开课城市", "培训地点")
INTERNAL_WORDS = ("内训", "企业内训", "定制", "上门", "培训方案", "咨询式", "企业培训")
VIDEO_WORDS = ("录播", "视频课", "视频课程", "点播", "回放")
DOCUMENT_WORDS = ("文档课", "资料包", "课件下载")
AUDIO_WORDS = ("音频课", "音频课程")


@dataclass(frozen=True)
class ParsedPrice:
    value: float
    raw: str
    status: str


def clean_text(value: Any, default: str = "") -> str:
    if value is None:
        return default
    text = str(value)
    text = re.sub(r"<[^>]+>", " ", text)
    text = " ".join(unescape(text).replace("&nbsp;", " ").split())
    return text or default


def is_missing(value: Any) -> bool:
    text = clean_text(value)
    return text in MISSING_TEXTS


def first_present(*values: Any, default: str = "") -> str:
    for value in values:
        if not is_missing(value):
            return clean_text(value)
    return default


def safe_set(target: MutableMapping[str, Any], key: str, value: Any) -> None:
    if value is None:
        return
    if isinstance(value, str) and is_missing(value):
        return
    target[key] = value


def safe_update(target: MutableMapping[str, Any], updates: Mapping[str, Any]) -> None:
    for key, value in updates.items():
        safe_set(target, key, value)


def parse_price(value: Any) -> ParsedPrice:
    raw = clean_text(value)
    if not raw or raw in MISSING_TEXTS:
        return ParsedPrice(0.0, raw, "MISSING")

    normalized = raw.replace(",", "").replace("￥", "").replace("¥", "")
    match = re.search(r"\d+(?:\.\d+)?", normalized)
    if match:
        value = float(match.group())
        status = "FREE" if value == 0 and re.search(r"\b0(?:\.0+)?\s*元?", normalized) else "NUMERIC"
        return ParsedPrice(value, raw, status)
    if any(word in raw for word in PRICE_NEGOTIABLE_WORDS):
        return ParsedPrice(0.0, raw, "NEGOTIABLE")
    if any(word in raw for word in PRICE_FREE_WORDS):
        return ParsedPrice(0.0, raw, "FREE")
    return ParsedPrice(0.0, raw, "INVALID")


def append_diagnostic(record: MutableMapping[str, Any], field: str, reason: str, raw: Any = None) -> None:
    raw_json = ensure_raw_json(record)
    diagnostics = raw_json.setdefault("diagnostics", [])
    item = {"field": field, "reason": reason}
    if raw is not None:
        item["raw"] = clean_text(raw)
    if item in diagnostics:
        return
    diagnostics.append(item)


def ensure_raw_json(record: MutableMapping[str, Any]) -> Dict[str, Any]:
    raw_json = record.get("raw_json")
    if not isinstance(raw_json, dict):
        raw_json = {}
        record["raw_json"] = raw_json
    return raw_json


def set_price_fields(record: MutableMapping[str, Any], raw_price: Any) -> None:
    parsed = parse_price(raw_price)
    record["price"] = parsed.value
    raw_json = ensure_raw_json(record)
    raw_json["price_raw"] = parsed.raw
    raw_json["price_parse_status"] = parsed.status
    if parsed.status in {"MISSING", "INVALID", "NEGOTIABLE"}:
        append_diagnostic(record, "price", parsed.status.lower(), parsed.raw)


def detect_content_type(*values: Any) -> str:
    haystack = " ".join(clean_text(value) for value in values if value is not None)
    if any(word in haystack for word in VIDEO_WORDS):
        return "RECORDED_VIDEO"
    if any(word in haystack for word in DOCUMENT_WORDS):
        return "DOCUMENT"
    if any(word in haystack for word in AUDIO_WORDS):
        return "AUDIO"
    if "直播" in haystack:
        return "LIVE"
    return "COURSE"


def infer_course_type(
    *,
    text: Any = "",
    plans: Optional[Iterable[Mapping[str, Any]]] = None,
    fallback: str = "OPEN_OFFLINE",
) -> tuple[str, str]:
    evidence_parts: List[str] = []
    haystack_parts = [clean_text(text)]
    for plan in plans or []:
        haystack_parts.extend(
            clean_text(plan.get(key, ""))
            for key in ("location", "address", "online_url", "onlineUrl", "url", "status")
        )
    haystack = " ".join(part for part in haystack_parts if part)

    if any(word in haystack for word in INTERNAL_WORDS):
        evidence_parts.append("matched_internal_keyword")
        return "INTERNAL", ",".join(evidence_parts)
    if plans and any(
        clean_text(plan.get(key, ""))
        and not any(word in clean_text(plan.get(key, "")) for word in ONLINE_WORDS)
        for plan in plans
        for key in ("location", "city", "address")
    ):
        evidence_parts.append("has_offline_schedule_plan")
        return "OPEN_OFFLINE", ",".join(evidence_parts)
    if any(word in haystack for word in ONLINE_WORDS):
        evidence_parts.append("matched_online_keyword")
        return "OPEN_ONLINE", ",".join(evidence_parts)
    if any(word in haystack for word in OFFLINE_WORDS):
        evidence_parts.append("matched_offline_keyword")
        return "OPEN_OFFLINE", ",".join(evidence_parts)
    if normalize_course_type(fallback) == "INTERNAL":
        evidence_parts.append("fallback_internal")
        return "INTERNAL", ",".join(evidence_parts)
    if plans:
        evidence_parts.append("has_schedule_plan")
        return "OPEN_OFFLINE", ",".join(evidence_parts)

    normalized = normalize_course_type(fallback)
    evidence_parts.append("fallback")
    return normalized, ",".join(evidence_parts)


def normalize_course_type(value: Any, default: str = "OPEN_OFFLINE") -> str:
    if value is None:
        return default
    normalized = str(value).strip().upper()
    if normalized in {"OPEN_ONLINE", "OPEN_OFFLINE", "INTERNAL"}:
        return normalized
    if normalized == "ONLINE":
        return "OPEN_ONLINE"
    if normalized == "OFFLINE":
        return "OPEN_OFFLINE"
    return default


def extract_section_text(html: str, aliases: Iterable[str], limit: int = 1500) -> str:
    if not html:
        return ""
    alias_pattern = "|".join(re.escape(alias) for alias in aliases)
    patterns = [
        rf"(?:{alias_pattern})[：: ]*</?[^>]*>\s*([\s\S]*?)(?=<[^>]*(?:课程|培训|适用|对象|收益|目标|亮点|大纲|目录|内容|讲师|费用|价格)[^>]*>|$)",
        rf"(?:{alias_pattern})[：:]\s*([\s\S]*)",
    ]
    for pattern in patterns:
        match = re.search(pattern, html, re.IGNORECASE)
        if match:
            return clean_text(match.group(1))[:limit]
    return ""


def enrich_course_record(record: MutableMapping[str, Any], *, fallback_type: str = "OPEN_OFFLINE") -> MutableMapping[str, Any]:
    raw_json = ensure_raw_json(record)

    raw_price = raw_json.get("price_raw") or record.get("price_raw") or record.get("price")
    if raw_price is not None:
        set_price_fields(record, raw_price)

    plans = record.get("plans_json") if isinstance(record.get("plans_json"), list) else []
    type_text = " ".join(
        clean_text(record.get(key, ""))
        for key in ("type", "title", "category_name_raw", "summary", "intro", "keywords")
    )
    course_type, evidence = infer_course_type(text=type_text, plans=plans, fallback=record.get("type") or fallback_type)
    record["type"] = course_type
    normalize_course_timing(record)
    raw_json["type_evidence"] = evidence
    raw_json.setdefault("content_type", detect_content_type(type_text, record.get("summary"), record.get("intro")))
    if raw_json["content_type"] in {"RECORDED_VIDEO", "DOCUMENT", "AUDIO"}:
        append_diagnostic(record, "content_type", "non_course_content", raw_json["content_type"])

    for field in ("category_name_raw", "learning_outcomes", "audience", "highlights", "syllabus", "trainer_name_raw"):
        if is_missing(record.get(field)):
            append_diagnostic(record, field, "missing_or_default")

    return record


def normalize_course_timing(record: MutableMapping[str, Any], *, hours_per_day: float = 6.0) -> None:
    try:
        duration_days = float(record.get("duration_days") or 0)
    except (TypeError, ValueError):
        duration_days = 0
    try:
        total_hours = float(record.get("total_hours") or 0)
    except (TypeError, ValueError):
        total_hours = 0

    if duration_days > 0 and total_hours <= 0:
        record["total_hours"] = round(duration_days * hours_per_day, 1)
