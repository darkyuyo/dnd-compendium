import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSpeciesBySlug } from "@/lib/content";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function SpeciesDetailPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const species = await getSpeciesBySlug(slug);
  if (!species) notFound();
  const messages = await getTranslations("common");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/species" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← {messages("back")}
      </Link>
      <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h1 className="font-display text-3xl font-bold text-[var(--accent)]">
          {t(species.name, locale)}
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          {t(species.creatureType, locale)} · {t(species.size, locale)} ·{" "}
          {t(species.speed, locale)}
        </p>
        <p className="mt-4 leading-relaxed">{t(species.description, locale)}</p>
        <ul className="mt-6 space-y-4">
          {species.traits.map((trait, i) => (
            <li key={i} className="border-t border-[var(--border)] pt-3">
              <p className="font-semibold">{t(trait.name, locale)}</p>
              <p className="mt-1 text-sm">{t(trait.description, locale)}</p>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
