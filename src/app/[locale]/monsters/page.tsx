import { getTranslations, setRequestLocale } from "next-intl/server";
import { getMonsters } from "@/lib/content";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";
import { FilteredList } from "@/components/FilteredList";

type Props = { params: Promise<{ locale: string }> };

export default async function MonstersPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const messages = await getTranslations();
  const monsters = await getMonsters();

  const types = [
    ...new Map(
      monsters.map((m) => {
        const typeName = t(m.type, locale).split(" ")[0] || t(m.type, locale);
        return [typeName, typeName];
      }),
    ).entries(),
  ].map(([value, label]) => ({ value, label }));

  const items = monsters.map((monster) => ({
    slug: monster.slug,
    title: t(monster.name, locale),
    subtitle: `CR ${monster.challengeRating} · ${t(monster.type, locale)}`,
    href: `/monsters/${monster.slug}`,
    filterValues: {
      type: t(monster.type, locale).split(" ")[0] || t(monster.type, locale),
    },
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-[var(--accent)]">
          {messages("monsters.title")}
        </h1>
        <p className="mt-2 text-[var(--muted)]">{messages("monsters.subtitle")}</p>
      </header>
      <FilteredList
        items={items}
        searchPlaceholder={messages("common.search")}
        allLabel={messages("common.all")}
        noResults={messages("common.noResults")}
        filters={[
          {
            key: "type",
            label: messages("common.type"),
            options: types,
          },
        ]}
      />
    </div>
  );
}
