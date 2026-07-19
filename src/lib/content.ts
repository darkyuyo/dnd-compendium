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
  type Monster,
  type Species,
  type Spell,
  type Weapon,
} from "@/lib/types";

const contentRoot = path.join(process.cwd(), "content");

async function readJsonFile<T>(filePath: string, schema: z.ZodType<T>): Promise<T> {
  const raw = await fs.readFile(filePath, "utf-8");
  return schema.parse(JSON.parse(raw));
}

async function readJsonArray<T>(
  filePath: string,
  schema: z.ZodType<T>,
): Promise<T[]> {
  const raw = await fs.readFile(filePath, "utf-8");
  return z.array(schema).parse(JSON.parse(raw));
}

async function readJsonDir<T>(
  dirPath: string,
  schema: z.ZodType<T>,
): Promise<T[]> {
  const entries = await fs.readdir(dirPath);
  const jsonFiles = entries.filter((f) => f.endsWith(".json")).sort();
  const items: T[] = [];
  for (const file of jsonFiles) {
    items.push(await readJsonFile(path.join(dirPath, file), schema));
  }
  return items;
}

export async function getSpells(): Promise<Spell[]> {
  return readJsonArray(path.join(contentRoot, "spells.json"), SpellSchema);
}

export async function getSpellBySlug(slug: string): Promise<Spell | undefined> {
  const spells = await getSpells();
  return spells.find((s) => s.slug === slug);
}

export async function getMonsters(): Promise<Monster[]> {
  return readJsonDir(path.join(contentRoot, "monsters"), MonsterSchema);
}

export async function getMonsterBySlug(
  slug: string,
): Promise<Monster | undefined> {
  const monsters = await getMonsters();
  return monsters.find((m) => m.slug === slug);
}

export async function getWeapons(): Promise<Weapon[]> {
  return readJsonArray(path.join(contentRoot, "weapons.json"), WeaponSchema);
}

export async function getWeaponBySlug(
  slug: string,
): Promise<Weapon | undefined> {
  const items = await getWeapons();
  return items.find((w) => w.slug === slug);
}

export async function getEquipment(): Promise<EquipmentItem[]> {
  return readJsonArray(
    path.join(contentRoot, "equipment.json"),
    EquipmentItemSchema,
  );
}

export async function getEquipmentBySlug(
  slug: string,
): Promise<EquipmentItem | undefined> {
  const items = await getEquipment();
  return items.find((e) => e.slug === slug);
}

export async function getClasses(): Promise<Class[]> {
  return readJsonDir(path.join(contentRoot, "classes"), ClassSchema);
}

export async function getClassBySlug(slug: string): Promise<Class | undefined> {
  const classes = await getClasses();
  return classes.find((c) => c.slug === slug);
}

export async function getSpecies(): Promise<Species[]> {
  return readJsonArray(path.join(contentRoot, "species.json"), SpeciesSchema);
}

export async function getSpeciesBySlug(
  slug: string,
): Promise<Species | undefined> {
  const items = await getSpecies();
  return items.find((s) => s.slug === slug);
}

export async function getBackgrounds(): Promise<Background[]> {
  return readJsonArray(
    path.join(contentRoot, "backgrounds.json"),
    BackgroundSchema,
  );
}

export async function getBackgroundBySlug(
  slug: string,
): Promise<Background | undefined> {
  const items = await getBackgrounds();
  return items.find((b) => b.slug === slug);
}

export async function getFeats(): Promise<Feat[]> {
  return readJsonArray(path.join(contentRoot, "feats.json"), FeatSchema);
}

export async function getFeatBySlug(slug: string): Promise<Feat | undefined> {
  const items = await getFeats();
  return items.find((f) => f.slug === slug);
}

export async function getGuideMarkdown(
  guide: "how-to-play" | "character-creation",
  locale: "es" | "en",
): Promise<string> {
  const filePath = path.join(
    contentRoot,
    "guides",
    `${guide}.${locale}.mdx`,
  );
  return fs.readFile(filePath, "utf-8");
}
