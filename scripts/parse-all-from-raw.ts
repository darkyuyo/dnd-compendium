/**
 * Parse extracted PDF text (raw/phb, raw/mm) into content/ JSON.
 * Private table use — quality varies (MM OCR is noisy).
 *
 * Usage: npx tsx scripts/parse-all-from-raw.ts
 */
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import {
  BackgroundSchema,
  ClassSchema,
  EquipmentItemSchema,
  FeatSchema,
  MonsterSchema,
  SpeciesSchema,
  SpellSchema,
  WeaponSchema,
  type Background,
  type Class,
  type EquipmentItem,
  type Feat,
  type LocalizedString,
  type Monster,
  type Species,
  type Spell,
  type Weapon,
} from "../src/lib/types";

const ROOT = process.cwd();
const PHB = path.join(ROOT, "raw", "phb");
const MM = path.join(ROOT, "raw", "mm");
const CONTENT = path.join(ROOT, "content");

function L(es: string, en = ""): LocalizedString {
  return { es: es.trim(), en: en.trim() };
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "item";
}

function titleCaseEs(name: string): string {
  const lower = name.toLowerCase();
  return lower.replace(/(^|[\s/-])([a-záéíóúüñ])/g, (_, p, c) => p + c.toUpperCase());
}

function isGarbageMonsterName(name: string): boolean {
  const n = name.trim();
  if (n.length < 3 || n.length > 45) return true;
  if (/\d/.test(n) && /damage|hit|ft\.|AC|HP|d\d/i.test(n)) return true;
  if (/^(damage|hit|melee|ranged|attack|roll|reach|speed|skills|senses)/i.test(n))
    return true;
  if ((n.match(/\d/g) || []).length >= 3) return true;
  if (/^[a-z0-9 +\-()]+$/i.test(n) && /\d/.test(n)) return true;
  // Too few letters
  const letters = (n.match(/[a-zA-Z]/g) || []).length;
  if (letters < 3) return true;
  return false;
}

async function loadPages(
  dir: string,
  from: number,
  to: number,
): Promise<string> {
  const parts: string[] = [];
  for (let i = from; i <= to; i++) {
    const file = path.join(
      dir,
      `page-${String(i).padStart(4, "0")}.txt`,
    );
    try {
      parts.push(await fs.readFile(file, "utf-8"));
    } catch {
      /* skip missing */
    }
  }
  return parts.join("\n");
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

const CLASS_MAP: Record<string, string> = {
  bardo: "bard",
  bárbaro: "barbarian",
  barbaro: "barbarian",
  brujo: "warlock",
  clérigo: "cleric",
  clerigo: "cleric",
  druida: "druid",
  explorador: "ranger",
  guerrero: "fighter",
  hechicero: "sorcerer",
  mago: "wizard",
  monje: "monk",
  paladín: "paladin",
  paladin: "paladin",
  pícaro: "rogue",
  picaro: "rogue",
  guardabosques: "ranger",
};

function mapClasses(raw: string): string[] {
  return raw
    .split(/[,;]/)
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean)
    .map((c) => CLASS_MAP[c] || slugify(c));
}

// ─── SPELLS ───────────────────────────────────────────────

function parseSpells(text: string): Spell[] {
  const cleaned = text
    .replace(/CAPÍTULO 7 \| CONJUROS\s*\d*/g, "\n")
    .replace(/\f/g, "\n");

  // Split on spell headers: NAME\nSchool line with nivel/Truco
  const headerRe =
    /^([A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑa-záéíóúüñ0-9 /'\-]{1,60})\n((?:Truco de [^\n(]+)|(?:[^\n]+ de nivel \d))\s*\(([^)]+)\)/gm;

  const matches = [...cleaned.matchAll(headerRe)];
  const spells: Spell[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const name = m[1].trim();
    if (
      name.length < 2 ||
      name.includes("CAPÍTULO") ||
      name.includes("DESCRIPCIONES") ||
      name === "CONJUROS"
    ) {
      continue;
    }

    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : cleaned.length;
    const body = cleaned.slice(start, end);

    const casting =
      body.match(/Tiempo de lanzamiento:\s*([^\n]+)/i)?.[1]?.trim() || "";
    const range = body.match(/Alcance:\s*([^\n]+)/i)?.[1]?.trim() || "";
    const components =
      body.match(/Componentes:\s*([^\n]+)/i)?.[1]?.trim() || "";
    const duration = body.match(/Duración:\s*([^\n]+)/i)?.[1]?.trim() || "";

    let description = body
      .replace(/Tiempo de lanzamiento:[^\n]+\n?/i, "")
      .replace(/Alcance:[^\n]+\n?/i, "")
      .replace(/Componentes:[^\n]+\n?/i, "")
      .replace(/Duración:[^\n]+\n?/i, "")
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Cut trailing page noise
    description = description.replace(/\s*\d{2,3}\s*$/, "").trim();
    if (description.length < 20) continue;

    const schoolLine = m[2].trim();
    let level = 0;
    let schoolEs = schoolLine;
    const nivelMatch = schoolLine.match(/de nivel (\d)/i);
    const trucoMatch = schoolLine.match(/Truco de (.+)/i);
    if (nivelMatch) {
      level = Number(nivelMatch[1]);
      schoolEs = schoolLine.replace(/\s*de nivel \d.*/i, "").trim();
    } else if (trucoMatch) {
      level = 0;
      schoolEs = trucoMatch[1].trim();
    }

    const displayName = titleCaseEs(name);
    const slug = slugify(displayName);
    if (seen.has(slug)) continue;
    seen.add(slug);

    spells.push({
      id: `spell-${slug}`,
      slug,
      name: L(displayName),
      level,
      school: L(schoolEs),
      castingTime: L(casting),
      range: L(range),
      components,
      duration: L(duration),
      description: L(description),
      classes: mapClasses(m[3]),
      source: "phb2024",
    });
  }

  return z.array(SpellSchema).parse(spells);
}

// ─── FEATS ────────────────────────────────────────────────

function parseFeats(text: string): Feat[] {
  const cleaned = text.replace(/CAPÍTULO 5 \| DOTES\s*\d*/g, "\n");
  const re =
    /^([A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑa-záéíóúüñ /'\-]{1,50})\n(Dote de [^\n]+)\n([\s\S]*?)(?=^[A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑa-záéíóúüñ /'\-]{1,50}\nDote de |\nCAPÍTULO|\nLISTA DE DOTES|$)/gm;

  const feats: Feat[] = [];
  const seen = new Set<string>();

  for (const m of cleaned.matchAll(re)) {
    const name = m[1].trim();
    if (
      name.includes("DESCRIPCIONES") ||
      name.includes("PARTES") ||
      name.includes("LISTA")
    ) {
      continue;
    }
    const category = m[2].replace(/^Dote de /i, "").trim();
    let desc = m[3].replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
    const prereq =
      desc.match(/Requisito[s]?:?\s*([^.]+)\./i)?.[1]?.trim() ||
      undefined;
    desc = desc.replace(/Repetible\..*$/i, (s) => s).trim();
    if (desc.length < 15) continue;

    const slug = slugify(name);
    if (seen.has(slug)) continue;
    seen.add(slug);

    const feat: Feat = {
      id: `feat-${slug}`,
      slug,
      name: L(name),
      category: L(category),
      description: L(desc),
      source: "phb2024",
    };
    if (prereq) feat.prerequisite = L(prereq);
    feats.push(feat);
  }

  return z.array(FeatSchema).parse(feats);
}

// ─── SPECIES ──────────────────────────────────────────────

function parseSpecies(text: string): Species[] {
  const names = [
    "AASIMAR",
    "DRACÓNIDO",
    "DRACONIDO",
    "ELFO",
    "ENANO",
    "GNOMO",
    "GOLIAT",
    "HUMANO",
    "MEDIANO",
    "ORCO",
    "TIEFLING",
  ];
  const species: Species[] = [];

  for (const name of names) {
    const re = new RegExp(
      `^${name}\\n([\\s\\S]*?)(?=^(?:${names.join("|")})\\n|CAPÍTULO 5|$)`,
      "m",
    );
    const m = text.match(re);
    if (!m) continue;
    const block = m[1];
    const creatureType =
      block.match(/Tipo de criatura:\s*([^\n]+)/i)?.[1]?.trim() || "humanoide";
    const size =
      block.match(/Tamaño:\s*([^\n]+)/i)?.[1]?.trim() || "Mediano";
    const speed =
      block.match(/Velocidad:\s*([^\n]+)/i)?.[1]?.trim() || "9 m";

    const intro = block
      .split(/ATRIBUTOS DE|Tipo de criatura:/i)[0]
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const traits: Species["traits"] = [];
    const traitSection = block.split(/Como .+?, tienes estos atributos especiales:/i)[1];
    if (traitSection) {
      const traitRe =
        /([A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+(?:\s[a-záéíóúüñ]+)?)\.\s+([^]+?)(?=\n[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+\.|$)/g;
      const flat = traitSection.replace(/\n+/g, " ");
      // Simpler split by capitalized trait names ending with period start
      const parts = traitSection.split(
        /\n(?=[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+(?:\s[a-záéíóúüñ]+)?\.\s)/,
      );
      for (const part of parts) {
        const tm = part.match(
          /^([A-ZÁÉÍÓÚÜÑ][^.]+)\.\s+([\s\S]+)/,
        );
        if (!tm) continue;
        const tName = tm[1].trim();
        const tDesc = tm[2].replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
        if (tDesc.length < 10) continue;
        traits.push({ name: L(tName), description: L(tDesc) });
      }
      void flat;
      void traitRe;
    }

    const nice = name.charAt(0) + name.slice(1).toLowerCase();
    const slug = slugify(nice);
    species.push({
      id: `species-${slug}`,
      slug,
      name: L(nice === "Draconido" ? "Dracónido" : nice),
      creatureType: L(creatureType),
      size: L(size),
      speed: L(speed),
      description: L(intro.slice(0, 800) || nice),
      traits,
      source: "phb2024",
    });
  }

  return z.array(SpeciesSchema).parse(species);
}

// ─── BACKGROUNDS ──────────────────────────────────────────

function parseBackgrounds(text: string): Background[] {
  // Pages often have one word per line — join then split by known names
  const joined = text.replace(/\n+/g, " ").replace(/\s+/g, " ");
  const names = [
    "ACÓLITO",
    "ACOLITO",
    "ANIMADOR",
    "ARTESANO",
    "CAMPESINO",
    "CHARLATÁN",
    "CHARLATAN",
    "COMERCIAN",
    "COMERCIANTE",
    "CRIMINAL",
    "ERMITAÑO",
    "ERUDITO",
    "GUARDIA",
    "GUÍA",
    "GUIA",
    "MARINERO",
    "MERCADER",
    "NOBLE",
    "SABIO",
    "SOLDADO",
    "VAGABUNDO",
  ];

  const backgrounds: Background[] = [];
  const seen = new Set<string>();

  for (const name of names) {
    const re = new RegExp(
      `${name}\\s+Puntuaciones\\s+de\\s+característica:\\s*(.+?)\\s+Dote:\\s*(.+?)\\s+Competencias\\s+en\\s+habilidades:\\s*(.+?)\\s+(?:Competencia\\s+con\\s+herramientas:\\s*(.+?)\\s+)?Equipo:\\s*(.+?)(?=(?:${names.join("|")})\\s+Puntuaciones|CAPÍTULO|$)`,
      "i",
    );
    const m = joined.match(re);
    if (!m) continue;
    const nice =
      name.charAt(0) +
      name.slice(1).toLowerCase().replace("acolito", "acólito");
    const slug = slugify(nice);
    if (seen.has(slug)) continue;
    seen.add(slug);

    backgrounds.push({
      id: `bg-${slug}`,
      slug,
      name: L(nice),
      abilityScores: L(m[1].trim().replace(/\s+/g, " ").slice(0, 120)),
      feat: L(m[2].trim().replace(/\s+/g, " ").slice(0, 120)),
      skillProficiencies: L(m[3].trim().replace(/\s+/g, " ").slice(0, 120)),
      toolProficiencies: m[4]
        ? L(m[4].trim().replace(/\s+/g, " ").slice(0, 120))
        : undefined,
      equipment: L(m[5].trim().replace(/\s+/g, " ").slice(0, 300)),
      description: L(`Origen de personaje: ${nice}.`),
      source: "phb2024",
    });
  }

  return z.array(BackgroundSchema).parse(backgrounds);
}

// ─── CLASSES ──────────────────────────────────────────────

const CLASS_DEFS: { name: string; pages: [number, number] }[] = [
  { name: "Bárbaro", pages: [53, 60] },
  { name: "Bardo", pages: [61, 70] },
  { name: "Brujo", pages: [71, 82] },
  { name: "Clérigo", pages: [83, 92] },
  { name: "Druida", pages: [93, 104] },
  { name: "Explorador", pages: [105, 114] },
  { name: "Guerrero", pages: [115, 124] },
  { name: "Hechicero", pages: [125, 138] },
  { name: "Mago", pages: [139, 150] },
  { name: "Monje", pages: [151, 158] },
  { name: "Paladín", pages: [159, 168] },
  { name: "Pícaro", pages: [169, 176] },
];

async function parseClasses(): Promise<Class[]> {
  const classes: Class[] = [];

  for (const def of CLASS_DEFS) {
    const text = await loadPages(PHB, def.pages[0], def.pages[1]);
    const primary =
      text.match(/Característica principal\s+([^\n]+)/i)?.[1]?.trim() ||
      "";
    const hitDie =
      text.match(
        /Dado de puntos de golpe\s+(1d\d+)\s+por nivel/i,
      )?.[1] || "d8";
    const saves =
      text.match(
        /Competencias en\s*\n?tiradas de salvación\s*\n?([^\n]+)/i,
      )?.[1]?.trim() ||
      text
        .match(/tiradas de salvación\s*\n([^\n]+)/i)?.[1]
        ?.trim() ||
      "";
    const skills =
      text
        .match(/Competencias en\s*\n?habilidades\s*\n?([^\n]+(?:\n[^\n]+)?)/i)?.[0]
        ?.replace(/Competencias en\s*\n?habilidades\s*/i, "")
        .replace(/\n/g, " ")
        .trim()
        .slice(0, 200) || "";
    const weapons =
      text.match(/Competencias con armas\s+([^\n]+)/i)?.[1]?.trim() || "";
    const armor =
      text
        .match(
          /Entrenamiento con\s*\n?armaduras\s*\n?([^\n]+(?:\n[^\n]+)?)/i,
        )?.[0]
        ?.replace(/Entrenamiento con\s*\n?armaduras\s*/i, "")
        .replace(/\n/g, " ")
        .trim()
        .slice(0, 120) || "";

    const descMatch = text.match(
      new RegExp(
        `L[OA]S? ${def.name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, ".")}[^\n]*\\n([\\s\\S]{50,400}?)(?=CONVERTIRSE|COMO PERSONAJE|RASGOS DE CLASE)`,
        "i",
      ),
    );
    let description =
      descMatch?.[1]?.replace(/\n+/g, " ").replace(/\s+/g, " ").trim() ||
      "";
    if (!description) {
      // fallback: text after attributes before RASGOS
      const idx = text.search(/RASGOS DE CLASE/i);
      const before = text.slice(Math.max(0, idx - 600), idx);
      description = before
        .split(/\n/)
        .filter((l) => l.length > 40)
        .join(" ")
        .replace(/\s+/g, " ")
        .slice(0, 500);
    }

    const features: Class["features"] = [];
    const featRe =
      /N[IiÍí]vEL\s+(\d+|l):\s*([A-ZÁÉÍÓÚÜÑ][^\n]+)\n([\s\S]*?)(?=\nN[IiÍí]vEL\s+\d|SUBCLASE|CAPÍTULO|$)/gi;
    for (const m of text.matchAll(featRe)) {
      let level = m[1] === "l" ? 1 : Number(m[1]);
      if (!Number.isFinite(level)) level = 1;
      const fname = m[2].trim();
      const fdesc = m[3].replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
      if (fdesc.length < 20) continue;
      features.push({
        level,
        name: L(fname),
        description: L(fdesc.slice(0, 2000)),
      });
    }

    const slug = slugify(def.name);
    classes.push({
      id: `class-${slug}`,
      slug,
      name: L(def.name),
      hitDie: hitDie.replace(/^1/, "") || hitDie,
      primaryAbility: L(primary || "—"),
      savingThrows: L(saves || "—"),
      armor: L(armor || "—"),
      weapons: L(weapons || "—"),
      skills: L(skills || "—"),
      description: L(description || `Clase ${def.name}.`),
      features: features.slice(0, 40),
      source: "phb2024",
    });
  }

  return z.array(ClassSchema).parse(classes);
}

// ─── WEAPONS ──────────────────────────────────────────────

function parseWeapons(): Weapon[] {
  // Clean curated table from PHB p.217 extraction (names + damage)
  const data: {
    name: string;
    category: string;
    damage: string;
    dtype: string;
  }[] = [
    { name: "Bastón", category: "Simple cuerpo a cuerpo", damage: "1d6", dtype: "Contundente" },
    { name: "Daga", category: "Simple cuerpo a cuerpo", damage: "1d4", dtype: "Perforante" },
    { name: "Garrote", category: "Simple cuerpo a cuerpo", damage: "1d4", dtype: "Contundente" },
    { name: "Garrote grande", category: "Simple cuerpo a cuerpo", damage: "1d8", dtype: "Contundente" },
    { name: "Hacha de mano", category: "Simple cuerpo a cuerpo", damage: "1d6", dtype: "Cortante" },
    { name: "Hoz", category: "Simple cuerpo a cuerpo", damage: "1d4", dtype: "Cortante" },
    { name: "Jabalina", category: "Simple cuerpo a cuerpo", damage: "1d6", dtype: "Perforante" },
    { name: "Lanza", category: "Simple cuerpo a cuerpo", damage: "1d6", dtype: "Perforante" },
    { name: "Martillo ligero", category: "Simple cuerpo a cuerpo", damage: "1d4", dtype: "Contundente" },
    { name: "Maza", category: "Simple cuerpo a cuerpo", damage: "1d6", dtype: "Contundente" },
    { name: "Arco corto", category: "Simple a distancia", damage: "1d6", dtype: "Perforante" },
    { name: "Ballesta ligera", category: "Simple a distancia", damage: "1d8", dtype: "Perforante" },
    { name: "Dardo", category: "Simple a distancia", damage: "1d4", dtype: "Perforante" },
    { name: "Honda", category: "Simple a distancia", damage: "1d4", dtype: "Contundente" },
    { name: "Alabarda", category: "Marcial cuerpo a cuerpo", damage: "1d10", dtype: "Cortante" },
    { name: "Cimitarra", category: "Marcial cuerpo a cuerpo", damage: "1d6", dtype: "Cortante" },
    { name: "Espada corta", category: "Marcial cuerpo a cuerpo", damage: "1d6", dtype: "Perforante" },
    { name: "Espada larga", category: "Marcial cuerpo a cuerpo", damage: "1d8", dtype: "Cortante" },
    { name: "Espadón", category: "Marcial cuerpo a cuerpo", damage: "2d6", dtype: "Cortante" },
    { name: "Estoque", category: "Marcial cuerpo a cuerpo", damage: "1d8", dtype: "Perforante" },
    { name: "Guja", category: "Marcial cuerpo a cuerpo", damage: "1d10", dtype: "Cortante" },
    { name: "Hacha a dos manos", category: "Marcial cuerpo a cuerpo", damage: "1d12", dtype: "Cortante" },
    { name: "Hacha de guerra", category: "Marcial cuerpo a cuerpo", damage: "1d8", dtype: "Cortante" },
    { name: "Lanza de caballería", category: "Marcial cuerpo a cuerpo", damage: "1d12", dtype: "Perforante" },
    { name: "Látigo", category: "Marcial cuerpo a cuerpo", damage: "1d4", dtype: "Cortante" },
    { name: "Lucero del alba", category: "Marcial cuerpo a cuerpo", damage: "1d8", dtype: "Perforante" },
    { name: "Mangual", category: "Marcial cuerpo a cuerpo", damage: "1d8", dtype: "Contundente" },
    { name: "Martillo de guerra", category: "Marcial cuerpo a cuerpo", damage: "1d8", dtype: "Contundente" },
    { name: "Maza a dos manos", category: "Marcial cuerpo a cuerpo", damage: "2d6", dtype: "Contundente" },
    { name: "Pica", category: "Marcial cuerpo a cuerpo", damage: "1d10", dtype: "Perforante" },
    { name: "Pico de guerra", category: "Marcial cuerpo a cuerpo", damage: "1d8", dtype: "Perforante" },
    { name: "Tridente", category: "Marcial cuerpo a cuerpo", damage: "1d8", dtype: "Perforante" },
    { name: "Arco largo", category: "Marcial a distancia", damage: "1d8", dtype: "Perforante" },
    { name: "Ballesta de mano", category: "Marcial a distancia", damage: "1d6", dtype: "Perforante" },
    { name: "Ballesta pesada", category: "Marcial a distancia", damage: "1d10", dtype: "Perforante" },
    { name: "Cerbatana", category: "Marcial a distancia", damage: "1", dtype: "Perforante" },
    { name: "Mosquete", category: "Marcial a distancia", damage: "1d12", dtype: "Perforante" },
    { name: "Pistola", category: "Marcial a distancia", damage: "1d10", dtype: "Perforante" },
  ];

  const weapons: Weapon[] = data.map((w) => {
    const slug = slugify(w.name);
    return {
      id: `weapon-${slug}`,
      slug,
      name: L(w.name),
      category: L(w.category),
      damage: w.damage,
      damageType: L(w.dtype),
      properties: [],
      source: "phb2024" as const,
    };
  });

  return z.array(WeaponSchema).parse(weapons);
}

// ─── EQUIPMENT (sample gear names from chapter) ───────────

async function parseEquipment(): Promise<EquipmentItem[]> {
  const text = await loadPages(PHB, 220, 230);
  const known = [
    "Mochila",
    "Cuerda de cáñamo",
    "Antorcha",
    "Kit de sanador",
    "Linterna",
    "Raciones",
    "Saco de dormir",
    "Tienda",
    "Yesca",
    "Pala",
    "Palanqueta",
    "Cadenas",
    "Espejo de acero",
    "Frasco",
    "Aceite",
    "Pergamino",
    "Tinta",
    "Pluma",
    "Odres",
    "Cantimplora",
  ];

  const items: EquipmentItem[] = [];
  for (const name of known) {
    const slug = slugify(name);
    const mentioned = text.toLowerCase().includes(name.toLowerCase());
    items.push({
      id: `eq-${slug}`,
      slug,
      name: L(name),
      category: L("Equipo de aventurero"),
      description: L(
        mentioned
          ? `${name} (extraído del capítulo de equipo del PHB 2024). Revisa el PDF para coste y peso exactos.`
          : `${name}. Completa coste/peso desde el Manual del Jugador.`,
      ),
      source: "phb2024",
    });
  }
  return z.array(EquipmentItemSchema).parse(items);
}

// ─── MONSTERS (TOC-driven + OCR stats) ────────────────────

function fixOcrDigits(s: string): string {
  return s
    .replace(/\blO\b/g, "10")
    .replace(/\bl(\d)/g, "1$1")
    .replace(/O(?=\d)/g, "0")
    .replace(/(?<=\d)O/g, "0")
    .replace(/rd8/gi, "1d8")
    .replace(/dlO/gi, "d10")
    .replace(/dIO/gi, "d10")
    .replace(/lnitiative/gi, "Initiative");
}

function cleanTocName(raw: string): string {
  return raw
    .replace(/[.]{2,}.*$/, "")
    .replace(/\d+\s*$/, "")
    .replace(/8/g, "B")
    .replace(/1/g, "l") // careful - fix below
    .replace(/\s+/g, " ")
    .trim();
}

/** Better TOC name cleanup preserving intentional digits */
function normalizeTocName(raw: string): string {
  let s = raw
    .replace(/[.]{2,}.*$/, "")
    .replace(/[,\s]*\d[\d\s]*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  // Common OCR digit/letter swaps in names
  const fixes: [RegExp, string][] = [
    [/\bAbo1eth\b/g, "Aboleth"],
    [/\bDevi1\b/g, "Devil"],
    [/\bDo9\b/g, "Dog"],
    [/\bS1aad\b/g, "Slaad"],
    [/\bDra9on\b/g, "Dragon"],
    [/\bNa9a\b/g, "Naga"],
    [/\bSta1ker\b/g, "Stalker"],
    [/\bCraw1er\b/g, "Crawler"],
    [/\bC1oaker\b/g, "Cloaker"],
    [/\bCo1ossus\b/g, "Colossus"],
    [/\bC1aw\b/g, "Claw"],
    [/\bCrocodi1e\b/g, "Crocodile"],
    [/\bCu1tist\b/g, "Cultist"],
    [/\bOrac1e\b/g, "Oracle"],
    [/\bDemi1ich\b/g, "Demilich"],
    [/\bTurt1e\b/g, "Turtle"],
    [/\bOo2e\b/g, "Ooze"],
    [/\bGrim1ock\b/g, "Grimlock"],
    [/\bHe2rou\b/g, "Hezrou"],
    [/\bWar1ord\b/g, "Warlord"],
    [/\bWha1e\b/g, "Whale"],
    [/\bGhou1\b/g, "Ghoul"],
    [/\bGo1em\b/g, "Golem"],
    [/\bKobo1d\b/g, "Kobold"],
    [/\bTrog1odyte\b/g, "Troglodyte"],
    [/\bTro11\b/g, "Troll"],
    [/\bHu1k\b/g, "Hulk"],
    [/\bE1ementa1\b/g, "Elemental"],
    [/\bF1ayer\b/g, "Flayer"],
    [/\bSke1eton\b/g, "Skeleton"],
    [/\bVa1or\b/g, "Valor"],
    [/\bAdmira1\b/g, "Admiral"],
    [/\bPIanetar\b/g, "Planetar"],
    [/\bPo1tergeist\b/g, "Poltergeist"],
    [/\bNob1e\b/g, "Noble"],
    [/\bJe1Iy\b/g, "Jelly"],
    [/\bFun9us\b/g, "Fungus"],
    [/\bB1ight\b/g, "Blight"],
    [/\b8oss\b/g, "Boss"],
    [/\b8ear\b/g, "Bear"],
    [/\b8oar\b/g, "Boar"],
    [/\b8alor\b/g, "Balor"],
    [/\b8anshee\b/g, "Banshee"],
    [/\b8ehir\b/g, "Behir"],
    [/\b8u1ette\b/g, "Bulette"],
    [/Goblin 8oss/g, "Goblin Boss"],
    [/Adult Red Dra9on/g, "Adult Red Dragon"],
    [/Wyrm1in9/g, "Wyrmling"],
    [/Wyrmling/g, "Wyrmling"],
  ];
  for (const [re, rep] of fixes) s = s.replace(re, rep);
  // Drop obviously broken short TOC junk
  if (s.length < 3 || s.length > 50) return "";
  if (!/[A-Za-z]{3,}/.test(s)) return "";
  if (/^(How |Stat |Monster |Parts |Running |App\.|Monsters |Index |Contents)/i.test(s))
    return "";
  return s;
}

async function loadTocMonsters(): Promise<{ name: string; bookPage: number }[]> {
  const tocText =
    (await fs.readFile(path.join(MM, "page-0006.txt"), "utf-8")) +
    "\n" +
    (await fs.readFile(path.join(MM, "page-0007.txt"), "utf-8"));

  const entries: { name: string; bookPage: number }[] = [];
  const seen = new Set<string>();

  for (const line of tocText.split("\n")) {
    const m = line.match(
      /^([A-Za-z][A-Za-z0-9 '’\-]*(?:\s+[A-Za-z0-9 '’\-\(\)]+)*)\s*[.…]{2,}\s*([\dlO]{1,3})\s*$/,
    );
    if (!m) {
      // looser: name then spaces/dots then page
      const m2 = line.match(
        /^([A-Za-z][^.]{2,45}?)\s*[.…]{2,}\s*([\dlOI]{1,3})\s*$/,
      );
      if (!m2) continue;
      const name = normalizeTocName(m2[1]);
      const page = Number(fixOcrDigits(m2[2]));
      if (!name || !page || page < 10 || page > 380) continue;
      const slug = slugify(name);
      if (seen.has(slug)) continue;
      seen.add(slug);
      entries.push({ name, bookPage: page });
      continue;
    }
    const name = normalizeTocName(m[1]);
    const page = Number(fixOcrDigits(m[2]));
    if (!name || !page || page < 10 || page > 380) continue;
    const slug = slugify(name);
    if (seen.has(slug)) continue;
    seen.add(slug);
    entries.push({ name, bookPage: page });
  }
  return entries;
}

function lettersOnly(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, "");
}

function findStatWindow(text: string, name: string): string {
  const target = lettersOnly(name);
  if (target.length < 4) return text;
  const lines = text.split("\n");
  let bestIdx = -1;
  let bestScore = 0;
  for (let i = 0; i < lines.length; i++) {
    const cand = lettersOnly(lines[i]);
    if (cand.length < 3 || cand.length > 60) continue;
    let score = 0;
    if (cand.includes(target.slice(0, Math.min(6, target.length)))) score += 4;
    if (target.includes(cand.slice(0, Math.min(6, cand.length)))) score += 2;
    let shared = 0;
    for (const ch of new Set(cand)) if (target.includes(ch)) shared++;
    score += shared / Math.max(new Set(target).size, 1);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  if (bestIdx < 0 || bestScore < 3) return text;
  return lines.slice(bestIdx, bestIdx + 50).join("\n");
}

async function parseMonstersFromToc(): Promise<Monster[]> {
  const toc = await loadTocMonsters();
  console.log(`  TOC entries: ${toc.length}`);
  const BOOK_TO_PDF = 3;
  const monsters: Monster[] = [];
  const seen = new Set<string>();

  for (const entry of toc) {
    const pdfPage = entry.bookPage + BOOK_TO_PDF;
    const primary = fixOcrDigits(await loadPages(MM, pdfPage, pdfPage));
    const neighbors = fixOcrDigits(
      await loadPages(MM, Math.max(1, pdfPage - 1), pdfPage + 1),
    );
    let text = findStatWindow(primary, entry.name);
    if (!/\bHP\s+\d/i.test(text)) {
      text = findStatWindow(neighbors, entry.name);
    }

    const ac = Number(text.match(/\bAC\s+(\d{1,2})\b/i)?.[1] || 10);
    const hpMatch =
      text.match(/\bHP\s+(\d{1,4}\s*\([^)]+\))/i) ||
      text.match(/\bHP\s+(\d{1,4})\b/i);
    const hp = hpMatch?.[1]?.replace(/\s+/g, " ") || "?";
    if (hp === "?") continue;

    const speed =
      text.match(/Speed\s+([^\n]{3,60})/i)?.[1]?.replace(/\s+/g, " ").trim() ||
      "30 ft.";
    const cr = text.match(/\bCR\s+([\d/]+)/i)?.[1] || "?";
    const pb = text.match(/PB\s*\+?\s*(\d+)/i)?.[1];
    const senses =
      text.match(/Senses\s+([^\n]+)/i)?.[1]?.trim().slice(0, 140) || "—";
    const languages =
      text.match(/Languages?\s+([^\n]+)/i)?.[1]?.trim().slice(0, 140) || "—";
    const skills = text.match(/Skills?\s+([^\n]+)/i)?.[1]?.trim().slice(0, 140);
    const sizeType = text.match(
      /(Tiny|Small|Medium|Large|Huge|Gargantuan)(?:\s+or\s+\w+)?\s+([A-Za-z][A-Za-z /()-]{2,40}),\s*([A-Za-z][A-Za-z ]{2,30})/,
    );

    const slug = slugify(entry.name);
    if (seen.has(slug)) continue;
    seen.add(slug);

    const actions: Monster["actions"] = [];
    const actionChunk =
      text.split(/Actions/i)[1]?.split(/Bonus Actions|Reactions|Legendary Actions/i)[0] ||
      "";
    for (const line of actionChunk
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 25 && /[A-Za-z]/.test(l))
      .slice(0, 5)) {
      const clean = line.replace(/\s+/g, " ");
      actions.push({
        name: L("", clean.split(/[.:]/)[0].slice(0, 50)),
        description: L("", clean.slice(0, 400)),
      });
    }

    const scores = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
    const sm = text.match(
      /S(?:tr|rn)\s*[^\d]*(\d{1,2})[\s\S]{0,30}?Dex[^\d]*(\d{1,2})[\s\S]{0,30}?C(?:on|or)[^\d]*(\d{1,2})/i,
    );
    if (sm) {
      scores.str = Number(sm[1]) || 10;
      scores.dex = Number(sm[2]) || 10;
      scores.con = Number(sm[3]) || 10;
    }

    monsters.push({
      id: `monster-${slug}`,
      slug,
      name: L("", entry.name),
      size: L("", sizeType?.[1] || "Medium"),
      type: L("", (sizeType?.[2] || "Unknown").replace(/\s+/g, " ").trim()),
      alignment: L(
        "",
        (sizeType?.[3] || "Unaligned").replace(/\s+/g, " ").trim(),
      ),
      armorClass: Number.isFinite(ac) ? ac : 10,
      hitPoints: hp,
      speed: L("", speed.slice(0, 80)),
      abilityScores: scores,
      skills: skills ? L("", skills) : undefined,
      senses: L("", senses),
      languages: L("", languages),
      challengeRating: String(cr),
      proficiencyBonus: pb ? `+${pb}` : undefined,
      traits: [],
      actions,
      bonusActions: [],
      reactions: [],
      legendaryActions: [],
      description: L(
        "",
        `From Monster Manual (book p.${entry.bookPage}). Stats OCR-extracted; verify vs PDF.`,
      ),
      source: "mm",
    });
  }

  const valid: Monster[] = [];
  for (const mon of monsters) {
    const r = MonsterSchema.safeParse(mon);
    if (r.success) valid.push(r.data);
  }
  return valid;
}

// Remove old parseMonsters function body usage — keep stub unused helpers quiet
void cleanTocName;
void isGarbageMonsterName;

// ─── MAIN ─────────────────────────────────────────────────

async function main() {
  console.log("Parsing PHB spells…");
  const spellText = await loadPages(PHB, 241, 345);
  const spells = parseSpells(spellText);
  await writeJson(path.join(CONTENT, "spells.json"), spells);
  console.log(`  → ${spells.length} spells`);

  console.log("Parsing PHB feats…");
  const featText = await loadPages(PHB, 201, 213);
  const feats = parseFeats(featText);
  await writeJson(path.join(CONTENT, "feats.json"), feats);
  console.log(`  → ${feats.length} feats`);

  console.log("Parsing PHB species…");
  const speciesText = await loadPages(PHB, 188, 199);
  const species = parseSpecies(speciesText);
  await writeJson(path.join(CONTENT, "species.json"), species);
  console.log(`  → ${species.length} species`);

  console.log("Parsing PHB backgrounds…");
  const bgText = await loadPages(PHB, 180, 199);
  const backgrounds = parseBackgrounds(bgText);
  await writeJson(path.join(CONTENT, "backgrounds.json"), backgrounds);
  console.log(`  → ${backgrounds.length} backgrounds`);

  console.log("Parsing PHB classes…");
  const classes = await parseClasses();
  await fs.rm(path.join(CONTENT, "classes"), { recursive: true, force: true });
  await fs.mkdir(path.join(CONTENT, "classes"), { recursive: true });
  for (const c of classes) {
    await writeJson(path.join(CONTENT, "classes", `${c.slug}.json`), c);
  }
  console.log(`  → ${classes.length} classes`);

  console.log("Parsing PHB weapons…");
  const weapons = parseWeapons();
  await writeJson(path.join(CONTENT, "weapons.json"), weapons);
  console.log(`  → ${weapons.length} weapons`);

  console.log("Parsing PHB equipment…");
  const equipment = await parseEquipment();
  await writeJson(path.join(CONTENT, "equipment.json"), equipment);
  console.log(`  → ${equipment.length} equipment`);

  console.log("Parsing MM monsters (TOC + OCR stats)…");
  const monsters = await parseMonstersFromToc();
  await fs.rm(path.join(CONTENT, "monsters"), { recursive: true, force: true });
  await fs.mkdir(path.join(CONTENT, "monsters"), { recursive: true });
  for (const mon of monsters) {
    await writeJson(path.join(CONTENT, "monsters", `${mon.slug}.json`), mon);
  }
  console.log(`  → ${monsters.length} monsters`);

  console.log("\nDone. Run: npm run content:validate");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
