export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

export type AbilityBlock = {
  score: number;
  proficientSave: boolean;
  skills: Record<string, boolean>;
};

export type AttackRow = {
  id: string;
  name: string;
  attackBonus: string;
  damage: string;
  notes: string;
  /** slug from weapons / spells, optional */
  refType?: "weapon" | "spell" | "custom";
  refSlug?: string;
};

export type SpellRow = {
  id: string;
  level: number;
  name: string;
  castingTime: string;
  range: string;
  concentration: boolean;
  ritual: boolean;
  material: boolean;
  /** Whether this spell is currently prepared (cantrips usually stay prepared). */
  prepared: boolean;
  notes: string;
  spellSlug?: string;
};

export type CompendiumRef = {
  type: "spell" | "weapon" | "armor" | "equipment" | "feat";
  slug: string;
  name: string;
};

export type SpellSlots = {
  total: number;
  used: number;
};

export type CharacterSheet = {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  photoUrl: string;

  // Header
  name: string;
  background: string;
  backgroundSlug?: string;
  className: string;
  classSlug?: string;
  subclass: string;
  species: string;
  speciesSlug?: string;
  level: number;
  xp: number;

  abilities: Record<AbilityKey, AbilityBlock>;

  armorClass: number;
  shield: boolean;
  hpCurrent: number;
  hpMax: number;
  hpTemp: number;
  hitDiceSpent: number;
  hitDiceMax: string;
  deathSuccesses: number;
  deathFailures: number;
  proficiencyBonus: number;
  initiative: number;
  speed: string;
  size: string;
  passivePerception: number;
  heroicInspiration: boolean;

  attacks: AttackRow[];
  classFeatures: string;
  speciesTraits: string;
  featsText: string;
  featRefs: CompendiumRef[];

  armorTraining: {
    light: boolean;
    medium: boolean;
    heavy: boolean;
    shields: boolean;
  };
  weaponsProf: string;
  toolsProf: string;

  spellAbility: AbilityKey | "";
  spellMod: number;
  spellSaveDc: number;
  spellAttack: number;
  spellSlots: Record<string, SpellSlots>; // "1".."9"
  /** Max number of prepared spells (level 1+). Cantrips do not count. */
  preparedSpellsMax: number;
  spells: SpellRow[];

  appearance: string;
  backstory: string;
  extras: string;
  alignment: string;
  languages: string;
  equipmentText: string;
  equipmentRefs: CompendiumRef[];
  armorRefs: CompendiumRef[];
  attunement: [boolean, boolean, boolean];
  coins: {
    cp: number;
    sp: number;
    ep: number;
    gp: number;
    pp: number;
  };
};

const emptyAbility = (skills: string[]): AbilityBlock => ({
  score: 10,
  proficientSave: false,
  skills: Object.fromEntries(skills.map((s) => [s, false])),
});

export function emptySpellSlots(): Record<string, SpellSlots> {
  const slots: Record<string, SpellSlots> = {};
  for (let i = 1; i <= 9; i++) slots[String(i)] = { total: 0, used: 0 };
  return slots;
}

export function createEmptyCharacter(userId: string): CharacterSheet {
  const now = new Date().toISOString();
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return {
    id,
    userId,
    createdAt: now,
    updatedAt: now,
    photoUrl: "",
    name: "",
    background: "",
    className: "",
    subclass: "",
    species: "",
    level: 1,
    xp: 0,
    abilities: {
      str: emptyAbility(["atletismo"]),
      dex: emptyAbility(["acrobacias", "juegoDeManos", "sigilo"]),
      con: emptyAbility([]),
      int: emptyAbility([
        "arcano",
        "historia",
        "investigacion",
        "naturaleza",
        "religion",
      ]),
      wis: emptyAbility([
        "medicina",
        "percepcion",
        "perspicacia",
        "supervivencia",
        "tratoAnimales",
      ]),
      cha: emptyAbility(["engano", "interpretacion", "intimidacion", "persuasion"]),
    },
    armorClass: 10,
    shield: false,
    hpCurrent: 0,
    hpMax: 0,
    hpTemp: 0,
    hitDiceSpent: 0,
    hitDiceMax: "1d8",
    deathSuccesses: 0,
    deathFailures: 0,
    proficiencyBonus: 2,
    initiative: 0,
    speed: "9 m",
    size: "Mediano",
    passivePerception: 10,
    heroicInspiration: false,
    attacks: [],
    classFeatures: "",
    speciesTraits: "",
    featsText: "",
    featRefs: [],
    armorTraining: {
      light: false,
      medium: false,
      heavy: false,
      shields: false,
    },
    weaponsProf: "",
    toolsProf: "",
    spellAbility: "",
    spellMod: 0,
    spellSaveDc: 8,
    spellAttack: 0,
    spellSlots: emptySpellSlots(),
    preparedSpellsMax: 0,
    spells: [],
    appearance: "",
    backstory: "",
    extras: "",
    alignment: "",
    languages: "",
    equipmentText: "",
    equipmentRefs: [],
    armorRefs: [],
    attunement: [false, false, false],
    coins: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
  };
}

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/** Backfill fields added after characters were already saved. */
export function normalizeCharacterSheet(sheet: CharacterSheet): CharacterSheet {
  return {
    ...sheet,
    preparedSpellsMax: sheet.preparedSpellsMax ?? 0,
    spells: (sheet.spells ?? []).map((sp) => ({
      ...sp,
      prepared: sp.prepared ?? false,
    })),
  };
}
