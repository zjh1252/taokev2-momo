#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def run(args: list[str]) -> str:
    return subprocess.check_output(args, text=True, encoding="utf-8", errors="replace")


def main() -> int:
    if len(sys.argv) != 4:
        print("usage: make_review_pkg.py TASK_N BASE HEAD", file=sys.stderr)
        return 2
    n, base, head = sys.argv[1], sys.argv[2], sys.argv[3]
    out = Path(".superpowers/sdd") / f"task-{n}-review-pkg.md"
    commits = run(["git", "log", "--oneline", f"{base}..{head}"])
    stat = run(["git", "diff", "--stat", f"{base}..{head}"])
    diff = run(["git", "diff", "-U10", f"{base}..{head}"])
    out.write_text(
        f"# Review Package Task {n}\n\n"
        f"Base: {base}\nHead: {head}\n\n"
        f"## Commits\n\n{commits}\n"
        f"## Stat\n\n{stat}\n"
        f"## Diff\n\n```diff\n{diff}\n```\n",
        encoding="utf-8",
    )
    print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
