import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getClassBySlug } from "@/lib/content";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function ClassDetailPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const charClass = await getClassBySlug(slug);
  if (!charClass) notFound();
  const messages = await getTranslations();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/classes" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← {messages("common.back")}
      </Link>
      <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h1 className="font-display text-3xl font-bold text-[var(--accent)]">
          {t(charClass.name, locale)}
        </h1>
        <p className="mt-3 leading-relaxed">{t(charClass.description, locale)}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-[var(--accent)]">
              {messages("classes.hitDie")}
            </dt>
            <dd>{charClass.hitDie}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--accent)]">
              {messages("classes.primaryAbility")}
            </dt>
            <dd>{t(charClass.primaryAbility, locale)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--accent)]">
              {messages("classes.savingThrows")}
            </dt>
            <dd>{t(charClass.savingThrows, locale)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--accent)]">Armor</dt>
            <dd>{t(charClass.armor, locale)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold text-[var(--accent)]">Weapons</dt>
            <dd>{t(charClass.weapons, locale)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold text-[var(--accent)]">Skills</dt>
            <dd>{t(charClass.skills, locale)}</dd>
          </div>
        </dl>

        <h2 className="mt-8 font-display text-xl font-bold text-[var(--accent)]">
          {messages("classes.features")}
        </h2>
        <ul className="mt-3 space-y-4">
          {charClass.features.map((feature, i) => (
            <li key={i} className="border-t border-[var(--border)] pt-3">
              <p className="font-semibold">
                {messages("common.level")} {feature.level}: {t(feature.name, locale)}
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                {t(feature.description, locale)}
              </p>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
