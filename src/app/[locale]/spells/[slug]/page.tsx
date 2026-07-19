import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSpellBySlug } from "@/lib/content";
import { t, isMissingTranslation } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function SpellDetailPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const spell = await getSpellBySlug(slug);
  if (!spell) notFound();

  const messages = await getTranslations();
  const missing = isMissingTranslation(spell.description, locale);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/spells"
        className="text-sm text-[var(--muted)] hover:text-[var(--accent)]"
      >
        ← {messages("common.back")}
      </Link>

      <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h1 className="font-display text-3xl font-bold text-[var(--accent)]">
          {t(spell.name, locale)}
          {missing ? (
            <span className="ml-2 text-sm font-sans font-medium uppercase text-amber-700">
              ({messages("common.missingTranslation")})
            </span>
          ) : null}
        </h1>
        <p className="mt-1 italic text-[var(--muted)]">
          {spell.level === 0
            ? `${messages("common.cantrip")} · ${t(spell.school, locale)}`
            : `${messages("common.level")} ${spell.level} · ${t(spell.school, locale)}`}
        </p>

        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-[var(--accent)]">
              Casting / Lanzamiento
            </dt>
            <dd>{t(spell.castingTime, locale)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--accent)]">Range / Alcance</dt>
            <dd>{t(spell.range, locale)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--accent)]">Components</dt>
            <dd>{spell.components}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--accent)]">Duration</dt>
            <dd>{t(spell.duration, locale)}</dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-[var(--border)] pt-4 leading-relaxed">
          {t(spell.description, locale)}
        </div>

        <p className="mt-4 text-xs text-[var(--muted)]">
          {messages("common.source")}: {spell.source} · {spell.classes.join(", ")}
        </p>
      </article>
    </div>
  );
}
