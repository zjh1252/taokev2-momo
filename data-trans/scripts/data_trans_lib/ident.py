from __future__ import annotations

import re


SAFE_IDENT_RE = re.compile(r"^[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)?$")


def quote_ident(value: str) -> str:
    if not SAFE_IDENT_RE.match(value):
        raise ValueError(f"unsafe SQL identifier: {value}")
    return ".".join(f"`{part}`" for part in value.split("."))
