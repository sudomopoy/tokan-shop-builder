from __future__ import annotations

from typing import Any

from django.conf import settings
from django.utils import translation

SUPPORTED_LOCALES = {"fa", "en"}
FALLBACK_LOCALE = "fa"


def normalize_locale(raw: str | None) -> str:
    if not raw:
        return FALLBACK_LOCALE
    value = str(raw).strip().lower()
    if value.startswith("en"):
        return "en"
    if value.startswith("fa"):
        return "fa"
    return FALLBACK_LOCALE


def get_deploy_locale() -> str:
    configured = getattr(settings, "DEPLOY_LOCALE", None)
    current = translation.get_language()
    fallback = getattr(settings, "LANGUAGE_CODE", FALLBACK_LOCALE)
    locale = normalize_locale(configured or current or fallback)
    return locale if locale in SUPPORTED_LOCALES else FALLBACK_LOCALE


def get_deploy_direction(locale: str | None = None) -> str:
    resolved_locale = normalize_locale(locale or get_deploy_locale())
    explicit = str(getattr(settings, "DEPLOY_DIRECTION", "") or "").strip().lower()
    if explicit in {"rtl", "ltr"}:
        return explicit
    by_locale = getattr(settings, "DEPLOY_DIRECTION_BY_LOCALE", {}) or {}
    mapped = str(by_locale.get(resolved_locale, "rtl")).strip().lower()
    return mapped if mapped in {"rtl", "ltr"} else "rtl"


def _normalize_locale_key(key: str) -> str | None:
    value = str(key).strip().lower()
    if value in {"fa", "fa-ir"}:
        return "fa"
    if value in {"en", "en-us"}:
        return "en"
    return None


def _is_primitive(value: Any) -> bool:
    return value is None or isinstance(value, (str, int, float, bool))


def _is_locale_map_candidate(value: Any) -> bool:
    if not isinstance(value, dict) or not value:
        return False
    return all(_normalize_locale_key(k) is not None and _is_primitive(v) for k, v in value.items())


def _pick_from_locale_map(value: dict[str, Any], locale: str) -> Any:
    normalized: dict[str, Any] = {}
    for key, node in value.items():
        locale_key = _normalize_locale_key(key)
        if not locale_key or not _is_primitive(node):
            continue
        normalized[locale_key] = node

    if locale in normalized:
        return normalized[locale]
    for fallback in (FALLBACK_LOCALE, "en"):
        if fallback in normalized:
            return normalized[fallback]
    return None


def _extract_wrapped_locale_map(value: Any) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        return None
    wrapped = value.get("i18n") or value.get("_i18n") or value.get("translations")
    return wrapped if isinstance(wrapped, dict) else None


def localize_value(value: Any, locale: str | None = None) -> Any:
    resolved_locale = normalize_locale(locale or get_deploy_locale())

    if isinstance(value, list):
        return [localize_value(item, resolved_locale) for item in value]

    if not isinstance(value, dict):
        return value

    wrapped_map = _extract_wrapped_locale_map(value)
    if wrapped_map and _is_locale_map_candidate(wrapped_map):
        picked = _pick_from_locale_map(wrapped_map, resolved_locale)
        if picked is not None:
            return picked

    if _is_locale_map_candidate(value):
        picked = _pick_from_locale_map(value, resolved_locale)
        if picked is not None:
            return picked

    return {key: localize_value(node, resolved_locale) for key, node in value.items()}

