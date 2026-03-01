export type SupportedLocale = "fa" | "en";
export type SupportedDirection = "rtl" | "ltr";

const SUPPORTED_LOCALES = new Set<SupportedLocale>(["fa", "en"]);
const SUPPORTED_DIRECTIONS = new Set<SupportedDirection>(["rtl", "ltr"]);

const DEFAULT_LOCALE: SupportedLocale = "fa";
const DEFAULT_DIRECTION_BY_LOCALE: Record<SupportedLocale, SupportedDirection> = {
  fa: "rtl",
  // Requirement: English deployment must also be RTL.
  en: "rtl",
};

function normalizeLocale(raw: string | undefined | null): SupportedLocale {
  if (!raw) return DEFAULT_LOCALE;
  const value = raw.trim().toLowerCase();
  if (value.startsWith("en")) return "en";
  if (value.startsWith("fa")) return "fa";
  return DEFAULT_LOCALE;
}

function normalizeDirection(raw: string | undefined | null): SupportedDirection | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  return SUPPORTED_DIRECTIONS.has(value as SupportedDirection)
    ? (value as SupportedDirection)
    : null;
}

const locale = normalizeLocale(process.env.NEXT_PUBLIC_APP_LOCALE);
const explicitDirection = normalizeDirection(process.env.NEXT_PUBLIC_APP_DIRECTION);

export const DEPLOY_LOCALE: SupportedLocale = SUPPORTED_LOCALES.has(locale)
  ? locale
  : DEFAULT_LOCALE;
export const DEPLOY_DIRECTION: SupportedDirection =
  explicitDirection ?? DEFAULT_DIRECTION_BY_LOCALE[DEPLOY_LOCALE];
export const DEPLOY_IS_RTL = DEPLOY_DIRECTION === "rtl";
export const DEPLOY_LANG = DEPLOY_LOCALE;
export const DEPLOY_OG_LOCALE = DEPLOY_LOCALE === "fa" ? "fa_IR" : "en_US";

