import { getTranslations, setRequestLocale } from "next-intl/server";
import { getClasses } from "@/lib/content";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";
import { FilteredList } from "@/components/FilteredList";

type Props = { params: Promise<{ locale: string }> };

export default async function ClassesPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const messages = await getTranslations();
  const classes = await getClasses();

  const items = classes.map((c) => ({
    slug: c.slug,
    title: t(c.name, locale),
    subtitle: `${messages("classes.hitDie")} ${c.hitDie} · ${t(c.primaryAbility, locale)}`,
    href: `/classes/${c.slug}`,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-[var(--accent)]">
          {messages("classes.title")}
        </h1>
        <p className="mt-2 text-[var(--muted)]">{messages("classes.subtitle")}</p>
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
