import type { Locale } from "@/i18n/routing";
import type { LocalizedString } from "@/lib/types";

export function t(
  value: LocalizedString | undefined | null,
  locale: Locale,
): string {
  if (!value) return "";
  const preferred = value[locale]?.trim();
  if (preferred) return preferred;
  const fallback = locale === "es" ? value.en : value.es;
  return fallback?.trim() || "";
}

export function isMissingTranslation(
  value: LocalizedString | undefined | null,
  locale: Locale,
): boolean {
  if (!value) return true;
  return !value[locale]?.trim();
}
