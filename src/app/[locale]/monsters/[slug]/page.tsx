import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getMonsterBySlug } from "@/lib/content";
import { StatBlock } from "@/components/StatBlock";
import type { Locale } from "@/i18n/routing";
import { t } from "@/lib/localized";

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function MonsterDetailPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const monster = await getMonsterBySlug(slug);
  if (!monster) notFound();

  const messages = await getTranslations("common");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/monsters"
        className="text-sm text-[var(--muted)] hover:text-[var(--accent)]"
      >
        ← {messages("back")}
      </Link>
      <StatBlock monster={monster} locale={locale} />
      {monster.description ? (
        <p className="text-[var(--muted)]">{t(monster.description, locale)}</p>
      ) : null}
    </div>
  );
}
