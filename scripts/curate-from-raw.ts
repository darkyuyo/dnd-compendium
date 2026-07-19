/**
 * Validate and merge curated JSON snippets into content/.
 *
 * After extracting PDFs to raw/, copy/paste or script-structure entries into
 * staging JSON files, then run this to validate against Zod schemas.
 *
 * Usage:
 *   npx tsx scripts/curate-from-raw.ts spells staging/spells.partial.json
 *   npx tsx scripts/curate-from-raw.ts monsters staging/monster-goblin.json --dir
 *   npx tsx scripts/curate-from-raw.ts validate-all
 */
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import {
  ArmorSchema,
  BackgroundSchema,
  ClassSchema,
  EquipmentItemSchema,
  FeatSchema,
  MonsterSchema,
  SpeciesSchema,
  SpellSchema,
  WeaponSchema,
} from "../src/lib/types";

type Section =
  | "spells"
  | "monsters"
  | "weapons"
  | "armor"
  | "equipment"
  | "classes"
  | "species"
  | "backgrounds"
  | "feats"
  | "validate-all";

const arraySections: Record<
  Exclude<Section, "monsters" | "classes" | "validate-all">,
  { file: string; schema: z.ZodType }
> = {
  spells: { file: "spells.json", schema: SpellSchema },
  weapons: { file: "weapons.json", schema: WeaponSchema },
  armor: { file: "armor.json", schema: ArmorSchema },
  equipment: { file: "equipment.json", schema: EquipmentItemSchema },
  species: { file: "species.json", schema: SpeciesSchema },
  backgrounds: { file: "backgrounds.json", schema: BackgroundSchema },
  feats: { file: "feats.json", schema: FeatSchema },
};

async function readJson(filePath: string): Promise<unknown> {
  return JSON.parse(await fs.readFile(filePath, "utf-8"));
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function byIdSlug<T extends { id: string; slug: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    map.set(item.slug, item);
  }
  return [...map.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

async function mergeArraySection(
  section: keyof typeof arraySections,
  incomingPath: string,
) {
  const { file, schema } = arraySections[section];
  const contentPath = path.join(process.cwd(), "content", file);
  const existing = z
    .array(schema)
    .parse(await readJson(contentPath).catch(() => []));
  const incomingRaw = await readJson(incomingPath);
  const incoming = z
    .array(schema)
    .parse(Array.isArray(incomingRaw) ? incomingRaw : [incomingRaw]);

  const merged = byIdSlug([...existing, ...incoming] as { id: string; slug: string }[]);
  // re-parse for type safety of write
  const validated = z.array(schema).parse(merged);
  await writeJson(contentPath, validated);
  console.log(
    `Merged ${incoming.length} into content/${file} (total ${validated.length})`,
  );
}

async function mergeDirItem(
  section: "monsters" | "classes",
  incomingPath: string,
  asDir: boolean,
) {
  const schema = section === "monsters" ? MonsterSchema : ClassSchema;
  const outDir = path.join(process.cwd(), "content", section);
  await fs.mkdir(outDir, { recursive: true });

  const files = asDir
    ? (await fs.readdir(incomingPath))
        .filter((f) => f.endsWith(".json"))
        .map((f) => path.join(incomingPath, f))
    : [incomingPath];

  for (const file of files) {
    const item = schema.parse(await readJson(file));
    const out = path.join(outDir, `${item.slug}.json`);
    await writeJson(out, item);
    console.log(`Wrote content/${section}/${item.slug}.json`);
  }
}

async function validateAll() {
  const content = path.join(process.cwd(), "content");
  for (const [section, meta] of Object.entries(arraySections)) {
    const data = await readJson(path.join(content, meta.file));
    z.array(meta.schema).parse(data);
    console.log(`OK ${section}`);
  }

  for (const section of ["monsters", "classes"] as const) {
    const schema = section === "monsters" ? MonsterSchema : ClassSchema;
    const dir = path.join(content, section);
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      schema.parse(await readJson(path.join(dir, file)));
    }
    console.log(`OK ${section}/ (${files.length} files)`);
  }
  console.log("All content validated.");
}

async function main() {
  const section = process.argv[2] as Section;
  const target = process.argv[3];
  const asDir = process.argv.includes("--dir");

  if (section === "validate-all") {
    await validateAll();
    return;
  }

  if (!section || !target) {
    console.error(`Usage:
  npx tsx scripts/curate-from-raw.ts <spells|weapons|equipment|species|backgrounds|feats> <partial.json>
  npx tsx scripts/curate-from-raw.ts <monsters|classes> <file-or-dir.json> [--dir]
  npx tsx scripts/curate-from-raw.ts validate-all`);
    process.exit(1);
  }

  if (section === "monsters" || section === "classes") {
    await mergeDirItem(section, target, asDir);
    return;
  }

  if (section in arraySections) {
    await mergeArraySection(
      section as keyof typeof arraySections,
      target,
    );
    return;
  }

  console.error(`Unknown section: ${section}`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
