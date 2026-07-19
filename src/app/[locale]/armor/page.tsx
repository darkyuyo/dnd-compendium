import { getTranslations, setRequestLocale } from "next-intl/server";
import { getArmor } from "@/lib/content";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";
import { FilteredList } from "@/components/FilteredList";

type Props = { params: Promise<{ locale: string }> };

export default async function ArmorPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const messages = await getTranslations();
  const armor = await getArmor();

  const items = armor.map((a) => ({
    slug: a.slug,
    title: t(a.name, locale),
    subtitle: `${t(a.category, locale)} · CA ${a.armorClass}`,
    href: `/armor/${a.slug}`,
    filterValues: { category: t(a.category, locale) },
  }));

  const categories = [
    ...new Map(
      armor.map((a) => [t(a.category, locale), t(a.category, locale)]),
    ).entries(),
  ].map(([value, label]) => ({ value, label }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-[var(--accent)]">
          Armaduras
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Armaduras y escudos del Manual del Jugador.
        </p>
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
