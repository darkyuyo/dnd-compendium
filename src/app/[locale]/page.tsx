import { getTranslations, setRequestLocale } from "next-intl/server";
import { SectionCard } from "@/components/SectionCard";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const sections = [
    {
      href: "/characters",
      title: t("nav.characters"),
      description:
        locale === "es"
          ? "Crea y edita hojas de personaje con foto y equipo del compendio."
          : "Create and edit character sheets with photo and compendium gear.",
    },
    { href: "/monsters", title: t("nav.monsters"), description: t("monsters.subtitle") },
    { href: "/spells", title: t("nav.spells"), description: t("spells.subtitle") },
    { href: "/classes", title: t("nav.classes"), description: t("classes.subtitle") },
    { href: "/species", title: t("nav.species"), description: t("species.subtitle") },
    { href: "/backgrounds", title: t("nav.backgrounds"), description: t("backgrounds.subtitle") },
    { href: "/feats", title: t("nav.feats"), description: t("feats.subtitle") },
    { href: "/weapons", title: t("nav.weapons"), description: t("weapons.subtitle") },
    { href: "/armor", title: t("nav.armor"), description: locale === "es" ? "Armaduras y escudos." : "Armor and shields." },
    { href: "/equipment", title: t("nav.equipment"), description: t("equipment.subtitle") },
    { href: "/how-to-play", title: t("nav.howToPlay"), description: t("guides.howToPlayTitle") },
    {
      href: "/character-creation",
      title: t("nav.characterCreation"),
      description: t("guides.characterCreationTitle"),
    },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          {t("meta.title")}
        </p>
        <h1 className="font-display text-4xl font-bold text-[var(--accent)] sm:text-5xl">
          {t("home.title")}
        </h1>
        <p className="max-w-2xl text-lg text-[var(--muted)]">{t("home.subtitle")}</p>
      </header>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">
          {t("home.sections")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <SectionCard key={s.href} {...s} />
          ))}
        </div>
      </section>
    </div>
  );
}
