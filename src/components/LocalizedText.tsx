import type { Locale } from "@/i18n/routing";
import type { LocalizedString } from "@/lib/types";
import { isMissingTranslation, t } from "@/lib/localized";
import { getTranslations } from "next-intl/server";

type Props = {
  value: LocalizedString | undefined | null;
  locale: Locale;
  className?: string;
  as?: "span" | "p" | "h1" | "h2" | "h3";
  showMissingBadge?: boolean;
};

export async function LocalizedText({
  value,
  locale,
  className,
  as: Tag = "span",
  showMissingBadge = true,
}: Props) {
  const text = t(value, locale);
  const missing = isMissingTranslation(value, locale);
  const messages = await getTranslations("common");

  return (
    <Tag className={className}>
      {text}
      {showMissingBadge && missing && text ? (
        <span className="ml-2 align-middle text-xs font-medium uppercase tracking-wide text-amber-700/90">
          ({messages("missingTranslation")})
        </span>
      ) : null}
    </Tag>
  );
}

/** Client-safe sync helper when you already have locale in a client component */
export function localizedSync(
  value: LocalizedString | undefined | null,
  locale: Locale,
): string {
  return t(value, locale);
}
