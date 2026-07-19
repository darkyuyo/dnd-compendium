import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getFeatBySlug } from "@/lib/content";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function FeatDetailPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const feat = await getFeatBySlug(slug);
  if (!feat) notFound();
  const messages = await getTranslations("common");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/feats" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← {messages("back")}
      </Link>
      <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h1 className="font-display text-3xl font-bold text-[var(--accent)]">
          {t(feat.name, locale)}
        </h1>
        <p className="mt-1 text-[var(--muted)]">{t(feat.category, locale)}</p>
        {feat.prerequisite ? (
          <p className="mt-2 text-sm">
            <strong>Prerequisite:</strong> {t(feat.prerequisite, locale)}
          </p>
        ) : null}
        <p className="mt-4 leading-relaxed">{t(feat.description, locale)}</p>
      </article>
    </div>
  );
}
