#!/usr/bin/env python3
"""Write a review package for BASE..HEAD."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def run(args: list[str]) -> str:
    return subprocess.check_output(args, text=True, encoding="utf-8", errors="replace")


def main() -> int:
    if len(sys.argv) < 3:
        print("usage: _review_package.py BASE HEAD [OUT]", file=sys.stderr)
        return 2
    base, head = sys.argv[1], sys.argv[2]
    out = Path(sys.argv[3]) if len(sys.argv) >= 4 else Path(".superpowers/sdd") / f"review-{base[:7]}..{head[:7]}.diff"
    out.parent.mkdir(parents=True, exist_ok=True)
    commits = run(["git", "log", "--oneline", f"{base}..{head}"])
    stat = run(["git", "diff", "--stat", f"{base}..{head}"])
    diff = run(["git", "diff", "-U10", f"{base}..{head}"])
    body = (
        f"# Review package: {base}..{head}\n\n"
        f"## Commits\n{commits}\n"
        f"## Files changed\n{stat}\n"
        f"## Diff\n{diff}"
    )
    out.write_text(body, encoding="utf-8")
    count = len([l for l in commits.splitlines() if l.strip()])
    print(f"wrote {out}: {count} commit(s), {out.stat().st_size} bytes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
