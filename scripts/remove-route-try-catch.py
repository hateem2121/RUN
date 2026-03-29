#!/usr/bin/env python3
"""
Remove outer try/catch wrappers from Express 5 route handlers.

Rules:
- Remove `  try {` lines (exactly 2-space indent) — outer handler try
- Remove the corresponding `  } catch (...) {` block and its body (2-space indent catch)
- Remove `(req as unknown as Record<string, boolean>)._handled = true;` lines
- Fix return type: Promise<undefined | Response> → Promise<void>
- Keep ALL try/catch blocks at indent != 2 (nested cache/db/etc. guards)
"""

import re
import sys
from pathlib import Path


def get_indent(line: str) -> int:
    return len(line) - len(line.lstrip())


def transform(content: str) -> str:
    lines = content.split("\n")
    result = []
    i = 0

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        indent = get_indent(line) if line.strip() else 0

        # ── Drop _handled marker ─────────────────────────────────────────────
        if "._handled = true;" in line:
            i += 1
            continue

        # ── Fix return type annotation ───────────────────────────────────────
        line = line.replace(": Promise<undefined | Response>", ": Promise<void>")
        line = line.replace(", Promise<undefined | Response>", ", Promise<void>")

        # ── Drop outer try { (indent == 2) ───────────────────────────────────
        if stripped == "try {" and indent == 2:
            i += 1
            continue

        # ── Drop outer } catch (...) { ... } (indent == 2) ───────────────────
        if indent == 2 and re.match(r"\} catch\s*[\(\{]", stripped):
            # Skip the entire catch block — count braces
            # The `} catch (...) {` line: the leading `}` closes the try body,
            # the trailing `{` opens the catch body → net depth = 0 after the line,
            # but we're *entering* the catch body so we track it as depth = 1.
            depth = 1
            i += 1
            while i < len(lines) and depth > 0:
                for ch in lines[i]:
                    if ch == "{":
                        depth += 1
                    elif ch == "}":
                        depth -= 1
                i += 1
            continue

        result.append(line)
        i += 1

    return "\n".join(result)


def process_file(path: Path) -> bool:
    original = path.read_text(encoding="utf-8")
    transformed = transform(original)
    if transformed != original:
        path.write_text(transformed, encoding="utf-8")
        return True
    return False


if __name__ == "__main__":
    files = sys.argv[1:]
    changed = 0
    for f in files:
        p = Path(f)
        if not p.exists():
            print(f"SKIP (not found): {f}")
            continue
        if process_file(p):
            print(f"  ✓ {p.name}")
            changed += 1
        else:
            print(f"  - {p.name} (no change)")
    print(f"\nTransformed {changed}/{len(files)} files.")
