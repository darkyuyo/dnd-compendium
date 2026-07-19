import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getBackgroundBySlug } from "@/lib/content";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function BackgroundDetailPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const background = await getBackgroundBySlug(slug);
  if (!background) notFound();
  const messages = await getTranslations("common");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/backgrounds" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← {messages("back")}
      </Link>
      <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h1 className="font-display text-3xl font-bold text-[var(--accent)]">
          {t(background.name, locale)}
        </h1>
        <p className="mt-4 leading-relaxed">{t(background.description, locale)}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-[var(--accent)]">Ability Scores</dt>
            <dd>{t(background.abilityScores, locale)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--accent)]">Feat</dt>
            <dd>{t(background.feat, locale)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--accent)]">Skills</dt>
            <dd>{t(background.skillProficiencies, locale)}</dd>
          </div>
          {background.toolProficiencies ? (
            <div>
              <dt className="font-semibold text-[var(--accent)]">Tools</dt>
              <dd>{t(background.toolProficiencies, locale)}</dd>
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <dt className="font-semibold text-[var(--accent)]">Equipment</dt>
            <dd>{t(background.equipment, locale)}</dd>
          </div>
        </dl>
      </article>
    </div>
  );
}
