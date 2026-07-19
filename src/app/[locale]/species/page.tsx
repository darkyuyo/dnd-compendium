import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSpecies } from "@/lib/content";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";
import { FilteredList } from "@/components/FilteredList";

type Props = { params: Promise<{ locale: string }> };

export default async function SpeciesPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const messages = await getTranslations();
  const species = await getSpecies();

  const items = species.map((s) => ({
    slug: s.slug,
    title: t(s.name, locale),
    subtitle: `${t(s.size, locale)} · ${t(s.speed, locale)}`,
    href: `/species/${s.slug}`,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-[var(--accent)]">
          {messages("species.title")}
        </h1>
        <p className="mt-2 text-[var(--muted)]">{messages("species.subtitle")}</p>
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
