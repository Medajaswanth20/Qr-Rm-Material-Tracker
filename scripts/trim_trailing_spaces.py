#!/usr/bin/env python3
"""
Remove trailing whitespace from text (spaces, tabs, etc. at the end of each line).

Examples:
  python trim_trailing_spaces.py < input.txt > output.txt
  python trim_trailing_spaces.py data.txt -o cleaned.txt
  python -c "from trim_trailing_spaces import trim_trailing_spaces; print(repr(trim_trailing_spaces('hello   ')))"
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def trim_trailing_spaces(text: str) -> str:
    """Strip whitespace only from the end of the string (like str.rstrip())."""
    return text.rstrip()


def trim_text_preserve_lines(text: str) -> str:
    """Trim trailing whitespace on each line; keep line endings (\\n or \\r\\n)."""
    out: list[str] = []
    for line in text.splitlines(keepends=True):
        if line.endswith("\r\n"):
            out.append(trim_trailing_spaces(line[:-2]) + "\r\n")
        elif line.endswith("\n"):
            out.append(trim_trailing_spaces(line[:-1]) + "\n")
        else:
            out.append(trim_trailing_spaces(line))
    return "".join(out)


def main() -> None:
    parser = argparse.ArgumentParser(description="Trim trailing whitespace from each line of a file or stdin.")
    parser.add_argument(
        "path",
        nargs="?",
        help="Input file. If omitted, reads from standard input.",
    )
    parser.add_argument(
        "-o",
        "--output",
        metavar="FILE",
        help="Write result to FILE instead of stdout.",
    )
    args = parser.parse_args()

    if args.path:
        text = Path(args.path).read_text(encoding="utf-8", errors="replace")
    else:
        text = sys.stdin.read()

    result = trim_text_preserve_lines(text)

    if args.output:
        Path(args.output).write_text(result, encoding="utf-8", newline="")
    else:
        sys.stdout.write(result)


if __name__ == "__main__":
    main()
