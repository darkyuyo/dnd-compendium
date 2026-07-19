import { getTranslations, setRequestLocale } from "next-intl/server";
import { getEquipment } from "@/lib/content";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";
import { FilteredList } from "@/components/FilteredList";

type Props = { params: Promise<{ locale: string }> };

export default async function EquipmentPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const messages = await getTranslations();
  const equipment = await getEquipment();

  const items = equipment.map((item) => ({
    slug: item.slug,
    title: t(item.name, locale),
    subtitle: `${t(item.category, locale)}${item.cost ? ` · ${item.cost}` : ""}`,
    href: `/equipment/${item.slug}`,
    filterValues: { category: t(item.category, locale) },
  }));

  const categories = [
    ...new Map(
      equipment.map((e) => [t(e.category, locale), t(e.category, locale)]),
    ).entries(),
  ].map(([value, label]) => ({ value, label }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-[var(--accent)]">
          {messages("equipment.title")}
        </h1>
        <p className="mt-2 text-[var(--muted)]">{messages("equipment.subtitle")}</p>
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
