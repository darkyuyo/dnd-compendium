import { NextResponse } from "next/server";
import {
  getArmor,
  getClasses,
  getEquipment,
  getFeats,
  getSpells,
  getWeapons,
  getBackgrounds,
  getSpecies,
} from "@/lib/content";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") || "spells";
  const locale = (searchParams.get("locale") || "es") as Locale;
  const q = (searchParams.get("q") || "").toLowerCase().trim();

  type Item = { slug: string; name: string; subtitle: string; href: string };

  let items: Item[] = [];

  if (kind === "spells") {
    items = (await getSpells()).map((s) => ({
      slug: s.slug,
      name: t(s.name, locale),
      subtitle: `Nivel ${s.level} · ${t(s.school, locale)}`,
      href: `/${locale}/spells/${s.slug}`,
    }));
  } else if (kind === "weapons") {
    items = (await getWeapons()).map((w) => ({
      slug: w.slug,
      name: t(w.name, locale),
      subtitle: `${w.damage} ${t(w.damageType, locale)}`,
      href: `/${locale}/weapons/${w.slug}`,
    }));
  } else if (kind === "armor") {
    items = (await getArmor()).map((a) => ({
      slug: a.slug,
      name: t(a.name, locale),
      subtitle: `${t(a.category, locale)} · CA ${a.armorClass}`,
      href: `/${locale}/armor/${a.slug}`,
    }));
  } else if (kind === "equipment") {
    items = (await getEquipment()).map((e) => ({
      slug: e.slug,
      name: t(e.name, locale),
      subtitle: t(e.category, locale),
      href: `/${locale}/equipment/${e.slug}`,
    }));
  } else if (kind === "feats") {
    items = (await getFeats()).map((f) => ({
      slug: f.slug,
      name: t(f.name, locale),
      subtitle: t(f.category, locale),
      href: `/${locale}/feats/${f.slug}`,
    }));
  } else if (kind === "classes") {
    items = (await getClasses()).map((c) => ({
      slug: c.slug,
      name: t(c.name, locale),
      subtitle: c.hitDie,
      href: `/${locale}/classes/${c.slug}`,
    }));
  } else if (kind === "species") {
    items = (await getSpecies()).map((s) => ({
      slug: s.slug,
      name: t(s.name, locale),
      subtitle: t(s.size, locale),
      href: `/${locale}/species/${s.slug}`,
    }));
  } else if (kind === "backgrounds") {
    items = (await getBackgrounds()).map((b) => ({
      slug: b.slug,
      name: t(b.name, locale),
      subtitle: t(b.feat, locale),
      href: `/${locale}/backgrounds/${b.slug}`,
    }));
  }

  if (q) {
    items = items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.subtitle.toLowerCase().includes(q),
    );
  }

  return NextResponse.json({ items: items.slice(0, 80) });
}
