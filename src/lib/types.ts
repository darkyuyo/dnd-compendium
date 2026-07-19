import { z } from "zod";

export const LocalizedStringSchema = z.object({
  es: z.string(),
  en: z.string(),
});

export type LocalizedString = z.infer<typeof LocalizedStringSchema>;

export const SourceSchema = z.enum(["phb2024", "mm", "other"]);
export type Source = z.infer<typeof SourceSchema>;

export const SpellSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: LocalizedStringSchema,
  level: z.number().int().min(0).max(9),
  school: LocalizedStringSchema,
  castingTime: LocalizedStringSchema,
  range: LocalizedStringSchema,
  components: z.string(),
  duration: LocalizedStringSchema,
  description: LocalizedStringSchema,
  classes: z.array(z.string()),
  source: SourceSchema,
});
export type Spell = z.infer<typeof SpellSchema>;

export const AbilityScoresSchema = z.object({
  str: z.number(),
  dex: z.number(),
  con: z.number(),
  int: z.number(),
  wis: z.number(),
  cha: z.number(),
});

export const MonsterActionSchema = z.object({
  name: LocalizedStringSchema,
  description: LocalizedStringSchema,
});

export const MonsterSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: LocalizedStringSchema,
  size: LocalizedStringSchema,
  type: LocalizedStringSchema,
  alignment: LocalizedStringSchema,
  armorClass: z.number(),
  hitPoints: z.string(),
  speed: LocalizedStringSchema,
  abilityScores: AbilityScoresSchema,
  skills: LocalizedStringSchema.optional(),
  senses: LocalizedStringSchema,
  languages: LocalizedStringSchema,
  challengeRating: z.string(),
  proficiencyBonus: z.string().optional(),
  traits: z.array(MonsterActionSchema).default([]),
  actions: z.array(MonsterActionSchema).default([]),
  bonusActions: z.array(MonsterActionSchema).default([]),
  reactions: z.array(MonsterActionSchema).default([]),
  legendaryActions: z.array(MonsterActionSchema).default([]),
  description: LocalizedStringSchema.optional(),
  source: SourceSchema,
});
export type Monster = z.infer<typeof MonsterSchema>;

export const WeaponSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: LocalizedStringSchema,
  category: LocalizedStringSchema,
  damage: z.string(),
  damageType: LocalizedStringSchema,
  properties: z.array(LocalizedStringSchema).default([]),
  weight: z.string().optional(),
  cost: z.string().optional(),
  mastery: LocalizedStringSchema.optional(),
  description: LocalizedStringSchema.optional(),
  source: SourceSchema,
});
export type Weapon = z.infer<typeof WeaponSchema>;

export const EquipmentItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: LocalizedStringSchema,
  category: LocalizedStringSchema,
  cost: z.string().optional(),
  weight: z.string().optional(),
  description: LocalizedStringSchema,
  source: SourceSchema,
});
export type EquipmentItem = z.infer<typeof EquipmentItemSchema>;

export const ClassFeatureSchema = z.object({
  level: z.number().int(),
  name: LocalizedStringSchema,
  description: LocalizedStringSchema,
});

export const ClassSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: LocalizedStringSchema,
  hitDie: z.string(),
  primaryAbility: LocalizedStringSchema,
  savingThrows: LocalizedStringSchema,
  armor: LocalizedStringSchema,
  weapons: LocalizedStringSchema,
  skills: LocalizedStringSchema,
  description: LocalizedStringSchema,
  features: z.array(ClassFeatureSchema).default([]),
  source: SourceSchema,
});
export type Class = z.infer<typeof ClassSchema>;

export const SpeciesTraitSchema = z.object({
  name: LocalizedStringSchema,
  description: LocalizedStringSchema,
});

export const SpeciesSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: LocalizedStringSchema,
  creatureType: LocalizedStringSchema,
  size: LocalizedStringSchema,
  speed: LocalizedStringSchema,
  description: LocalizedStringSchema,
  traits: z.array(SpeciesTraitSchema).default([]),
  source: SourceSchema,
});
export type Species = z.infer<typeof SpeciesSchema>;

export const BackgroundSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: LocalizedStringSchema,
  abilityScores: LocalizedStringSchema,
  feat: LocalizedStringSchema,
  skillProficiencies: LocalizedStringSchema,
  toolProficiencies: LocalizedStringSchema.optional(),
  equipment: LocalizedStringSchema,
  description: LocalizedStringSchema,
  source: SourceSchema,
});
export type Background = z.infer<typeof BackgroundSchema>;

export const FeatSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: LocalizedStringSchema,
  category: LocalizedStringSchema,
  prerequisite: LocalizedStringSchema.optional(),
  description: LocalizedStringSchema,
  source: SourceSchema,
});
export type Feat = z.infer<typeof FeatSchema>;
