#!/usr/bin/env python3
"""Extract one Task N section from an implementation plan."""
from __future__ import annotations

import re
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: extract_task_brief.py PLAN_FILE TASK_NUMBER", file=sys.stderr)
        return 2
    plan_path = Path(sys.argv[1])
    n = int(sys.argv[2])
    text = plan_path.read_text(encoding="utf-8")
    out = Path(".superpowers/sdd") / f"task-{n}-brief.md"
    out.parent.mkdir(parents=True, exist_ok=True)

    infence = False
    intask = False
    buf: list[str] = []
    heading = re.compile(r"^#+[ \t]+Task[ \t]+(\d+)")
    for line in text.splitlines(keepends=True):
        if line.startswith("```"):
            infence = not infence
        if not infence:
            m = heading.match(line)
            if m:
                intask = int(m.group(1)) == n
        if intask:
            buf.append(line)

    if not buf:
        print(f"task {n} not found in {plan_path}", file=sys.stderr)
        return 3
    out.write_text("".join(buf), encoding="utf-8")
    print(f"wrote {out}: {len(buf)} lines")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
