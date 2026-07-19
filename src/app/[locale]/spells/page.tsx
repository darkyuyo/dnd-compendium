import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSpells } from "@/lib/content";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";
import { FilteredList } from "@/components/FilteredList";

type Props = { params: Promise<{ locale: string }> };

export default async function SpellsPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const messages = await getTranslations();
  const spells = await getSpells();

  const levels = [...new Set(spells.map((s) => s.level))].sort((a, b) => a - b);
  const schools = [
    ...new Map(
      spells.map((s) => [t(s.school, locale), t(s.school, locale)]),
    ).entries(),
  ].map(([value, label]) => ({ value, label }));

  const items = spells.map((spell) => ({
    slug: spell.slug,
    title: t(spell.name, locale),
    subtitle:
      spell.level === 0
        ? `${messages("common.cantrip")} · ${t(spell.school, locale)}`
        : `${messages("common.level")} ${spell.level} · ${t(spell.school, locale)}`,
    href: `/spells/${spell.slug}`,
    filterValues: {
      level: String(spell.level),
      school: t(spell.school, locale),
    },
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-[var(--accent)]">
          {messages("spells.title")}
        </h1>
        <p className="mt-2 text-[var(--muted)]">{messages("spells.subtitle")}</p>
      </header>
      <FilteredList
        items={items}
        searchPlaceholder={messages("common.search")}
        allLabel={messages("common.all")}
        noResults={messages("common.noResults")}
        filters={[
          {
            key: "level",
            label: messages("common.level"),
            options: levels.map((level) => ({
              value: String(level),
              label:
                level === 0
                  ? messages("common.cantrip")
                  : String(level),
            })),
          },
          {
            key: "school",
            label: messages("common.school"),
            options: schools,
          },
        ]}
      />
    </div>
  );
}
