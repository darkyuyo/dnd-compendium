import { getTranslations, setRequestLocale } from "next-intl/server";
import { getGuideMarkdown } from "@/lib/content";
import { GuideContent } from "@/components/GuideContent";
import type { Locale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export default async function HowToPlayPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const messages = await getTranslations("guides");
  const markdown = await getGuideMarkdown("how-to-play", locale);

  return (
    <div className="mx-auto max-w-3xl space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <p className="sr-only">{messages("howToPlayTitle")}</p>
      <GuideContent markdown={markdown} />
    </div>
  );
}
