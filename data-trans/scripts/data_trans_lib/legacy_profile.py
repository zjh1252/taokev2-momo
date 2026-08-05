from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Iterable

from data_trans_lib.legacy import normalize_asset_url, normalize_int


LEGACY_TIMESTAMP_TZ = timezone.utc
TEXT_BLANKS = {"", "N;", "NULL", "null", "None", "none"}
TEXT_ZERO_BLANKS = TEXT_BLANKS | {"0", "0.0", "0.00"}


def clean_text(
    value: object,
    max_length: int | None = None,
    *,
    none_if_blank: bool = True,
    zero_is_blank: bool = False,
) -> str | None:
    text = "" if value is None else str(value).strip()
    blanks = TEXT_ZERO_BLANKS if zero_is_blank else TEXT_BLANKS
    if text in blanks:
        return None if none_if_blank else ""
    if max_length is not None and len(text) > max_length:
        text = text[:max_length]
    return text


def clean_required(value: object, max_length: int | None = None) -> str:
    return clean_text(value, max_length, none_if_blank=False) or ""


def first_text(
    row: dict,
    keys: Iterable[str],
    max_length: int | None = None,
    *,
    none_if_blank: bool = True,
    zero_is_blank: bool = False,
) -> str | None:
    for key in keys:
        value = clean_text(row.get(key), max_length, none_if_blank=True, zero_is_blank=zero_is_blank)
        if value:
            return value
    return None if none_if_blank else ""


def join_texts(parts: Iterable[object], *, separator: str = "\n", max_length: int | None = None) -> str | None:
    values: list[str] = []
    for part in parts:
        text = clean_text(part, zero_is_blank=True)
        if text and text not in values:
            values.append(text)
    if not values:
        return None
    joined = separator.join(values)
    if max_length is not None and len(joined) > max_length:
        return joined[:max_length]
    return joined


def legacy_datetime(value: object) -> datetime | None:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value.replace(tzinfo=None)
    if isinstance(value, date):
        return datetime(value.year, value.month, value.day)

    text = str(value).strip()
    if text in TEXT_ZERO_BLANKS or text.startswith("0000-00-00"):
        return None
    if text.isdigit():
        seconds = int(text)
        if seconds <= 0:
            return None
        try:
            return datetime.fromtimestamp(seconds, LEGACY_TIMESTAMP_TZ).replace(tzinfo=None)
        except (OSError, OverflowError, ValueError):
            return None

    for pattern in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(text, pattern)
        except ValueError:
            pass
    return None


def fallback_datetime(*values: object) -> datetime:
    for value in values:
        parsed = legacy_datetime(value)
        if parsed is not None:
            return parsed
    return datetime.now(LEGACY_TIMESTAMP_TZ).replace(tzinfo=None)


def legacy_date(value: object) -> date | None:
    parsed = legacy_datetime(value)
    if parsed is not None:
        return parsed.date()
    return None


def bounded_int(value: object, default: int = 0, *, minimum: int = 0, maximum: int | None = None) -> int:
    result = normalize_int(value, default)
    if result < minimum:
        return default
    if maximum is not None and result > maximum:
        return maximum
    return result


def money_or_none(value: object, *, zero_is_none: bool = True) -> Decimal | None:
    if value is None or value == "":
        return None
    try:
        amount = Decimal(str(value).strip())
    except (InvalidOperation, ValueError):
        return None
    if not amount.is_finite():
        return None
    amount = amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if zero_is_none and amount == Decimal("0.00"):
        return None
    return amount


def score_0_to_5(value: object) -> Decimal:
    amount = money_or_none(value, zero_is_none=False) or Decimal("0.00")
    if amount < Decimal("0.00"):
        amount = Decimal("0.00")
    if amount > Decimal("5.00"):
        amount = Decimal("5.00")
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def asset_url(value: object, base_url: str) -> str | None:
    text = clean_text(value)
    if not text:
        return None
    return normalize_asset_url(text, base_url)


def map_user_status(is_deleted: object, state: object) -> int:
    if normalize_int(is_deleted) == 1:
        return 3
    if normalize_int(state, 1) < 0:
        return 2
    return 1


def map_role_status(is_deleted: object) -> int:
    return 4 if normalize_int(is_deleted) == 1 else 1


def map_trainer_status(isapprove: object, is_deleted: object) -> int:
    if normalize_int(is_deleted) == 1:
        return 4
    approved = normalize_int(isapprove, 0)
    if approved == 1:
        return 2
    if approved == -1:
        return 3
    return 1


def map_institution_status(isapprove: object, is_deleted: object) -> int:
    if normalize_int(is_deleted) == 1:
        return 2
    approved = normalize_int(isapprove, 0)
    if approved == 1:
        return 1
    if approved == -1:
        return 2
    return 0


def map_review_status(isapprove: object) -> int | None:
    approved = normalize_int(isapprove, default=-999)
    if approved == 1:
        return 2
    if approved == -1:
        return 3
    if approved == 0:
        return 1
    return None
