import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getEquipmentBySlug } from "@/lib/content";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function EquipmentDetailPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const item = await getEquipmentBySlug(slug);
  if (!item) notFound();
  const messages = await getTranslations("common");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/equipment" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← {messages("back")}
      </Link>
      <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h1 className="font-display text-3xl font-bold text-[var(--accent)]">
          {t(item.name, locale)}
        </h1>
        <p className="mt-1 text-[var(--muted)]">{t(item.category, locale)}</p>
        <p className="mt-4 text-sm">
          {[item.cost, item.weight].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-4 leading-relaxed">{t(item.description, locale)}</p>
      </article>
    </div>
  );
}
