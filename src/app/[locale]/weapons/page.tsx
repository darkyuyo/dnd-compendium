import { getTranslations, setRequestLocale } from "next-intl/server";
import { getWeapons } from "@/lib/content";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";
import { FilteredList } from "@/components/FilteredList";

type Props = { params: Promise<{ locale: string }> };

export default async function WeaponsPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const messages = await getTranslations();
  const weapons = await getWeapons();

  const categories = [
    ...new Map(
      weapons.map((w) => [t(w.category, locale), t(w.category, locale)]),
    ).entries(),
  ].map(([value, label]) => ({ value, label }));

  const items = weapons.map((weapon) => ({
    slug: weapon.slug,
    title: t(weapon.name, locale),
    subtitle: `${weapon.damage} ${t(weapon.damageType, locale)} · ${t(weapon.category, locale)}`,
    href: `/weapons/${weapon.slug}`,
    filterValues: { category: t(weapon.category, locale) },
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-[var(--accent)]">
          {messages("weapons.title")}
        </h1>
        <p className="mt-2 text-[var(--muted)]">{messages("weapons.subtitle")}</p>
      </header>
      <FilteredList
        items={items}
        searchPlaceholder={messages("common.search")}
        allLabel={messages("common.all")}
        noResults={messages("common.noResults")}
        filters={[
          {
            key: "category",
            label: messages("common.category"),
            options: categories,
          },
        ]}
      />
    </div>
  );
}
