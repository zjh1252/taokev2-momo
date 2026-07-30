#!/usr/bin/env python3
"""Extract one Task N section from an implementation plan."""
from __future__ import annotations

import re
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) < 3:
        print("usage: _extract_brief.py PLAN_FILE TASK_NUMBER [OUTFILE]", file=sys.stderr)
        return 2
    plan_path = Path(sys.argv[1])
    n = int(sys.argv[2])
    out = (
        Path(sys.argv[3])
        if len(sys.argv) >= 4
        else Path(".superpowers/sdd") / f"task-{n}-brief.md"
    )
    text = plan_path.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)
    result: list[str] = []
    intask = False
    infence = False
    heading = re.compile(r"^#+[ \t]+Task[ \t]+(\d+)")
    for line in lines:
        if line.startswith("```"):
            infence = not infence
        if not infence:
            m = heading.match(line)
            if m:
                intask = int(m.group(1)) == n
        if intask:
            result.append(line)
    if not result:
        print(f"task {n} not found in {plan_path}", file=sys.stderr)
        return 3
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("".join(result), encoding="utf-8")
    print(f"wrote {out}: {len(result)} lines")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
