import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getArmorBySlug } from "@/lib/content";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function ArmorDetailPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const item = await getArmorBySlug(slug);
  if (!item) notFound();
  const messages = await getTranslations("common");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/armor" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← {messages("back")}
      </Link>
      <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h1 className="font-display text-3xl font-bold text-[var(--accent)]">
          {t(item.name, locale)}
        </h1>
        <p className="mt-1 text-[var(--muted)]">{t(item.category, locale)}</p>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold">CA</dt>
            <dd>{item.armorClass}</dd>
          </div>
          {item.strength ? (
            <div>
              <dt className="font-semibold">Fuerza</dt>
              <dd>{item.strength}</dd>
            </div>
          ) : null}
          {item.stealth ? (
            <div>
              <dt className="font-semibold">Sigilo</dt>
              <dd>{t(item.stealth, locale)}</dd>
            </div>
          ) : null}
          {item.cost ? (
            <div>
              <dt className="font-semibold">Coste</dt>
              <dd>{item.cost}</dd>
            </div>
          ) : null}
          {item.weight ? (
            <div>
              <dt className="font-semibold">Peso</dt>
              <dd>{item.weight}</dd>
            </div>
          ) : null}
        </dl>
        <p className="mt-4 leading-relaxed">{t(item.description, locale)}</p>
      </article>
    </div>
  );
}
