"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { CompendiumPicker } from "@/components/CompendiumPicker";
import {
  abilityModifier,
  type AbilityKey,
  type CharacterSheet,
  type CompendiumRef,
} from "@/lib/characterTypes";

const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: "Fuerza",
  dex: "Destreza",
  con: "Constitución",
  int: "Inteligencia",
  wis: "Sabiduría",
  cha: "Carisma",
};

const SKILL_LABELS: Record<string, string> = {
  atletismo: "Atletismo",
  acrobacias: "Acrobacias",
  juegoDeManos: "Juego de manos",
  sigilo: "Sigilo",
  arcano: "Conocimiento arcano",
  historia: "Historia",
  investigacion: "Investigación",
  naturaleza: "Naturaleza",
  religion: "Religión",
  medicina: "Medicina",
  percepcion: "Percepción",
  perspicacia: "Perspicacia",
  supervivencia: "Supervivencia",
  tratoAnimales: "Trato con animales",
  engano: "Engaño",
  interpretacion: "Interpretación",
  intimidacion: "Intimidación",
  persuasion: "Persuasión",
};

type PickerState = {
  kind:
    | "spells"
    | "weapons"
    | "armor"
    | "equipment"
    | "feats"
    | "classes"
    | "species"
    | "backgrounds";
  title: string;
  onSelect: (item: { slug: string; name: string; subtitle: string; href: string }) => void;
} | null;

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-xs font-semibold uppercase tracking-wide text-[var(--muted)] ${className}`}>
      {label}
      <div className="mt-1 font-normal normal-case tracking-normal text-[var(--foreground)]">
        {children}
      </div>
    </label>
  );
}

function inputClass() {
  return "w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]";
}

/** Numeric field that allows clearing 0 and typing over it without leading zeros. */
function NumberInput({
  value,
  onChange,
  className,
  min,
  max,
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  min?: number;
  max?: number;
}) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(String(value));

  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  function clamp(n: number) {
    let next = n;
    if (min != null) next = Math.max(min, next);
    if (max != null) next = Math.min(max, next);
    return next;
  }

  function parseAndCommit(raw: string, keepDraft: boolean) {
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed === "-") {
      onChange(clamp(0));
      if (!keepDraft) setText("0");
      return;
    }
    const n = Number(trimmed);
    if (!Number.isFinite(n)) {
      if (!keepDraft) setText(String(value));
      return;
    }
    const next = clamp(n);
    onChange(next);
    if (!keepDraft) setText(String(next));
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      className={className}
      value={text}
      onFocus={(e) => {
        setFocused(true);
        setText(String(value));
        e.target.select();
      }}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw !== "" && raw !== "-" && !/^-?\d*$/.test(raw)) return;
        setText(raw);
        if (raw !== "" && raw !== "-") {
          const n = Number(raw);
          if (Number.isFinite(n)) onChange(clamp(n));
        }
      }}
      onBlur={() => {
        setFocused(false);
        parseAndCommit(text, false);
      }}
    />
  );
}

export function CharacterSheetEditor({
  initial,
  locale,
}: {
  initial: CharacterSheet;
  locale: string;
}) {
  const router = useRouter();
  const [sheet, setSheet] = useState(initial);
  const [tab, setTab] = useState<"combat" | "magic">("combat");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [picker, setPicker] = useState<PickerState>(null);

  const update = <K extends keyof CharacterSheet>(key: K, value: CharacterSheet[K]) => {
    setSheet((s) => ({ ...s, [key]: value }));
  };

  async function save() {
    setSaving(true);
    setMessage("");
    const res = await fetch(`/api/characters/${sheet.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sheet),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("No se pudo guardar");
      return;
    }
    const data = await res.json();
    setSheet(data.character);
    setMessage("Guardado");
  }

  async function onPhoto(file: File | null) {
    if (!file) return;
    const form = new FormData();
    form.append("photo", file);
    const res = await fetch(`/api/characters/${sheet.id}/photo`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      setMessage("Error al subir la foto");
      return;
    }
    const data = await res.json();
    setSheet(data.character);
    setMessage("Foto actualizada");
  }

  async function removeCharacter() {
    if (!confirm("¿Borrar este personaje?")) return;
    await fetch(`/api/characters/${sheet.id}`, { method: "DELETE" });
    router.push("/characters");
    router.refresh();
  }

  function addRef(
    key: "featRefs" | "equipmentRefs" | "armorRefs",
    type: CompendiumRef["type"],
    item: { slug: string; name: string },
  ) {
    setSheet((s) => {
      const list = s[key];
      if (list.some((r) => r.slug === item.slug)) return s;
      return {
        ...s,
        [key]: [...list, { type, slug: item.slug, name: item.name }],
      };
    });
  }

  const abilityKeys = useMemo(
    () => Object.keys(ABILITY_LABELS) as AbilityKey[],
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/characters" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
            ← Mis personajes
          </Link>
          <h1 className="font-display text-2xl font-bold text-[var(--accent)]">
            {sheet.name || "Nuevo personaje"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-[var(--accent-fg)] disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={removeCharacter}
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700"
          >
            Borrar
          </button>
        </div>
      </div>
      {message ? (
        <p className="text-sm text-[var(--muted)]">{message}</p>
      ) : null}

      {/* Header */}
      <section className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Nombre del personaje">
          <input className={inputClass()} value={sheet.name} onChange={(e) => update("name", e.target.value)} />
        </Field>
        <Field label="Trasfondo">
          <div className="flex gap-1">
            <input className={inputClass()} value={sheet.background} onChange={(e) => update("background", e.target.value)} />
            <button type="button" className="shrink-0 rounded-md border border-[var(--border)] px-2 text-xs" onClick={() => setPicker({
              kind: "backgrounds",
              title: "Elegir origen",
              onSelect: (item) => {
                update("background", item.name);
                update("backgroundSlug", item.slug);
              },
            })}>+</button>
          </div>
        </Field>
        <Field label="Clase">
          <div className="flex gap-1">
            <input className={inputClass()} value={sheet.className} onChange={(e) => update("className", e.target.value)} />
            <button type="button" className="shrink-0 rounded-md border border-[var(--border)] px-2 text-xs" onClick={() => setPicker({
              kind: "classes",
              title: "Elegir clase",
              onSelect: (item) => {
                update("className", item.name);
                update("classSlug", item.slug);
              },
            })}>+</button>
          </div>
        </Field>
        <Field label="Especie">
          <div className="flex gap-1">
            <input className={inputClass()} value={sheet.species} onChange={(e) => update("species", e.target.value)} />
            <button type="button" className="shrink-0 rounded-md border border-[var(--border)] px-2 text-xs" onClick={() => setPicker({
              kind: "species",
              title: "Elegir especie",
              onSelect: (item) => {
                update("species", item.name);
                update("speciesSlug", item.slug);
              },
            })}>+</button>
          </div>
        </Field>
        <Field label="Subclase">
          <input className={inputClass()} value={sheet.subclass} onChange={(e) => update("subclass", e.target.value)} />
        </Field>
        <Field label="Nivel">
          <NumberInput className={inputClass()} value={sheet.level} onChange={(n) => update("level", n)} />
        </Field>
        <Field label="PX">
          <NumberInput className={inputClass()} value={sheet.xp} onChange={(n) => update("xp", n)} />
        </Field>
      </section>

      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-3">
        <button
          type="button"
          onClick={() => setTab("combat")}
          className={`rounded-md px-3 py-1.5 text-sm ${tab === "combat" ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "bg-[var(--surface-2)]"}`}
        >
          Combate
        </button>
        <button
          type="button"
          onClick={() => setTab("magic")}
          className={`rounded-md px-3 py-1.5 text-sm ${tab === "magic" ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "bg-[var(--surface-2)]"}`}
        >
          Magia y equipo
        </button>
      </div>

      {tab === "combat" ? (
        <>
          {/* Abilities */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {abilityKeys.map((key) => {
              const block = sheet.abilities[key];
              const mod = abilityModifier(block.score);
              return (
                <div key={key} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-[var(--accent)]">
                      {ABILITY_LABELS[key]}
                    </h3>
                    <span className="text-lg font-bold">
                      {mod >= 0 ? `+${mod}` : mod}
                    </span>
                  </div>
                  <Field label="Puntuación" className="mt-2">
                    <NumberInput
                      className={inputClass()}
                      value={block.score}
                      onChange={(n) =>
                        setSheet((s) => ({
                          ...s,
                          abilities: {
                            ...s.abilities,
                            [key]: { ...block, score: n },
                          },
                        }))
                      }
                    />
                  </Field>
                  <label className="mt-2 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={block.proficientSave}
                      onChange={(e) =>
                        setSheet((s) => ({
                          ...s,
                          abilities: {
                            ...s.abilities,
                            [key]: { ...block, proficientSave: e.target.checked },
                          },
                        }))
                      }
                    />
                    Tirada de salvación
                  </label>
                  <div className="mt-2 space-y-1">
                    {Object.keys(block.skills).map((skill) => (
                      <label key={skill} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={block.skills[skill]}
                          onChange={(e) =>
                            setSheet((s) => ({
                              ...s,
                              abilities: {
                                ...s.abilities,
                                [key]: {
                                  ...block,
                                  skills: {
                                    ...block.skills,
                                    [skill]: e.target.checked,
                                  },
                                },
                              },
                            }))
                          }
                        />
                        {SKILL_LABELS[skill] || skill}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>

          {/* Combat stats */}
          <section className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Clase de Armadura">
              <NumberInput className={inputClass()} value={sheet.armorClass} onChange={(n) => update("armorClass", n)} />
            </Field>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input type="checkbox" checked={sheet.shield} onChange={(e) => update("shield", e.target.checked)} />
              Escudo
            </label>
            <Field label="PG actuales">
              <NumberInput className={inputClass()} value={sheet.hpCurrent} onChange={(n) => update("hpCurrent", n)} />
            </Field>
            <Field label="PG máx.">
              <NumberInput className={inputClass()} value={sheet.hpMax} onChange={(n) => update("hpMax", n)} />
            </Field>
            <Field label="PG temp.">
              <NumberInput className={inputClass()} value={sheet.hpTemp} onChange={(n) => update("hpTemp", n)} />
            </Field>
            <Field label="Dados de golpe (máx.)">
              <input className={inputClass()} value={sheet.hitDiceMax} onChange={(e) => update("hitDiceMax", e.target.value)} />
            </Field>
            <Field label="Dados gastados">
              <NumberInput className={inputClass()} value={sheet.hitDiceSpent} onChange={(n) => update("hitDiceSpent", n)} />
            </Field>
            <Field label="Bonif. competencia">
              <NumberInput className={inputClass()} value={sheet.proficiencyBonus} onChange={(n) => update("proficiencyBonus", n)} />
            </Field>
            <Field label="Iniciativa">
              <NumberInput className={inputClass()} value={sheet.initiative} onChange={(n) => update("initiative", n)} />
            </Field>
            <Field label="Velocidad">
              <input className={inputClass()} value={sheet.speed} onChange={(e) => update("speed", e.target.value)} />
            </Field>
            <Field label="Tamaño">
              <input className={inputClass()} value={sheet.size} onChange={(e) => update("size", e.target.value)} />
            </Field>
            <Field label="Percepción pasiva">
              <NumberInput className={inputClass()} value={sheet.passivePerception} onChange={(n) => update("passivePerception", n)} />
            </Field>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input type="checkbox" checked={sheet.heroicInspiration} onChange={(e) => update("heroicInspiration", e.target.checked)} />
              Inspiración heroica
            </label>
            <Field label="Salvaciones muerte (éxitos)">
              <NumberInput min={0} max={3} className={inputClass()} value={sheet.deathSuccesses} onChange={(n) => update("deathSuccesses", n)} />
            </Field>
            <Field label="Salvaciones muerte (fallos)">
              <NumberInput min={0} max={3} className={inputClass()} value={sheet.deathFailures} onChange={(n) => update("deathFailures", n)} />
            </Field>
          </section>

          {/* Attacks */}
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-[var(--accent)]">
                Armas y trucos de daño
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-md border border-[var(--border)] px-2 py-1 text-xs"
                  onClick={() =>
                    setPicker({
                      kind: "weapons",
                      title: "Añadir arma",
                      onSelect: (item) => {
                        setSheet((s) => ({
                          ...s,
                          attacks: [
                            ...s.attacks,
                            {
                              id: crypto.randomUUID(),
                              name: item.name,
                              attackBonus: "",
                              damage: item.subtitle,
                              notes: "",
                              refType: "weapon",
                              refSlug: item.slug,
                            },
                          ],
                        }));
                      },
                    })
                  }
                >
                  + Arma
                </button>
                <button
                  type="button"
                  className="rounded-md border border-[var(--border)] px-2 py-1 text-xs"
                  onClick={() =>
                    setSheet((s) => ({
                      ...s,
                      attacks: [
                        ...s.attacks,
                        {
                          id: crypto.randomUUID(),
                          name: "",
                          attackBonus: "",
                          damage: "",
                          notes: "",
                          refType: "custom",
                        },
                      ],
                    }))
                  }
                >
                  + Fila
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {sheet.attacks.map((row, idx) => (
                <div key={row.id} className="grid gap-2 rounded-lg border border-[var(--border)] p-2 sm:grid-cols-5">
                  <input className={inputClass()} placeholder="Nombre" value={row.name} onChange={(e) => {
                    const attacks = [...sheet.attacks];
                    attacks[idx] = { ...row, name: e.target.value };
                    update("attacks", attacks);
                  }} />
                  <input className={inputClass()} placeholder="Bonif. atq./CD" value={row.attackBonus} onChange={(e) => {
                    const attacks = [...sheet.attacks];
                    attacks[idx] = { ...row, attackBonus: e.target.value };
                    update("attacks", attacks);
                  }} />
                  <input className={inputClass()} placeholder="Daño y tipo" value={row.damage} onChange={(e) => {
                    const attacks = [...sheet.attacks];
                    attacks[idx] = { ...row, damage: e.target.value };
                    update("attacks", attacks);
                  }} />
                  <input className={inputClass()} placeholder="Notas" value={row.notes} onChange={(e) => {
                    const attacks = [...sheet.attacks];
                    attacks[idx] = { ...row, notes: e.target.value };
                    update("attacks", attacks);
                  }} />
                  <div className="flex gap-1">
                    {row.refSlug ? (
                      <a href={`/${locale}/weapons/${row.refSlug}`} target="_blank" rel="noreferrer" className="rounded-md border border-[var(--border)] px-2 py-1 text-xs">Info</a>
                    ) : null}
                    <button type="button" className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700" onClick={() => update("attacks", sheet.attacks.filter((a) => a.id !== row.id))}>Quitar</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-3 lg:grid-cols-3">
            <Field label="Rasgos de clase">
              <textarea className={`${inputClass()} min-h-36`} value={sheet.classFeatures} onChange={(e) => update("classFeatures", e.target.value)} />
            </Field>
            <Field label="Atributos de especie">
              <textarea className={`${inputClass()} min-h-36`} value={sheet.speciesTraits} onChange={(e) => update("speciesTraits", e.target.value)} />
            </Field>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Dotes</span>
                <button type="button" className="text-xs text-[var(--accent)] underline" onClick={() => setPicker({
                  kind: "feats",
                  title: "Añadir dote",
                  onSelect: (item) => addRef("featRefs", "feat", item),
                })}>+ Comp.</button>
              </div>
              <textarea className={`${inputClass()} min-h-24`} value={sheet.featsText} onChange={(e) => update("featsText", e.target.value)} />
              <ul className="mt-2 space-y-1">
                {sheet.featRefs.map((f) => (
                  <li key={f.slug} className="flex items-center justify-between text-sm">
                    <a className="text-[var(--accent)] underline" href={`/${locale}/feats/${f.slug}`} target="_blank" rel="noreferrer">{f.name}</a>
                    <button type="button" className="text-xs text-red-600" onClick={() => update("featRefs", sheet.featRefs.filter((x) => x.slug !== f.slug))}>Quitar</button>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--muted)]">Entrenamiento con armaduras</p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                {(["light", "medium", "heavy", "shields"] as const).map((k) => (
                  <label key={k} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={sheet.armorTraining[k]}
                      onChange={(e) =>
                        update("armorTraining", {
                          ...sheet.armorTraining,
                          [k]: e.target.checked,
                        })
                      }
                    />
                    {{ light: "Ligeras", medium: "Medias", heavy: "Pesadas", shields: "Escudos" }[k]}
                  </label>
                ))}
              </div>
            </div>
            <Field label="Armas (competencias)">
              <input className={inputClass()} value={sheet.weaponsProf} onChange={(e) => update("weaponsProf", e.target.value)} />
            </Field>
            <Field label="Herramientas" className="sm:col-span-2">
              <input className={inputClass()} value={sheet.toolsProf} onChange={(e) => update("toolsProf", e.target.value)} />
            </Field>
          </section>
        </>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-3">
                <Field label="Aptitud mágica">
                  <select
                    className={inputClass()}
                    value={sheet.spellAbility}
                    onChange={(e) => update("spellAbility", e.target.value as AbilityKey | "")}
                  >
                    <option value="">—</option>
                    {abilityKeys.map((k) => (
                      <option key={k} value={k}>{ABILITY_LABELS[k]}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Mod. aptitud mágica">
                  <NumberInput className={inputClass()} value={sheet.spellMod} onChange={(n) => update("spellMod", n)} />
                </Field>
                <Field label="CD salvación conjuros">
                  <NumberInput className={inputClass()} value={sheet.spellSaveDc} onChange={(n) => update("spellSaveDc", n)} />
                </Field>
                <Field label="Bonif. ataque conjuros">
                  <NumberInput className={inputClass()} value={sheet.spellAttack} onChange={(n) => update("spellAttack", n)} />
                </Field>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <h2 className="mb-2 font-display font-bold text-[var(--accent)]">Espacios de conjuro</h2>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
                  {Array.from({ length: 9 }, (_, i) => String(i + 1)).map((lvl) => (
                    <div key={lvl} className="rounded-md border border-[var(--border)] p-2 text-center">
                      <div className="text-xs font-bold">N{lvl}</div>
                      <label className="mt-1 block text-[10px] text-[var(--muted)]">
                        Total
                        <NumberInput
                          className={`${inputClass()} mt-0.5`}
                          value={sheet.spellSlots[lvl]?.total ?? 0}
                          onChange={(n) =>
                            update("spellSlots", {
                              ...sheet.spellSlots,
                              [lvl]: {
                                ...sheet.spellSlots[lvl],
                                total: n,
                                used: sheet.spellSlots[lvl]?.used ?? 0,
                              },
                            })
                          }
                        />
                      </label>
                      <label className="mt-1 block text-[10px] text-[var(--muted)]">
                        Gastados
                        <NumberInput
                          className={`${inputClass()} mt-0.5`}
                          value={sheet.spellSlots[lvl]?.used ?? 0}
                          onChange={(n) =>
                            update("spellSlots", {
                              ...sheet.spellSlots,
                              [lvl]: {
                                ...sheet.spellSlots[lvl],
                                used: n,
                                total: sheet.spellSlots[lvl]?.total ?? 0,
                              },
                            })
                          }
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display font-bold text-[var(--accent)]">
                    Trucos y conjuros preparados
                  </h2>
                  <button
                    type="button"
                    className="rounded-md bg-[var(--accent)] px-2 py-1 text-xs font-semibold text-[var(--accent-fg)]"
                    onClick={() =>
                      setPicker({
                        kind: "spells",
                        title: "Añadir conjuro",
                        onSelect: (item) => {
                          const levelMatch = item.subtitle.match(/Nivel\s+(\d+)/i);
                          setSheet((s) => ({
                            ...s,
                            spells: [
                              ...s.spells,
                              {
                                id: crypto.randomUUID(),
                                level: levelMatch ? Number(levelMatch[1]) : 0,
                                name: item.name,
                                castingTime: "",
                                range: "",
                                concentration: false,
                                ritual: false,
                                material: false,
                                notes: "",
                                spellSlug: item.slug,
                              },
                            ],
                          }));
                        },
                      })
                    }
                  >
                    + Conjuro
                  </button>
                </div>
                <div className="space-y-2">
                  {sheet.spells.map((sp, idx) => (
                    <div key={sp.id} className="space-y-2 rounded-lg border border-[var(--border)] p-2">
                      <div className="grid gap-2 sm:grid-cols-6">
                        <NumberInput className={inputClass()} value={sp.level} onChange={(n) => {
                          const spells = [...sheet.spells];
                          spells[idx] = { ...sp, level: n };
                          update("spells", spells);
                        }} />
                        <input className={`${inputClass()} sm:col-span-2`} value={sp.name} onChange={(e) => {
                          const spells = [...sheet.spells];
                          spells[idx] = { ...sp, name: e.target.value };
                          update("spells", spells);
                        }} />
                        <input className={inputClass()} placeholder="Tiempo" value={sp.castingTime} onChange={(e) => {
                          const spells = [...sheet.spells];
                          spells[idx] = { ...sp, castingTime: e.target.value };
                          update("spells", spells);
                        }} />
                        <input className={inputClass()} placeholder="Alcance" value={sp.range} onChange={(e) => {
                          const spells = [...sheet.spells];
                          spells[idx] = { ...sp, range: e.target.value };
                          update("spells", spells);
                        }} />
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <label className="flex items-center gap-1"><input type="checkbox" checked={sp.concentration} onChange={(e) => {
                            const spells = [...sheet.spells];
                            spells[idx] = { ...sp, concentration: e.target.checked };
                            update("spells", spells);
                          }} />C</label>
                          <label className="flex items-center gap-1"><input type="checkbox" checked={sp.ritual} onChange={(e) => {
                            const spells = [...sheet.spells];
                            spells[idx] = { ...sp, ritual: e.target.checked };
                            update("spells", spells);
                          }} />R</label>
                          <label className="flex items-center gap-1"><input type="checkbox" checked={sp.material} onChange={(e) => {
                            const spells = [...sheet.spells];
                            spells[idx] = { ...sp, material: e.target.checked };
                            update("spells", spells);
                          }} />M</label>
                          {sp.spellSlug ? (
                            <a href={`/${locale}/spells/${sp.spellSlug}`} target="_blank" rel="noreferrer" className="underline text-[var(--accent)]">Info</a>
                          ) : null}
                          <button type="button" className="text-red-600" onClick={() => update("spells", sheet.spells.filter((x) => x.id !== sp.id))}>Quitar</button>
                        </div>
                      </div>
                      <textarea
                        className={`${inputClass()} min-h-16`}
                        placeholder="Notas del conjuro…"
                        value={sp.notes}
                        onChange={(e) => {
                          const spells = [...sheet.spells];
                          spells[idx] = { ...sp, notes: e.target.value };
                          update("spells", spells);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <h2 className="mb-2 font-display font-bold text-[var(--accent)]">Aspecto</h2>
                <div className="mb-3 aspect-square overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
                  {sheet.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sheet.photoUrl} alt={sheet.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
                      Sin foto
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPhoto(e.target.files?.[0] ?? null)}
                  className="text-sm"
                />
                <Field label="Notas de aspecto" className="mt-3">
                  <textarea className={`${inputClass()} min-h-20`} value={sheet.appearance} onChange={(e) => update("appearance", e.target.value)} />
                </Field>
              </div>

              <Field label="Historia y personalidad">
                <textarea className={`${inputClass()} min-h-32`} value={sheet.backstory} onChange={(e) => update("backstory", e.target.value)} />
              </Field>
              <Field label="Extras">
                <textarea
                  className={`${inputClass()} min-h-40`}
                  placeholder="Notas libres, reglas de mesa, inventarios raros, recordatorios…"
                  value={sheet.extras ?? ""}
                  onChange={(e) => update("extras", e.target.value)}
                />
              </Field>
              <Field label="Alineamiento">
                <input className={inputClass()} value={sheet.alignment} onChange={(e) => update("alignment", e.target.value)} />
              </Field>
              <Field label="Idiomas">
                <input className={inputClass()} value={sheet.languages} onChange={(e) => update("languages", e.target.value)} />
              </Field>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-2 flex flex-wrap gap-2">
                  <h2 className="mr-auto font-display font-bold text-[var(--accent)]">Equipo</h2>
                  <button type="button" className="rounded-md border border-[var(--border)] px-2 py-1 text-xs" onClick={() => setPicker({
                    kind: "armor",
                    title: "Añadir armadura",
                    onSelect: (item) => addRef("armorRefs", "armor", item),
                  })}>+ Armadura</button>
                  <button type="button" className="rounded-md border border-[var(--border)] px-2 py-1 text-xs" onClick={() => setPicker({
                    kind: "equipment",
                    title: "Añadir equipo",
                    onSelect: (item) => addRef("equipmentRefs", "equipment", item),
                  })}>+ Equipo</button>
                </div>
                <textarea className={`${inputClass()} min-h-28`} value={sheet.equipmentText} onChange={(e) => update("equipmentText", e.target.value)} />
                <ul className="mt-2 space-y-1 text-sm">
                  {sheet.armorRefs.map((a) => (
                    <li key={a.slug} className="flex justify-between gap-2">
                      <a className="text-[var(--accent)] underline" href={`/${locale}/armor/${a.slug}`} target="_blank" rel="noreferrer">{a.name} (armadura)</a>
                      <button type="button" className="text-xs text-red-600" onClick={() => update("armorRefs", sheet.armorRefs.filter((x) => x.slug !== a.slug))}>Quitar</button>
                    </li>
                  ))}
                  {sheet.equipmentRefs.map((a) => (
                    <li key={a.slug} className="flex justify-between gap-2">
                      <a className="text-[var(--accent)] underline" href={`/${locale}/equipment/${a.slug}`} target="_blank" rel="noreferrer">{a.name}</a>
                      <button type="button" className="text-xs text-red-600" onClick={() => update("equipmentRefs", sheet.equipmentRefs.filter((x) => x.slug !== a.slug))}>Quitar</button>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex gap-3 text-sm">
                  {[0, 1, 2].map((i) => (
                    <label key={i} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={sheet.attunement[i]}
                        onChange={(e) => {
                          const next = [...sheet.attunement] as [boolean, boolean, boolean];
                          next[i] = e.target.checked;
                          update("attunement", next);
                        }}
                      />
                      Sint. {i + 1}
                    </label>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {([
                    ["cp", "PC"],
                    ["sp", "PP"],
                    ["ep", "PE"],
                    ["gp", "PO"],
                    ["pp", "PPT"],
                  ] as const).map(([key, label]) => (
                    <Field key={key} label={label}>
                      <NumberInput
                        className={inputClass()}
                        value={sheet.coins[key]}
                        onChange={(n) =>
                          update("coins", {
                            ...sheet.coins,
                            [key]: n,
                          })
                        }
                      />
                    </Field>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {picker ? (
        <CompendiumPicker
          open
          kind={picker.kind}
          locale={locale}
          title={picker.title}
          onClose={() => setPicker(null)}
          onSelect={picker.onSelect}
        />
      ) : null}
    </div>
  );
}
