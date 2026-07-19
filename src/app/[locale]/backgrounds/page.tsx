import { getTranslations, setRequestLocale } from "next-intl/server";
import { getBackgrounds } from "@/lib/content";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";
import { FilteredList } from "@/components/FilteredList";

type Props = { params: Promise<{ locale: string }> };

export default async function BackgroundsPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const messages = await getTranslations();
  const backgrounds = await getBackgrounds();

  const items = backgrounds.map((b) => ({
    slug: b.slug,
    title: t(b.name, locale),
    subtitle: t(b.feat, locale),
    href: `/backgrounds/${b.slug}`,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-[var(--accent)]">
          {messages("backgrounds.title")}
        </h1>
        <p className="mt-2 text-[var(--muted)]">{messages("backgrounds.subtitle")}</p>
      </header>
      <FilteredList
        items={items}
        searchPlaceholder={messages("common.search")}
        allLabel={messages("common.all")}
        noResults={messages("common.noResults")}
      />
    </div>
  );
}
