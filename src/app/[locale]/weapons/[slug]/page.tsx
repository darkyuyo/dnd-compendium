import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getWeaponBySlug } from "@/lib/content";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function WeaponDetailPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const weapon = await getWeaponBySlug(slug);
  if (!weapon) notFound();
  const messages = await getTranslations("common");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/weapons" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← {messages("back")}
      </Link>
      <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h1 className="font-display text-3xl font-bold text-[var(--accent)]">
          {t(weapon.name, locale)}
        </h1>
        <p className="mt-1 text-[var(--muted)]">{t(weapon.category, locale)}</p>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold">Damage</dt>
            <dd>
              {weapon.damage} {t(weapon.damageType, locale)}
            </dd>
          </div>
          {weapon.cost ? (
            <div>
              <dt className="font-semibold">Cost</dt>
              <dd>{weapon.cost}</dd>
            </div>
          ) : null}
          {weapon.weight ? (
            <div>
              <dt className="font-semibold">Weight</dt>
              <dd>{weapon.weight}</dd>
            </div>
          ) : null}
          {weapon.mastery ? (
            <div>
              <dt className="font-semibold">Mastery</dt>
              <dd>{t(weapon.mastery, locale)}</dd>
            </div>
          ) : null}
        </dl>
        {weapon.properties.length > 0 ? (
          <p className="mt-4 text-sm">
            <strong>Properties:</strong>{" "}
            {weapon.properties.map((p) => t(p, locale)).join(", ")}
          </p>
        ) : null}
        {weapon.description ? (
          <p className="mt-4 leading-relaxed">{t(weapon.description, locale)}</p>
        ) : null}
      </article>
    </div>
  );
}
