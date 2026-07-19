import { getTranslations, setRequestLocale } from "next-intl/server";
import { getFeats } from "@/lib/content";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";
import { FilteredList } from "@/components/FilteredList";

type Props = { params: Promise<{ locale: string }> };

export default async function FeatsPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const messages = await getTranslations();
  const feats = await getFeats();

  const categories = [
    ...new Map(
      feats.map((f) => [t(f.category, locale), t(f.category, locale)]),
    ).entries(),
  ].map(([value, label]) => ({ value, label }));

  const items = feats.map((feat) => ({
    slug: feat.slug,
    title: t(feat.name, locale),
    subtitle: t(feat.category, locale),
    href: `/feats/${feat.slug}`,
    filterValues: { category: t(feat.category, locale) },
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-[var(--accent)]">
          {messages("feats.title")}
        </h1>
        <p className="mt-2 text-[var(--muted)]">{messages("feats.subtitle")}</p>
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
