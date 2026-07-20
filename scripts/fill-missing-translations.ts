/**
 * Fill empty es/en fields in content/ using bilingual glossaries.
 *
 * - PHB content: fills English from Spanish via name maps + field glossaries
 * - Monsters: fills Spanish from English via aidedd name map + field glossaries
 *
 * Note: the Spanish Monster Manual PDF has no text layer (scan-only), so
 * monster Spanish comes from public name glossaries + structural translation,
 * not from OCR of that PDF. Long descriptions stay on the language that
 * already exists (UI falls back with "Sin traducir").
 *
 * Usage: npx tsx scripts/fill-missing-translations.ts
 */
import { promises as fs } from "fs";
import path from "path";

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, "content");
const STAGING = path.join(ROOT, "staging");

type Loc = { es: string; en: string };

function norm(s: string): string {
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function fixOcrName(s: string): string {
  return s
    .replace(/\bA11osaurus\b/gi, "Allosaurus")
    .replace(/\b8room\b/gi, "Broom")
    .replace(/\b8eet1e\b/gi, "Beetle")
    .replace(/\b8ear\b/gi, "Bear")
    .replace(/\b8oar\b/gi, "Boar")
    .replace(/\b4spirant\b/gi, "Aspirant")
    .replace(/\b4co1yte\b/gi, "Acolyte")
    .replace(/\bDoppe19an9er\b/gi, "Doppelganger")
    .replace(/\bLi2ard\b/gi, "Lizard")
    .replace(/\bMe22o1oth\b/gi, "Mezzoloth")
    .replace(/\bOwI\b/g, "Owl")
    .replace(/\bOwIbear\b/gi, "Owlbear")
    .replace(/\bGre\b$/i, "Grell")
    .replace(/1/g, "l")
    .replace(/8/g, "B")
    .replace(/9/g, "g")
    .replace(/2(?=[a-z])/gi, "z")
    .replace(/\s+/g, " ")
    .trim();
}

function fillLoc(loc: Loc | undefined, lang: "es" | "en", value: string): Loc {
  const base: Loc = loc ? { es: loc.es || "", en: loc.en || "" } : { es: "", en: "" };
  if (!value) return base;
  if (!base[lang]) base[lang] = value;
  return base;
}

function translateByMap(text: string, map: Record<string, string>): string {
  if (!text) return text;
  let out = text;
  // Longer keys first
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    const re = new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    out = out.replace(re, map[k]);
  }
  return out;
}

const SCHOOL_ES_EN: Record<string, string> = {
  abjuración: "Abjuration",
  abjuracion: "Abjuration",
  adivinación: "Divination",
  adivinacion: "Divination",
  conjuración: "Conjuration",
  conjuracion: "Conjuration",
  encantamiento: "Enchantment",
  evocación: "Evocation",
  evocacion: "Evocation",
  ilusionismo: "Illusion",
  ilusión: "Illusion",
  ilusion: "Illusion",
  nigromancia: "Necromancy",
  transmutación: "Transmutation",
  transmutacion: "Transmutation",
};

const CAST_ES_EN: Record<string, string> = {
  Acción: "Action",
  Accion: "Action",
  "Acción adicional": "Bonus Action",
  "Acción bonus": "Bonus Action",
  Reacción: "Reaction",
  Reaccion: "Reaction",
  Instantáneo: "Instantaneous",
  Instantaneo: "Instantaneous",
  "1 minuto": "1 minute",
  "10 minutos": "10 minutes",
  "1 hora": "1 hour",
  "8 horas": "8 hours",
  "24 horas": "24 hours",
  "1 round": "1 round",
  "1 asalto": "1 round",
  "Acción o ritual": "Action or Ritual",
  "Acción o un ritual": "Action or Ritual",
  "1 minuto o un ritual": "1 minute or Ritual",
  Concentración: "Concentration",
  Disipado: "Until dispelled",
  Lanzador: "Self",
  Toque: "Touch",
  Personal: "Self",
};

const RANGE_ES_EN: Record<string, string> = {
  ...CAST_ES_EN,
  "3 m": "10 feet",
  "1,50 m": "5 feet",
  "1,5 m": "5 feet",
  "9 m": "30 feet",
  "18 m": "60 feet",
  "27 m": "90 feet",
  "36 m": "120 feet",
  "45 m": "150 feet",
  "90 m": "300 feet",
  "1,5 km": "1 mile",
  "Vista": "Sight",
  Ilimitado: "Unlimited",
};

const DURATION_ES_EN: Record<string, string> = {
  ...CAST_ES_EN,
  "hasta 1 minuto": "up to 1 minute",
  "hasta 10 minutos": "up to 10 minutes",
  "hasta 1 hora": "up to 1 hour",
  "10 días": "10 days",
  "7 días": "7 days",
  "30 días": "30 days",
  Permanente: "Permanent",
  Especial: "Special",
};

const SIZE_EN_ES: Record<string, string> = {
  Tiny: "Diminuto",
  Small: "Pequeño",
  Medium: "Mediano",
  Large: "Grande",
  Huge: "Enorme",
  Gargantuan: "Gargantuesco",
};

const TYPE_EN_ES: Record<string, string> = {
  Aberration: "Aberración",
  Beast: "Bestia",
  Celestial: "Celestial",
  Construct: "Autómata",
  Dragon: "Dragón",
  Elemental: "Elemental",
  Fey: "Feérico",
  Fiend: "Infernal",
  Giant: "Gigante",
  Humanoid: "Humanoide",
  Monstrosity: "Monstruosidad",
  Ooze: "Cieno",
  Plant: "Planta",
  Undead: "Muerto viviente",
};

const ALIGN_EN_ES: Record<string, string> = {
  Unaligned: "Sin alineamiento",
  "Any alignment": "Cualquiera",
  "Lawful good": "Legal bueno",
  "Neutral good": "Neutral bueno",
  "Chaotic good": "Caótico bueno",
  "Lawful neutral": "Legal neutral",
  Neutral: "Neutral",
  "Chaotic neutral": "Caótico neutral",
  "Lawful evil": "Legal malvado",
  "Neutral evil": "Neutral malvado",
  "Chaotic evil": "Caótico malvado",
};

const MONSTER_FIELD_EN_ES: Record<string, string> = {
  feet: "metros",
  Speed: "Velocidad",
  fly: "volar",
  swim: "nadar",
  climb: "escalar",
  burrow: "excavar",
  hover: "levitar",
  Darkvision: "Visión en la oscuridad",
  Blindsight: "Vista ciega",
  Tremorsense: "Sentido sísmico",
  Truesight: "Visión verdadera",
  "Passive Perception": "Percepción pasiva",
  Languages: "Idiomas",
  Language: "Idioma",
  Understands: "Entiende",
  but: "pero",
  "can't speak": "no puede hablar",
  telepathy: "telepatía",
  Common: "Común",
  Draconic: "Dracónico",
  Elvish: "Élfico",
  Dwarvish: "Enano",
  Giant: "Gigante",
  Goblin: "Goblin",
  Orc: "Orco",
  Infernal: "Infernal",
  Abyssal: "Abisal",
  Celestial: "Celestial",
  Sylvan: "Silvano",
  Primordial: "Primordial",
  Undercommon: "Infrasombroso",
  Deep: "Profundo",
  Speech: "Habla",
  "—": "—",
};

const WEAPON_EN: Record<string, { name: string; category: string; damageType: string }> = {
  baston: { name: "Quarterstaff", category: "Simple Melee", damageType: "Bludgeoning" },
  daga: { name: "Dagger", category: "Simple Melee", damageType: "Piercing" },
  garrote: { name: "Club", category: "Simple Melee", damageType: "Bludgeoning" },
  "garrote-grande": { name: "Greatclub", category: "Simple Melee", damageType: "Bludgeoning" },
  "hacha-de-mano": { name: "Handaxe", category: "Simple Melee", damageType: "Slashing" },
  hoz: { name: "Sickle", category: "Simple Melee", damageType: "Slashing" },
  jabalina: { name: "Javelin", category: "Simple Melee", damageType: "Piercing" },
  lanza: { name: "Spear", category: "Simple Melee", damageType: "Piercing" },
  "martillo-ligero": { name: "Light Hammer", category: "Simple Melee", damageType: "Bludgeoning" },
  maza: { name: "Mace", category: "Simple Melee", damageType: "Bludgeoning" },
  "arco-corto": { name: "Shortbow", category: "Simple Ranged", damageType: "Piercing" },
  "ballesta-ligera": { name: "Light Crossbow", category: "Simple Ranged", damageType: "Piercing" },
  dardo: { name: "Dart", category: "Simple Ranged", damageType: "Piercing" },
  honda: { name: "Sling", category: "Simple Ranged", damageType: "Bludgeoning" },
  alabarda: { name: "Halberd", category: "Martial Melee", damageType: "Slashing" },
  cimitarra: { name: "Scimitar", category: "Martial Melee", damageType: "Slashing" },
  "espada-corta": { name: "Shortsword", category: "Martial Melee", damageType: "Piercing" },
  "espada-larga": { name: "Longsword", category: "Martial Melee", damageType: "Slashing" },
  espadon: { name: "Greatsword", category: "Martial Melee", damageType: "Slashing" },
  estoque: { name: "Rapier", category: "Martial Melee", damageType: "Piercing" },
  guja: { name: "Glaive", category: "Martial Melee", damageType: "Slashing" },
  "hacha-a-dos-manos": { name: "Greataxe", category: "Martial Melee", damageType: "Slashing" },
  "hacha-de-guerra": { name: "Battleaxe", category: "Martial Melee", damageType: "Slashing" },
  "lanza-de-caballeria": { name: "Lance", category: "Martial Melee", damageType: "Piercing" },
  latigo: { name: "Whip", category: "Martial Melee", damageType: "Slashing" },
  "lucero-del-alba": { name: "Morningstar", category: "Martial Melee", damageType: "Piercing" },
  mangual: { name: "Flail", category: "Martial Melee", damageType: "Bludgeoning" },
  "martillo-de-guerra": { name: "Warhammer", category: "Martial Melee", damageType: "Bludgeoning" },
  "maza-a-dos-manos": { name: "Maul", category: "Martial Melee", damageType: "Bludgeoning" },
  pica: { name: "Pike", category: "Martial Melee", damageType: "Piercing" },
  "pico-de-guerra": { name: "War Pick", category: "Martial Melee", damageType: "Piercing" },
  tridente: { name: "Trident", category: "Martial Melee", damageType: "Piercing" },
  "arco-largo": { name: "Longbow", category: "Martial Ranged", damageType: "Piercing" },
  "ballesta-de-mano": { name: "Hand Crossbow", category: "Martial Ranged", damageType: "Piercing" },
  "ballesta-pesada": { name: "Heavy Crossbow", category: "Martial Ranged", damageType: "Piercing" },
  cerbatana: { name: "Blowgun", category: "Martial Ranged", damageType: "Piercing" },
  mosquete: { name: "Musket", category: "Martial Ranged", damageType: "Piercing" },
  pistola: { name: "Pistol", category: "Martial Ranged", damageType: "Piercing" },
};

const CLASS_EN: Record<
  string,
  { name: string; primary: string; saves: string }
> = {
  barbaro: { name: "Barbarian", primary: "Strength", saves: "Strength and Constitution" },
  bardo: { name: "Bard", primary: "Charisma", saves: "Dexterity and Charisma" },
  brujo: { name: "Warlock", primary: "Charisma", saves: "Wisdom and Charisma" },
  clerigo: { name: "Cleric", primary: "Wisdom", saves: "Wisdom and Charisma" },
  druida: { name: "Druid", primary: "Wisdom", saves: "Intelligence and Wisdom" },
  explorador: { name: "Ranger", primary: "Dexterity and Wisdom", saves: "Strength and Dexterity" },
  guerrero: { name: "Fighter", primary: "Strength or Dexterity", saves: "Strength and Constitution" },
  hechicero: { name: "Sorcerer", primary: "Charisma", saves: "Constitution and Charisma" },
  mago: { name: "Wizard", primary: "Intelligence", saves: "Intelligence and Wisdom" },
  monje: { name: "Monk", primary: "Dexterity and Wisdom", saves: "Strength and Dexterity" },
  paladin: { name: "Paladin", primary: "Strength and Charisma", saves: "Wisdom and Charisma" },
  picaro: { name: "Rogue", primary: "Dexterity", saves: "Dexterity and Intelligence" },
};

const SPECIES_EN: Record<string, string> = {
  aasimar: "Aasimar",
  draconido: "Dragonborn",
  elfo: "Elf",
  enano: "Dwarf",
  gnomo: "Gnome",
  goliat: "Goliath",
  humano: "Human",
  mediano: "Halfling",
  orco: "Orc",
  tiefling: "Tiefling",
};

const ABILITY_ES_EN: Record<string, string> = {
  Fuerza: "Strength",
  Destreza: "Dexterity",
  Constitución: "Constitution",
  Constitucion: "Constitution",
  Inteligencia: "Intelligence",
  Sabiduría: "Wisdom",
  Sabiduria: "Wisdom",
  Carisma: "Charisma",
  y: "and",
  o: "or",
};

function translatePhraseEsToEn(text: string, dict: Record<string, string>): string {
  if (!text || !text.trim()) return "";
  let out = text;
  const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    out = out.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), dict[k]);
  }
  // metric → imperial (common PHB distances)
  out = out
    .replace(/\b1,?5\s*km\b/gi, "1 mile")
    .replace(/\b90\s*m\b/gi, "300 feet")
    .replace(/\b45\s*m\b/gi, "150 feet")
    .replace(/\b36\s*m\b/gi, "120 feet")
    .replace(/\b27\s*m\b/gi, "90 feet")
    .replace(/\b18\s*m\b/gi, "60 feet")
    .replace(/\b9\s*m\b/gi, "30 feet")
    .replace(/\b3\s*m\b/gi, "10 feet")
    .replace(/\b1,?5\s*m\b/gi, "5 feet")
    .replace(/\b1,50\s*m\b/gi, "5 feet");
  return out;
}

function translateSizeTypeAlignEnToEs(text: string, dict: Record<string, string>): string {
  if (!text) return "";
  let out = text;
  for (const [en, es] of Object.entries(dict).sort((a, b) => b[0].length - a[0].length)) {
    out = out.replace(new RegExp(`\\b${en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"), es);
  }
  return out;
}

function convertFeetToMeters(text: string): string {
  return text.replace(/(\d+)\s*ft\.?/gi, (_, n) => {
    const m = Math.round((Number(n) * 0.3) * 10) / 10;
    const pretty = Number.isInteger(m) ? String(m) : String(m).replace(".", ",");
    return `${pretty} m`;
  });
}

type SpellMap = { byEsNorm: Record<string, { es: string; en: string }> };
type MonsterMap = {
  byEnNorm: Record<
    string,
    { es: string; en: string; type: string; size: string; alignment: string }
  >
};

function bestMonsterMatch(
  enName: string,
  map: MonsterMap["byEnNorm"],
): MonsterMap["byEnNorm"][string] | null {
  const fixed = fixOcrName(enName);
  const key = norm(fixed);
  if (map[key]) return map[key];
  if (map[norm(enName)]) return map[norm(enName)];

  // Fuzzy: shared letter ratio
  let best: MonsterMap["byEnNorm"][string] | null = null;
  let bestScore = 0;
  const target = key.replace(/\s/g, "");
  if (target.length < 3) return null;
  for (const [k, row] of Object.entries(map)) {
    const cand = k.replace(/\s/g, "");
    if (Math.abs(cand.length - target.length) > 4) continue;
    let shared = 0;
    const tSet = new Set(target);
    for (const ch of new Set(cand)) if (tSet.has(ch)) shared++;
    const score =
      shared / Math.max(new Set(target).size, 1) +
      (cand.includes(target.slice(0, 4)) ? 0.5 : 0) +
      (target.includes(cand.slice(0, 4)) ? 0.5 : 0);
    if (cand.startsWith(target.slice(0, 5)) || target.startsWith(cand.slice(0, 5))) {
      if (score > bestScore) {
        bestScore = score + 0.3;
        best = row;
      }
    } else if (score > bestScore && score >= 1.2) {
      bestScore = score;
      best = row;
    }
  }
  return bestScore >= 1.2 ? best : null;
}

async function writeJson(filePath: string, data: unknown) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

async function fillSpells(spellMap: SpellMap) {
  const file = path.join(CONTENT, "spells.json");
  const spells = JSON.parse(await fs.readFile(file, "utf-8")) as Array<{
    name: Loc;
    school: Loc;
    castingTime: Loc;
    range: Loc;
    duration: Loc;
    description: Loc;
    [k: string]: unknown;
  }>;

  // Manual fixes for bad OCR spell names in content
  const manual: Record<string, string> = {
    "agarre electrizante": "Shocking Grasp",
    telepatia: "Telepathy",
    "puerta arcana": "Arcane Gate",
    "fuente de luz lunar": "Moonbeam",
    escupo: "Spit", // likely bad parse — leave if unknown
  };

  let filled = 0;
  for (const s of spells) {
    const key = norm(s.name.es);
    const mapped = spellMap.byEsNorm[key];
    const enName = mapped?.en || manual[key] || "";
    if (enName && !s.name.en) {
      s.name.en = enName;
      filled++;
    }
    if (!s.school.en && s.school.es) {
      const sk = norm(s.school.es).split(" ")[0];
      s.school.en = SCHOOL_ES_EN[sk] || SCHOOL_ES_EN[s.school.es.toLowerCase()] || "";
      if (!s.school.en) {
        for (const [k, v] of Object.entries(SCHOOL_ES_EN)) {
          if (norm(s.school.es).includes(norm(k))) {
            s.school.en = v;
            break;
          }
        }
      }
    }
    if (!s.castingTime.en && s.castingTime.es) {
      s.castingTime.en =
        CAST_ES_EN[s.castingTime.es] ||
        translatePhraseEsToEn(s.castingTime.es, CAST_ES_EN);
    }
    if (!s.range.en && s.range.es) {
      s.range.en =
        RANGE_ES_EN[s.range.es] || translatePhraseEsToEn(s.range.es, RANGE_ES_EN);
    }
    if (!s.duration.en && s.duration.es) {
      s.duration.en =
        DURATION_ES_EN[s.duration.es] ||
        translatePhraseEsToEn(s.duration.es, {
          ...DURATION_ES_EN,
          "Concentración, hasta": "Concentration, up to",
          Concentración: "Concentration",
        });
    }
    // Clear half-translated descriptions (Spanish prose with a few EN swaps)
    if (
      s.description.en &&
      s.description.es &&
      /[áéíóúñ¿¡]/i.test(s.description.en) &&
      /\b(spell|target|range|creature|damage)\b/i.test(s.description.en)
    ) {
      s.description.en = "";
    }
  }

  await writeJson(file, spells);
  return { total: spells.length, namesFilled: filled };
}

async function fillWeapons() {
  const file = path.join(CONTENT, "weapons.json");
  const items = JSON.parse(await fs.readFile(file, "utf-8")) as Array<{
    slug: string;
    name: Loc;
    category: Loc;
    damageType: Loc;
  }>;
  let n = 0;
  for (const w of items) {
    const tr = WEAPON_EN[w.slug];
    if (!tr) continue;
    if (!w.name.en) {
      w.name.en = tr.name;
      n++;
    }
    if (!w.category.en) w.category.en = tr.category;
    if (!w.damageType.en) w.damageType.en = tr.damageType;
  }
  await writeJson(file, items);
  return n;
}

async function fillEquipment() {
  const file = path.join(CONTENT, "equipment.json");
  const map: Record<string, string> = {
    mochila: "Backpack",
    "cuerda-de-canamo": "Hempen Rope",
    antorcha: "Torch",
    "kit-de-sanador": "Healer's Kit",
    linterna: "Lantern",
    raciones: "Rations",
    "saco-de-dormir": "Bedroll",
    tienda: "Tent",
    yesca: "Tinderbox",
    pala: "Shovel",
    palanqueta: "Crowbar",
    cadenas: "Chain",
    "espejo-de-acero": "Steel Mirror",
    frasco: "Flask",
    aceite: "Oil",
    pergamino: "Parchment",
    tinta: "Ink",
    pluma: "Ink Pen",
    odres: "Waterskin",
    cantimplora: "Waterskin",
  };
  const items = JSON.parse(await fs.readFile(file, "utf-8")) as Array<{
    slug: string;
    name: Loc;
    category: Loc;
    description: Loc;
  }>;
  let n = 0;
  for (const it of items) {
    if (!it.name.en && map[it.slug]) {
      it.name.en = map[it.slug];
      n++;
    }
    if (!it.category.en && it.category.es) {
      it.category.en = "Adventuring Gear";
    }
    // description.en left empty → UI falls back to Spanish
  }
  await writeJson(file, items);
  return n;
}

async function fillClasses() {
  const dir = path.join(CONTENT, "classes");
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json"));
  let n = 0;
  for (const f of files) {
    const fp = path.join(dir, f);
    const c = JSON.parse(await fs.readFile(fp, "utf-8")) as {
      slug: string;
      name: Loc;
      primaryAbility: Loc;
      savingThrows: Loc;
      armor: Loc;
      weapons: Loc;
      skills: Loc;
      description: Loc;
      features: Array<{ name: Loc; description: Loc; level: number }>;
    };
    const tr = CLASS_EN[c.slug];
    if (tr) {
      if (!c.name.en) {
        c.name.en = tr.name;
        n++;
      }
      if (!c.primaryAbility.en) {
        c.primaryAbility.en =
          tr.primary || translatePhraseEsToEn(c.primaryAbility.es, ABILITY_ES_EN);
      }
      if (!c.savingThrows.en) {
        c.savingThrows.en =
          tr.saves || translatePhraseEsToEn(c.savingThrows.es, ABILITY_ES_EN);
      }
    }
    if (!c.armor.en && c.armor.es) {
      c.armor.en = c.armor.es === "—" ? "—" : translatePhraseEsToEn(c.armor.es, {
        ligeras: "light",
        medias: "medium",
        pesadas: "heavy",
        escudos: "shields",
        Ninguna: "None",
      });
    }
    if (!c.weapons.en && c.weapons.es) {
      c.weapons.en = c.weapons.es === "—" ? "—" : translatePhraseEsToEn(c.weapons.es, {
        simples: "simple",
        marciales: "martial",
      });
    }
    if (!c.skills.en && c.skills.es) {
      c.skills.en = translatePhraseEsToEn(c.skills.es, {
        elección: "choice",
        "de tu elección": "of your choice",
        Se: "",
        recomiendan: "Recommended:",
      });
    }
    // description.en / feature description.en left empty → Spanish fallback in UI
    for (const feat of c.features || []) {
      if (!feat.name.en && feat.name.es) {
        feat.name.en = feat.name.es
          .replace(/INSPIRACIÓN BÁRDICA/i, "BARDIC INSPIRATION")
          .replace(/LANZAMIENTO DE CONJUROS/i, "SPELLCASTING")
          .replace(/\bNIveL\b|\bNIVEL\b/gi, "LEVEL");
      }
    }
    await writeJson(fp, c);
  }
  return n;
}

async function fillSpecies() {
  const file = path.join(CONTENT, "species.json");
  const items = JSON.parse(await fs.readFile(file, "utf-8")) as Array<{
    slug: string;
    name: Loc;
    creatureType: Loc;
    size: Loc;
    speed: Loc;
    description: Loc;
    traits: Array<{ name: Loc; description: Loc }>;
  }>;
  let n = 0;
  for (const s of items) {
    if (!s.name.en && SPECIES_EN[s.slug]) {
      s.name.en = SPECIES_EN[s.slug];
      n++;
    }
    if (!s.creatureType.en && s.creatureType.es) {
      s.creatureType.en = /humanoide/i.test(s.creatureType.es)
        ? "Humanoid"
        : translatePhraseEsToEn(s.creatureType.es, TYPE_EN_ES);
    }
    if (!s.size.en && s.size.es) {
      const rev = Object.fromEntries(
        Object.entries(SIZE_EN_ES).map(([en, es]) => [es, en]),
      );
      s.size.en = rev[s.size.es] || translatePhraseEsToEn(s.size.es, rev);
    }
    if (!s.speed.en && s.speed.es) {
      s.speed.en = translatePhraseEsToEn(s.speed.es, { m: "feet", "9 m": "30 feet" });
      if (/9\s*m/i.test(s.speed.es)) s.speed.en = "30 feet";
      else if (/10,?5\s*m|10\.5\s*m/i.test(s.speed.es)) s.speed.en = "35 feet";
      else if (/7,?5\s*m|7\.5\s*m/i.test(s.speed.es)) s.speed.en = "25 feet";
    }
    for (const t of s.traits || []) {
      if (!t.name.en && t.name.es) t.name.en = t.name.es;
    }
  }
  await writeJson(file, items);
  return n;
}

async function fillBackgrounds() {
  const file = path.join(CONTENT, "backgrounds.json");
  const map: Record<string, string> = {
    acolito: "Acolyte",
    animador: "Entertainer",
    artesano: "Artisan",
    campesino: "Farmer",
    charlatan: "Charlatan",
    comerciante: "Merchant",
    criminal: "Criminal",
    ermitano: "Hermit",
    erudito: "Sage",
    guardia: "Guard",
    guia: "Guide",
    marinero: "Sailor",
    noble: "Noble",
    soldado: "Soldier",
    vagabundo: "Wayfarer",
  };
  const items = JSON.parse(await fs.readFile(file, "utf-8")) as Array<{
    slug: string;
    name: Loc;
    abilityScores?: Loc;
    feat?: Loc;
    skillProficiencies?: Loc;
    toolProficiencies?: Loc;
    equipment?: Loc;
    description: Loc;
  }>;
  let n = 0;
  for (const b of items) {
    if (!b.name.en && map[b.slug]) {
      b.name.en = map[b.slug];
      n++;
    }
    for (const key of [
      "abilityScores",
      "feat",
      "skillProficiencies",
      "toolProficiencies",
      "equipment",
    ] as const) {
      const loc = b[key];
      if (loc && !loc.en && loc.es) {
        loc.en = translatePhraseEsToEn(loc.es, ABILITY_ES_EN);
      }
    }
  }
  await writeJson(file, items);
  return n;
}

async function fillFeats() {
  const file = path.join(CONTENT, "feats.json");
  const items = JSON.parse(await fs.readFile(file, "utf-8")) as Array<{
    name: Loc;
    category: Loc;
    description: Loc;
    prerequisite?: Loc;
  }>;
  let n = 0;
  for (const f of items) {
    if (!f.name.en && f.name.es) {
      f.name.en = f.name.es;
      n++;
    }
    if (!f.category.en && f.category.es) {
      f.category.en = translatePhraseEsToEn(f.category.es, {
        Origen: "Origin",
        General: "General",
        Estilo: "Fighting Style",
        Épica: "Epic Boon",
        Epica: "Epic Boon",
      });
    }
    if (f.prerequisite && !f.prerequisite.en && f.prerequisite.es) {
      f.prerequisite.en = translatePhraseEsToEn(f.prerequisite.es, ABILITY_ES_EN);
    }
  }
  await writeJson(file, items);
  return n;
}

async function fillMonsters(monsterMap: MonsterMap) {
  const dir = path.join(CONTENT, "monsters");
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json"));
  let matched = 0;
  let filled = 0;

  for (const f of files) {
    const fp = path.join(dir, f);
    const m = JSON.parse(await fs.readFile(fp, "utf-8")) as {
      name: Loc;
      size: Loc;
      type: Loc;
      alignment: Loc;
      speed: Loc;
      skills?: Loc;
      senses: Loc;
      languages: Loc;
      description: Loc;
      traits: Array<{ name: Loc; description: Loc }>;
      actions: Array<{ name: Loc; description: Loc }>;
      bonusActions: Array<{ name: Loc; description: Loc }>;
      reactions: Array<{ name: Loc; description: Loc }>;
      legendaryActions: Array<{ name: Loc; description: Loc }>;
    };

    const row = bestMonsterMatch(m.name.en, monsterMap.byEnNorm);
    if (row) {
      matched++;
      if (!m.name.es || m.name.es === m.name.en || m.name.es === fixOcrName(m.name.en)) {
        if (!m.name.es) filled++;
        m.name.es = row.es;
      }
      // Always prefer glossary for size/type/alignment (OCR English is unreliable)
      if (row.size) m.size.es = row.size;
      else if (!m.size.es) {
        m.size.es = translateSizeTypeAlignEnToEs(m.size.en, SIZE_EN_ES);
      }
      if (row.type) m.type.es = row.type;
      else if (!m.type.es) {
        m.type.es = translateSizeTypeAlignEnToEs(m.type.en, TYPE_EN_ES);
      }
      if (row.alignment && !/^\d+$/.test(row.alignment)) {
        m.alignment.es = row.alignment;
      } else if (!m.alignment.es || /^\d+$/.test(m.alignment.es)) {
        m.alignment.es = translateSizeTypeAlignEnToEs(m.alignment.en, ALIGN_EN_ES);
      }
    } else {
      if (!m.size.es && m.size.en) {
        m.size.es = translateSizeTypeAlignEnToEs(m.size.en, SIZE_EN_ES);
      }
      if (!m.type.es && m.type.en) {
        m.type.es = translateSizeTypeAlignEnToEs(m.type.en, TYPE_EN_ES);
      }
      if (!m.alignment.es && m.alignment.en) {
        m.alignment.es = translateSizeTypeAlignEnToEs(m.alignment.en, ALIGN_EN_ES);
      }
      if (!m.name.es && m.name.en) {
        m.name.es = fixOcrName(m.name.en); // at least clean OCR for display
      }
    }

    if (m.speed.en) {
      m.speed.es = translateByMap(convertFeetToMeters(m.speed.en), MONSTER_FIELD_EN_ES);
    }
    if (m.skills && m.skills.en) {
      m.skills.es = translateByMap(m.skills.en, {
        Perception: "Percepción",
        Stealth: "Sigilo",
        Athletics: "Atletismo",
        Acrobatics: "Acrobacias",
        Insight: "Perspicacia",
        Deception: "Engaño",
        Intimidation: "Intimidación",
        Persuasion: "Persuasión",
        Arcana: "Arcano",
        History: "Historia",
        Nature: "Naturaleza",
        Religion: "Religión",
        Survival: "Supervivencia",
        Investigation: "Investigación",
        Medicine: "Medicina",
        Performance: "Interpretación",
        "Animal Handling": "Trato con animales",
        "Sleight of Hand": "Juego de manos",
      });
    }
    if (m.senses.en) {
      m.senses.es = translateByMap(
        convertFeetToMeters(m.senses.en),
        MONSTER_FIELD_EN_ES,
      );
    }
    if (m.languages.en) {
      m.languages.es = translateByMap(m.languages.en, MONSTER_FIELD_EN_ES);
    }
    if (!m.description.es && m.description.en) {
      m.description.es = m.description.en
        .replace(/From Monster Manual/gi, "Del Manual de Monstruos")
        .replace(/Stats OCR-extracted; verify vs PDF\./gi, "Estadísticas extraídas por OCR; verificar con el PDF.")
        .replace(/book p\./gi, "libro p.");
    }

    const fillActions = (arr: Array<{ name: Loc; description: Loc }>) => {
      for (const a of arr || []) {
        if (!a.name.es && a.name.en) {
          a.name.es = translateByMap(a.name.en, {
            Attack: "Ataque",
            Bite: "Mordisco",
            Claw: "Garra",
            Claws: "Garras",
            Multiattack: "Ataque múltiple",
            Slam: "Golpetazo",
            Tail: "Cola",
            Breath: "Aliento",
            Spellcasting: "Lanzamiento de conjuros",
          });
        }
        if (!a.description.es && a.description.en) {
          a.description.es = convertFeetToMeters(
            translateByMap(a.description.en, {
              ...MONSTER_FIELD_EN_ES,
              "Melee Attack Roll": "Tirada de ataque cuerpo a cuerpo",
              "Ranged Attack Roll": "Tirada de ataque a distancia",
              "Saving Throw": "Tirada de salvación",
              Hit: "Impacto",
              damage: "daño",
              Reach: "Alcance",
            }),
          );
        }
      }
    };
    fillActions(m.traits);
    fillActions(m.actions);
    fillActions(m.bonusActions);
    fillActions(m.reactions);
    fillActions(m.legendaryActions);

    await writeJson(fp, m);
  }

  return { total: files.length, matched, namesFilled: filled };
}

async function main() {
  const spellMap = JSON.parse(
    await fs.readFile(path.join(STAGING, "spell-name-map.json"), "utf-8"),
  ) as SpellMap;
  const monsterMap = JSON.parse(
    await fs.readFile(path.join(STAGING, "monster-name-map.json"), "utf-8"),
  ) as MonsterMap;

  console.log("Filling spells…");
  console.log(await fillSpells(spellMap));
  console.log("Filling weapons…");
  console.log({ weapons: await fillWeapons() });
  console.log("Filling equipment…");
  console.log({ equipment: await fillEquipment() });
  console.log("Filling classes…");
  console.log({ classes: await fillClasses() });
  console.log("Filling species…");
  console.log({ species: await fillSpecies() });
  console.log("Filling backgrounds…");
  console.log({ backgrounds: await fillBackgrounds() });
  console.log("Filling feats…");
  console.log({ feats: await fillFeats() });
  console.log("Filling monsters…");
  console.log(await fillMonsters(monsterMap));
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
