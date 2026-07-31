from __future__ import annotations

import argparse
import os
from dataclasses import dataclass, field
from typing import Iterable


@dataclass
class RunStats:
    scanned: int = 0
    inserted: int = 0
    updated: int = 0
    skipped: int = 0
    skip_reasons: dict[str, int] = field(default_factory=dict)

    def skip(self, reason: str) -> None:
        self.skipped += 1
        self.skip_reasons[reason] = self.skip_reasons.get(reason, 0) + 1


def add_common_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--source-dsn", default=os.getenv("OLD_MYSQL_DSN") or os.getenv("SOURCE_MYSQL_DSN"))
    parser.add_argument("--target-dsn", default=os.getenv("TARGET_MYSQL_DSN") or os.getenv("NEW_MYSQL_DSN"))
    parser.add_argument("--legacy-db", default=os.getenv("LEGACY_MYSQL_DATABASE", "taoke"))
    parser.add_argument("--asset-base-url", default=os.getenv("LEGACY_ASSET_BASE_URL", "https://www.taoke.com"))
    parser.add_argument("--batch-size", type=int, default=500)
    parser.add_argument("--dry-run", action="store_true", default=True)
    parser.add_argument("--apply", action="store_true")


def ensure_write_mode(args: argparse.Namespace) -> bool:
    apply = bool(getattr(args, "apply", False))
    args.dry_run = not apply
    return apply


def chunks(items: list, size: int) -> Iterable[list]:
    if size <= 0:
        raise ValueError("chunk size must be positive")
    for index in range(0, len(items), size):
        yield items[index : index + size]


def print_summary(name: str, stats: RunStats) -> None:
    print(f"{name}: scanned={stats.scanned} inserted={stats.inserted} updated={stats.updated} skipped={stats.skipped}")
    for reason, count in sorted(stats.skip_reasons.items()):
        print(f"  skip[{reason}]={count}")
