#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
import time
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import requests

import i18n_audit


ROOT = Path(__file__).resolve().parent.parent
FRONTEND_ROOTS = [ROOT / "frontend" / "app", ROOT / "frontend" / "components", ROOT / "frontend" / "themes"]
LANDING_ROOTS = [ROOT / "landing" / "src"]
SCAN_ROOTS = FRONTEND_ROOTS + LANDING_ROOTS

TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single"
TRANSLATE_HEADERS = {
    "User-Agent": "Mozilla/5.0",
}

CACHE_PATH = ROOT / "tools" / "i18n_translate_cache.json"
REPORT_PATH = ROOT / "tools" / "i18n_auto_migrate_report.json"

FRONTEND_IMPORT = 'import { tFrontendAuto } from "@/lib/i18n/autoMessages";'
LANDING_IMPORT = 'import { tLandingAuto } from "@/lib/autoMessages";'

JS_UI_ATTRS = "title|label|placeholder|aria-label|alt|description|helperText|tooltip|caption|heading"
JS_CALLS = "alert|confirm|prompt|setError|setSuccess|setWarning|setInfo|toast\\.(?:success|error|info|warning)"

PERSIAN_RE = re.compile(r"[\u0600-\u06FF]")
PLACEHOLDER_RE = re.compile(r"\$\{([^}]+)\}")
CODE_LIKE_TOKENS = (
    "className=",
    "=>",
    "import(",
    "const ",
    "function ",
    "return ",
    "await ",
    " if ",
    "for (",
    "map(",
    "setState",
    "useState",
    "useEffect",
)


@dataclass
class Replacement:
    line_no: int
    kind: str
    original_text: str
    normalized_text: str
    key: str
    scope: str


def is_frontend_path(path: Path) -> bool:
    normalized = path.as_posix().lower()
    return "/frontend/" in normalized


def is_landing_path(path: Path) -> bool:
    normalized = path.as_posix().lower()
    return "/landing/src/" in normalized


def normalize_template_text(text: str) -> tuple[str, dict[str, str]]:
    exprs: dict[str, str] = {}
    counter = 0

    def repl(match: re.Match[str]) -> str:
        nonlocal counter
        counter += 1
        token = f"p{counter}"
        exprs[token] = match.group(1).strip()
        return "{" + token + "}"

    normalized = PLACEHOLDER_RE.sub(repl, text)
    return normalized, exprs


def make_key(scope: str, text: str) -> str:
    digest = hashlib.sha1(f"{scope}|{text}".encode("utf-8")).hexdigest()[:12]
    prefix = "fe" if scope == "frontend" else "ld"
    return f"{prefix}.{digest}"


def is_probable_translatable_text(text: str) -> bool:
    value = text.strip()
    if not value:
        return False

    has_persian = bool(PERSIAN_RE.search(value))
    if not has_persian:
        if len(value) > 160:
            return False
        if any(token in value for token in CODE_LIKE_TOKENS):
            return False
        if any(ch in value for ch in "{};<>"):
            return False
        if value.count(" ") > 14:
            return False
    return True


def load_cache() -> dict[str, str]:
    if not CACHE_PATH.exists():
        return {}
    try:
        return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_cache(cache: dict[str, str]) -> None:
    CACHE_PATH.write_text(
        json.dumps(cache, ensure_ascii=False, indent=2, sort_keys=True),
        encoding="utf-8",
    )


def translate_google(
    session: requests.Session,
    text: str,
    source: str,
    target: str,
    cache: dict[str, str],
) -> str:
    cache_key = f"{source}|{target}|{text}"
    if cache_key in cache:
        return cache[cache_key]

    params = {
        "client": "gtx",
        "sl": source,
        "tl": target,
        "dt": "t",
        "q": text,
    }
    translated = text
    try:
        response = session.get(
            TRANSLATE_URL,
            params=params,
            headers=TRANSLATE_HEADERS,
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        chunks = payload[0] if isinstance(payload, list) and payload else []
        parts: list[str] = []
        for chunk in chunks:
            if isinstance(chunk, list) and chunk and isinstance(chunk[0], str):
                parts.append(chunk[0])
        joined = "".join(parts).strip()
        if joined:
            translated = joined
    except Exception:
        translated = text

    cache[cache_key] = translated
    return translated


def build_messages(
    unique_texts: set[tuple[str, str]],
) -> tuple[dict[str, dict[str, str]], dict[str, dict[str, str]]]:
    frontend_messages: dict[str, dict[str, str]] = {}
    landing_messages: dict[str, dict[str, str]] = {}

    cache = load_cache()
    session = requests.Session()

    sorted_items = sorted(unique_texts, key=lambda item: (item[0], item[1]))
    for idx, (scope, text) in enumerate(sorted_items, start=1):
        key = make_key(scope, text)
        has_persian = bool(PERSIAN_RE.search(text))

        if has_persian:
            fa_value = text
            en_value = translate_google(session, text, "fa", "en", cache)
        else:
            en_value = text
            fa_value = translate_google(session, text, "en", "fa", cache)

        record = {"fa": fa_value, "en": en_value}
        if scope == "frontend":
            frontend_messages[key] = record
        else:
            landing_messages[key] = record

        if idx % 50 == 0:
            save_cache(cache)
            time.sleep(0.05)

    save_cache(cache)
    return frontend_messages, landing_messages


def insert_import(content: str, import_line: str) -> str:
    if import_line in content:
        return content
    lines = content.splitlines()
    insert_at = 0
    for idx, line in enumerate(lines):
        if line.startswith("import "):
            insert_at = idx + 1
    lines.insert(insert_at, import_line)
    return "\n".join(lines) + ("\n" if content.endswith("\n") else "")


def apply_replacement_to_line(
    line: str,
    replacement: Replacement,
) -> tuple[str, bool]:
    func = "tFrontendAuto" if replacement.scope == "frontend" else "tLandingAuto"
    key_literal = f'"{replacement.key}"'

    if replacement.kind == "jsx_text":
        escaped = re.escape(replacement.original_text)
        pattern = re.compile(rf">(\s*){escaped}(\s*)<")
        new_line, count = pattern.subn(f">{{{func}({key_literal})}}<", line, count=1)
        if count > 0:
            return new_line, True
        if replacement.original_text in line:
            return line.replace(
                replacement.original_text,
                f"{{{func}({key_literal})}}",
                1,
            ), True
        return line, False

    if replacement.kind == "ui_prop_string":
        escaped = re.escape(replacement.original_text)
        pattern = re.compile(
            rf"(\b(?:{JS_UI_ATTRS})\s*=\s*)(['\"`]){escaped}\2"
        )
        new_line, count = pattern.subn(rf'\1{{{func}({key_literal})}}', line, count=1)
        return new_line, count > 0

    if replacement.kind == "ui_call_string":
        call_pattern = re.compile(
            rf"(\b(?:{JS_CALLS})\s*\(\s*)(['\"`])(.+?)\2"
        )
        for match in call_pattern.finditer(line):
            quote = match.group(2)
            current_text = match.group(3)
            if current_text != replacement.original_text:
                continue

            if quote != "`":
                start, end = match.span()
                prefix = match.group(1)
                new_call = f"{prefix}{func}({key_literal})"
                return line[:start] + new_call + line[end:], True

            normalized, exprs = normalize_template_text(current_text)
            args = [key_literal]
            if exprs:
                vars_literal = ", ".join(f"{name}: {expr}" for name, expr in exprs.items())
                args.append(f"{{ {vars_literal} }}")
            start, end = match.span()
            prefix = match.group(1)
            new_call = f"{prefix}{func}({', '.join(args)})"
            return line[:start] + new_call + line[end:], True

        return line, False

    return line, False


def write_frontend_auto_messages(messages: dict[str, dict[str, str]]) -> None:
    target = ROOT / "frontend" / "lib" / "i18n" / "autoMessages.ts"
    body = json.dumps(messages, ensure_ascii=False, indent=2, sort_keys=True)
    content = (
        'import { pickByLocale } from "./localize";\n'
        'import type { SupportedLocale } from "./deployment";\n\n'
        "type MessageMap = Record<SupportedLocale, string>;\n\n"
        f"const AUTO_MESSAGES: Record<string, MessageMap> = {body};\n\n"
        "function interpolate(template: string, vars?: Record<string, string | number>): string {\n"
        "  if (!vars) return template;\n"
        "  return template.replace(/\\{([a-zA-Z0-9_]+)\\}/g, (_, token: string) => {\n"
        "    const value = vars[token];\n"
        "    return value === undefined ? `{${token}}` : String(value);\n"
        "  });\n"
        "}\n\n"
        "export function tFrontendAuto(key: string, vars?: Record<string, string | number>): string {\n"
        "  const record = AUTO_MESSAGES[key];\n"
        "  if (!record) return key;\n"
        "  return interpolate(pickByLocale(record), vars);\n"
        "}\n"
    )
    target.write_text(content, encoding="utf-8")


def write_landing_auto_messages(messages: dict[str, dict[str, str]]) -> None:
    target = ROOT / "landing" / "src" / "lib" / "autoMessages.ts"
    body = json.dumps(messages, ensure_ascii=False, indent=2, sort_keys=True)
    content = (
        'import { pickByLocale } from "./i18n";\n'
        'import type { SupportedLocale } from "./i18n";\n\n'
        "type MessageMap = Record<SupportedLocale, string>;\n\n"
        f"const AUTO_MESSAGES: Record<string, MessageMap> = {body};\n\n"
        "function interpolate(template: string, vars?: Record<string, string | number>): string {\n"
        "  if (!vars) return template;\n"
        "  return template.replace(/\\{([a-zA-Z0-9_]+)\\}/g, (_, token: string) => {\n"
        "    const value = vars[token];\n"
        "    return value === undefined ? `{${token}}` : String(value);\n"
        "  });\n"
        "}\n\n"
        "export function tLandingAuto(key: string, vars?: Record<string, string | number>): string {\n"
        "  const record = AUTO_MESSAGES[key];\n"
        "  if (!record) return key;\n"
        "  return interpolate(pickByLocale(record), vars);\n"
        "}\n"
    )
    target.write_text(content, encoding="utf-8")


def main() -> int:
    findings = []
    for root in SCAN_ROOTS:
        if root.exists():
            findings.extend(i18n_audit.audit_path(root))

    replacements_by_file: dict[Path, list[Replacement]] = defaultdict(list)
    unique_texts: set[tuple[str, str]] = set()

    for finding in findings:
        path = Path(finding.path)
        scope = "frontend" if is_frontend_path(path) else "landing"
        if finding.kind not in {"jsx_text", "ui_prop_string", "ui_call_string"}:
            continue

        if not is_probable_translatable_text(finding.text):
            continue

        normalized_text = finding.text
        if finding.kind == "ui_call_string" and "${" in finding.text:
            normalized_text, _ = normalize_template_text(finding.text)

        key = make_key(scope, normalized_text)
        unique_texts.add((scope, normalized_text))
        replacements_by_file[path].append(
            Replacement(
                line_no=finding.line,
                kind=finding.kind,
                original_text=finding.text,
                normalized_text=normalized_text,
                key=key,
                scope=scope,
            )
        )

    frontend_messages, landing_messages = build_messages(unique_texts)
    write_frontend_auto_messages(frontend_messages)
    write_landing_auto_messages(landing_messages)

    changed_files: list[str] = []
    failed_replacements: list[dict[str, Any]] = []

    for path, items in replacements_by_file.items():
        if not path.exists():
            continue

        content = path.read_text(encoding="utf-8")
        lines = content.splitlines()
        file_changed = False

        for item in sorted(items, key=lambda x: x.line_no, reverse=True):
            idx = item.line_no - 1
            if idx < 0 or idx >= len(lines):
                failed_replacements.append(
                    {
                        "path": path.as_posix(),
                        "line": item.line_no,
                        "kind": item.kind,
                        "text": item.original_text,
                        "reason": "line_out_of_range",
                    }
                )
                continue

            original_line = lines[idx]
            new_line, replaced = apply_replacement_to_line(original_line, item)
            if replaced:
                lines[idx] = new_line
                file_changed = True
            else:
                failed_replacements.append(
                    {
                        "path": path.as_posix(),
                        "line": item.line_no,
                        "kind": item.kind,
                        "text": item.original_text,
                        "reason": "pattern_not_matched",
                    }
                )

        if not file_changed:
            continue

        new_content = "\n".join(lines)
        if content.endswith("\n"):
            new_content += "\n"

        if is_frontend_path(path):
            new_content = insert_import(new_content, FRONTEND_IMPORT)
        elif is_landing_path(path):
            new_content = insert_import(new_content, LANDING_IMPORT)

        path.write_text(new_content, encoding="utf-8")
        changed_files.append(path.as_posix())

    report = {
        "initial_findings": len(findings),
        "targeted_findings": sum(len(items) for items in replacements_by_file.values()),
        "changed_files": changed_files,
        "changed_files_count": len(changed_files),
        "failed_replacements_count": len(failed_replacements),
        "failed_replacements": failed_replacements[:5000],
        "frontend_auto_messages": len(frontend_messages),
        "landing_auto_messages": len(landing_messages),
    }
    REPORT_PATH.write_text(
        json.dumps(report, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
