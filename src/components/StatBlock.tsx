import type { Locale } from "@/i18n/routing";
import type { Monster } from "@/lib/types";
import { t } from "@/lib/localized";
import { getTranslations } from "next-intl/server";

function mod(score: number): string {
  const m = Math.floor((score - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
}

type Props = {
  monster: Monster;
  locale: Locale;
};

export async function StatBlock({ monster, locale }: Props) {
  const m = await getTranslations("monsters");
  const scores = [
    ["STR", monster.abilityScores.str],
    ["DEX", monster.abilityScores.dex],
    ["CON", monster.abilityScores.con],
    ["INT", monster.abilityScores.int],
    ["WIS", monster.abilityScores.wis],
    ["CHA", monster.abilityScores.cha],
  ] as const;

  const sections: {
    key: string;
    title: string;
    items: Monster["traits"];
  }[] = [
    { key: "traits", title: m("traits"), items: monster.traits },
    { key: "actions", title: m("actions"), items: monster.actions },
    {
      key: "bonus",
      title: m("bonusActions"),
      items: monster.bonusActions,
    },
    { key: "reactions", title: m("reactions"), items: monster.reactions },
    {
      key: "legendary",
      title: m("legendaryActions"),
      items: monster.legendaryActions,
    },
  ];

  return (
    <article className="stat-block overflow-hidden rounded-xl border border-[var(--stat-border)] bg-[var(--stat-bg)] text-[var(--stat-fg)] shadow-lg">
      <header className="border-b-4 border-[var(--stat-rule)] px-5 py-4">
        <h1 className="font-display text-3xl font-bold text-[var(--stat-name)]">
          {t(monster.name, locale)}
        </h1>
        <p className="italic text-[var(--stat-muted)]">
          {t(monster.size, locale)} {t(monster.type, locale)},{" "}
          {t(monster.alignment, locale)}
        </p>
      </header>

      <div className="space-y-1 border-b border-[var(--stat-rule)] px-5 py-3 text-sm">
        <p>
          <strong className="text-[var(--stat-label)]">{m("armorClass")}</strong>{" "}
          {monster.armorClass}
        </p>
        <p>
          <strong className="text-[var(--stat-label)]">{m("hitPoints")}</strong>{" "}
          {monster.hitPoints}
        </p>
        <p>
          <strong className="text-[var(--stat-label)]">{m("speed")}</strong>{" "}
          {t(monster.speed, locale)}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 border-b border-[var(--stat-rule)] px-3 py-3 sm:grid-cols-6">
        {scores.map(([label, score]) => (
          <div key={label} className="text-center">
            <div className="text-xs font-bold text-[var(--stat-label)]">
              {label}
            </div>
            <div className="font-semibold">
              {score} ({mod(score)})
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1 border-b border-[var(--stat-rule)] px-5 py-3 text-sm">
        {monster.skills ? (
          <p>
            <strong className="text-[var(--stat-label)]">{m("skills")}</strong>{" "}
            {t(monster.skills, locale)}
          </p>
        ) : null}
        <p>
          <strong className="text-[var(--stat-label)]">{m("senses")}</strong>{" "}
          {t(monster.senses, locale)}
        </p>
        <p>
          <strong className="text-[var(--stat-label)]">{m("languages")}</strong>{" "}
          {t(monster.languages, locale)}
        </p>
        <p>
          <strong className="text-[var(--stat-label)]">CR</strong>{" "}
          {monster.challengeRating}
          {monster.proficiencyBonus
            ? ` (PB ${monster.proficiencyBonus})`
            : ""}
        </p>
      </div>

      <div className="space-y-4 px-5 py-4">
        {sections.map((section) =>
          section.items.length > 0 ? (
            <section key={section.key}>
              <h2 className="mb-2 border-b border-[var(--stat-rule)] font-display text-lg font-bold text-[var(--stat-name)]">
                {section.title}
              </h2>
              <ul className="space-y-3 text-sm">
                {section.items.map((item, i) => (
                  <li key={`${section.key}-${i}`}>
                    <strong>{t(item.name, locale)}.</strong>{" "}
                    {t(item.description, locale)}
                  </li>
                ))}
              </ul>
            </section>
          ) : null,
        )}
      </div>
    </article>
  );
}
