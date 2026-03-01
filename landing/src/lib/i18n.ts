export type SupportedLocale = "fa" | "en";
export type SupportedDirection = "rtl" | "ltr";

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
  if (value === "rtl" || value === "ltr") return value;
  return null;
}

export const DEPLOY_LOCALE: SupportedLocale = normalizeLocale(process.env.NEXT_PUBLIC_APP_LOCALE);
export const DEPLOY_DIRECTION: SupportedDirection =
  normalizeDirection(process.env.NEXT_PUBLIC_APP_DIRECTION) ?? DEFAULT_DIRECTION_BY_LOCALE[DEPLOY_LOCALE];
export const DEPLOY_LANG = DEPLOY_LOCALE;
export const DEPLOY_OG_LOCALE = DEPLOY_LOCALE === "fa" ? "fa_IR" : "en_US";

export function pickByLocale<T>(values: Record<SupportedLocale, T>): T {
  return values[DEPLOY_LOCALE] ?? values.fa ?? values.en;
}

