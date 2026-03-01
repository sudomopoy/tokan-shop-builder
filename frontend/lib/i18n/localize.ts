import { DEPLOY_LOCALE, type SupportedLocale } from "./deployment";

type Primitive = string | number | boolean | null;
type LocaleMap = Partial<Record<SupportedLocale, Primitive>>;

const LOCALE_FALLBACK_ORDER: SupportedLocale[] = ["fa", "en"];

function normalizeLocaleKey(key: string): SupportedLocale | null {
  const value = key.trim().toLowerCase();
  if (value === "fa" || value === "fa-ir") return "fa";
  if (value === "en" || value === "en-us") return "en";
  return null;
}

function isPrimitive(value: unknown): value is Primitive {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function isLocaleMapCandidate(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  if (entries.length === 0) return false;
  return entries.every(([k, v]) => normalizeLocaleKey(k) !== null && isPrimitive(v));
}

function pickFromLocaleMap(map: Record<string, unknown>, locale: SupportedLocale): Primitive | undefined {
  const normalized: LocaleMap = {};
  for (const [rawKey, rawValue] of Object.entries(map)) {
    const key = normalizeLocaleKey(rawKey);
    if (!key || !isPrimitive(rawValue)) continue;
    normalized[key] = rawValue;
  }

  if (normalized[locale] !== undefined) return normalized[locale];
  for (const fallback of LOCALE_FALLBACK_ORDER) {
    if (normalized[fallback] !== undefined) return normalized[fallback];
  }
  return undefined;
}

function extractWrappedLocaleMap(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const wrapped =
    (source.i18n as unknown) ??
    (source._i18n as unknown) ??
    (source.translations as unknown) ??
    null;
  if (!wrapped || typeof wrapped !== "object" || Array.isArray(wrapped)) return null;
  return wrapped as Record<string, unknown>;
}

export function localizeValue<T>(value: T, locale: SupportedLocale = DEPLOY_LOCALE): T {
  if (Array.isArray(value)) {
    return value.map((item) => localizeValue(item, locale)) as T;
  }

  if (!value || typeof value !== "object") return value;

  const wrappedMap = extractWrappedLocaleMap(value);
  if (wrappedMap && isLocaleMapCandidate(wrappedMap)) {
    const picked = pickFromLocaleMap(wrappedMap, locale);
    if (picked !== undefined) return picked as T;
  }

  if (isLocaleMapCandidate(value)) {
    const picked = pickFromLocaleMap(value, locale);
    if (picked !== undefined) return picked as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, node] of Object.entries(value as Record<string, unknown>)) {
    result[key] = localizeValue(node, locale);
  }
  return result as T;
}

export function localizedString(value: unknown, fallback = "", locale: SupportedLocale = DEPLOY_LOCALE): string {
  const resolved = localizeValue(value, locale);
  return typeof resolved === "string" ? resolved : fallback;
}

export function pickByLocale<T>(values: Record<SupportedLocale, T>, locale: SupportedLocale = DEPLOY_LOCALE): T {
  return values[locale] ?? values.fa ?? values.en;
}

