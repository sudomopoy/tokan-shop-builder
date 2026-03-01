#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import pathlib
import re
import sys
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass

PERSIAN_RE = re.compile(r"[\u0600-\u06FF]")
ENGLISH_RE = re.compile(r"[A-Za-z]")
JSX_TEXT_INLINE_RE = re.compile(r">\s*([^<>{}]+?)\s*<")
UI_PROP_RE = re.compile(
    r"""\b(title|label|placeholder|aria-label|alt|description|helperText|tooltip|caption|heading)\s*=\s*(['"`])(.+?)\2"""
)
UI_CALL_RE = re.compile(
    r"""\b(alert|confirm|prompt|setError|setSuccess|setWarning|setInfo|toast\.(?:success|error|info|warning))\s*\(\s*(['"`])(.+?)\2"""
)
LOCALE_LITERAL_RE = re.compile(r"""\b(fa|en)\s*:\s*(['"`])(.+?)\2""")
HTML_ATTR_RE = re.compile(
    r"""\b(title|placeholder|aria-label|alt|value)\s*=\s*(['"])(.+?)\2"""
)

DEFAULT_EXTENSIONS = {".py", ".ts", ".tsx", ".js", ".jsx", ".html"}
DEFAULT_EXCLUDE_DIRS = {
    ".git",
    "node_modules",
    "__pycache__",
    ".next",
    ".venv",
    "venv",
    "dist",
    "build",
    "coverage",
    "migrations",
    "locale",
    "public/themes",
    "assets",
}
DEFAULT_EXCLUDE_FILES = {
    "yarn.lock",
    "package-lock.json",
    "pnpm-lock.yaml",
}
TECHNICAL_VALUE_RE = re.compile(r"^[A-Za-z0-9_./:#-]+$")
ENGLISH_WORD_RE = re.compile(r"[A-Za-z]{2,}")
TRANSLATION_HINTS = ("_(", "gettext(", "gettext_lazy(", "pickByLocale(", "localizedString(", "t(")


@dataclass(frozen=True)
class Finding:
    path: str
    line: int
    kind: str
    text: str


def should_exclude(path: pathlib.Path) -> bool:
    text = path.as_posix().lower()
    parts = {part.lower() for part in path.parts}
    if path.name.lower() in DEFAULT_EXCLUDE_FILES:
        return True
    for token in DEFAULT_EXCLUDE_DIRS:
        if "/" in token:
            if token in text:
                return True
            continue
        if token.lower() in parts:
            return True
    return False


def iter_files(root: pathlib.Path):
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if should_exclude(path):
            continue
        if path.suffix.lower() not in DEFAULT_EXTENSIONS:
            continue
        yield path


def line_no_from_index(content: str, index: int) -> int:
    return content.count("\n", 0, index) + 1


def looks_like_ui_text(value: str) -> bool:
    text = value.strip()
    if not text:
        return False

    if "{{" in text or "{%" in text:
        return False

    if PERSIAN_RE.search(text):
        return True

    if not ENGLISH_RE.search(text):
        return False

    if TECHNICAL_VALUE_RE.fullmatch(text):
        return False

    if " " in text:
        return bool(ENGLISH_WORD_RE.search(text))

    return len(text) >= 4 and bool(ENGLISH_WORD_RE.search(text))


def has_translation_hint(line: str) -> bool:
    return any(hint in line for hint in TRANSLATION_HINTS)


def add_finding(findings: list[Finding], path: pathlib.Path, line: int, kind: str, text: str):
    findings.append(
        Finding(
            path=path.as_posix(),
            line=line,
            kind=kind,
            text=text.strip(),
        )
    )


def audit_tsx_jsx(path: pathlib.Path, content: str) -> list[Finding]:
    findings: list[Finding] = []
    for idx, raw_line in enumerate(content.splitlines(), start=1):
        line = raw_line

        for match in JSX_TEXT_INLINE_RE.finditer(line):
            text = match.group(1).strip()
            if not looks_like_ui_text(text):
                continue
            add_finding(findings, path, idx, "jsx_text", text)

        if has_translation_hint(line):
            continue

        for match in UI_PROP_RE.finditer(line):
            value = match.group(3)
            if looks_like_ui_text(value):
                add_finding(findings, path, idx, "ui_prop_string", value)

        for match in UI_CALL_RE.finditer(line):
            value = match.group(3)
            if looks_like_ui_text(value):
                add_finding(findings, path, idx, "ui_call_string", value)

        for match in LOCALE_LITERAL_RE.finditer(line):
            value = match.group(3)
            if looks_like_ui_text(value):
                add_finding(findings, path, idx, "locale_literal", value)

    return findings


def audit_html(path: pathlib.Path, content: str) -> list[Finding]:
    findings: list[Finding] = []
    for idx, line in enumerate(content.splitlines(), start=1):
        for match in JSX_TEXT_INLINE_RE.finditer(line):
            text = match.group(1).strip()
            if not looks_like_ui_text(text):
                continue
            add_finding(findings, path, idx, "html_text", text)

        for match in HTML_ATTR_RE.finditer(line):
            value = match.group(3)
            if looks_like_ui_text(value):
                add_finding(findings, path, idx, "html_attr_text", value)
    return findings


def audit_admin_python(path: pathlib.Path, content: str) -> list[Finding]:
    findings: list[Finding] = []
    lines = content.splitlines()

    assignment_patterns = [
        ("short_description", re.compile(r"""short_description\s*=\s*(['"])(.+?)\1""")),
        ("description", re.compile(r"""description\s*=\s*(['"])(.+?)\1""")),
        ("label", re.compile(r"""label\s*=\s*(['"])(.+?)\1""")),
        ("help_text", re.compile(r"""help_text\s*=\s*(['"])(.+?)\1""")),
        ("verbose_name", re.compile(r"""verbose_name(?:_plural)?\s*=\s*(['"])(.+?)\1""")),
    ]
    call_patterns = [
        ("message_user", re.compile(r"""message_user\s*\(\s*request\s*,\s*(['"])(.+?)\1""")),
        ("messages", re.compile(r"""messages\.(?:error|warning|success|info)\s*\(\s*request\s*,\s*(['"])(.+?)\1""")),
    ]

    for idx, raw_line in enumerate(lines, start=1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue

        if has_translation_hint(line):
            continue

        for kind, pattern in assignment_patterns:
            for match in pattern.finditer(line):
                value = match.group(2)
                if looks_like_ui_text(value):
                    add_finding(findings, path, idx, f"admin_{kind}_string", value)

        for kind, pattern in call_patterns:
            for match in pattern.finditer(line):
                value = match.group(2)
                if looks_like_ui_text(value):
                    add_finding(findings, path, idx, f"admin_{kind}_string", value)

    return findings


def audit_file(path: pathlib.Path, content: str) -> list[Finding]:
    suffix = path.suffix.lower()
    normalized = path.as_posix().lower()

    if suffix in {".tsx", ".jsx"}:
        return audit_tsx_jsx(path, content)

    if suffix == ".html":
        if "/backend/" in normalized and "/templates/admin/" not in normalized and "/templates/admin1/" not in normalized:
            return []
        return audit_html(path, content)

    if suffix == ".py" and ("admin.py" in normalized or "admin_" in normalized or "/admin/" in normalized):
        return audit_admin_python(path, content)

    return []


def audit_path(root: pathlib.Path) -> list[Finding]:
    findings: list[Finding] = []
    for file_path in iter_files(root):
        try:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        findings.extend(audit_file(file_path, content))
    return findings


def summarize(findings: list[Finding]) -> tuple[dict[str, int], dict[str, int]]:
    by_kind = Counter(item.kind for item in findings)
    by_file_counter = defaultdict(int)
    for item in findings:
        by_file_counter[item.path] += 1
    by_file = dict(sorted(by_file_counter.items(), key=lambda item: item[1], reverse=True))
    return dict(by_kind), by_file


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Audit hardcoded UI text that should be externalized for i18n. "
            "Covers frontend/landing JSX + django admin text patterns."
        )
    )
    parser.add_argument(
        "paths",
        nargs="+",
        help="Directories to scan (e.g. frontend backend landing).",
    )
    parser.add_argument(
        "--max-findings",
        type=int,
        default=600,
        help="Maximum findings to print in text mode.",
    )
    parser.add_argument(
        "--json",
        dest="as_json",
        action="store_true",
        help="Print full JSON report.",
    )
    args = parser.parse_args()

    all_findings: list[Finding] = []
    for raw_path in args.paths:
        path = pathlib.Path(raw_path).resolve()
        if not path.exists():
            print(f"[skip] path not found: {path}")
            continue
        all_findings.extend(audit_path(path))

    output_encoding = sys.stdout.encoding or "utf-8"

    def safe(value: str) -> str:
        return value.encode(output_encoding, errors="backslashreplace").decode(
            output_encoding, errors="ignore"
        )

    by_kind, by_file = summarize(all_findings)

    if args.as_json:
        payload = {
            "summary": {
                "total": len(all_findings),
                "by_kind": by_kind,
                "top_files": list(by_file.items())[:200],
            },
            "findings": [asdict(item) for item in all_findings],
        }
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        if not all_findings:
            print("No hardcoded UI text detected in scanned scope.")
            return 0

        print(f"Found {len(all_findings)} potential i18n findings.")
        if by_kind:
            print("By kind:")
            for kind, count in sorted(by_kind.items(), key=lambda item: item[1], reverse=True):
                print(safe(f"  - {kind}: {count}"))

        print("Top files:")
        for file_path, count in list(by_file.items())[:50]:
            print(safe(f"  - {file_path}: {count}"))

        print("Sample findings:")
        for item in all_findings[: args.max_findings]:
            print(safe(f"{item.path}:{item.line} [{item.kind}] {item.text}"))

        truncated = len(all_findings) - args.max_findings
        if truncated > 0:
            print(f"... truncated {truncated} additional findings")

    return 0 if len(all_findings) == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
