from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from urllib.parse import urljoin


LEGACY_MARKER = "[legacy-import]"


@dataclass(frozen=True)
class OrderStatusMapping:
    order_status: int
    payment_status: int | None
    enrollment_status: int | None
    create_payment: bool
    create_enrollment: bool


def normalize_int(value: object, default: int = 0) -> int:
    if value is None or value == "":
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def normalize_bool(value: object, default: int = 0) -> int:
    return 1 if normalize_int(value, default) == 1 else 0


def normalize_money(value: object, *, cents: bool = False) -> Decimal:
    if value is None or value == "":
        amount = Decimal("0")
    else:
        amount = Decimal(str(value))
    if cents:
        amount = amount / Decimal("100")
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def normalize_datetime(value: object) -> datetime | None:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, (int, float)) or str(value).isdigit():
        seconds = int(value)
        if seconds <= 0:
            return None
        return datetime.fromtimestamp(seconds)
    text = str(value).strip()
    for pattern in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(text, pattern)
        except ValueError:
            pass
    return None


def normalize_asset_url(raw: object, base_url: str) -> str:
    if not isinstance(raw, str):
        return ""
    value = raw.strip()
    if not value:
        return ""
    if value.startswith("//"):
        return "https:" + value
    if value.startswith(("http://", "https://")):
        return value
    return urljoin(base_url.rstrip("/") + "/", value.lstrip("/"))


def map_video_order_status(status: object) -> OrderStatusMapping | None:
    legacy = normalize_int(status, default=-999)
    if legacy == 3:
        return OrderStatusMapping(1, 1, 1, True, True)
    return None


def legacy_import_remark(domain: str, attrs: dict[str, object]) -> str:
    suffix = "".join(f"[{key}={value}]" for key, value in attrs.items())
    return f"{LEGACY_MARKER}[{domain}]{suffix}"
