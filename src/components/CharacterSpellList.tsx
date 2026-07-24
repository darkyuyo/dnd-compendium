"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { FilterChips } from "@/components/FilterChips";
import type { SpellRow } from "@/lib/characterTypes";

function inputClass() {
  return "w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]";
}

function NumberInput({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(String(value));

  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  return (
    <input
      type="text"
      inputMode="numeric"
      className={className}
      value={focused ? text : String(value)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        const n = Number(text);
        onChange(Number.isFinite(n) ? n : 0);
      }}
      onChange={(e) => {
        setText(e.target.value);
        const n = Number(e.target.value);
        if (e.target.value !== "" && Number.isFinite(n)) onChange(n);
      }}
    />
  );
}

function reorderSpells(spells: SpellRow[], fromId: string, toId: string): SpellRow[] {
  const from = spells.findIndex((s) => s.id === fromId);
  const to = spells.findIndex((s) => s.id === toId);
  if (from === -1 || to === -1 || from === to) return spells;
  const next = [...spells];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

type Props = {
  spells: SpellRow[];
  onChange: (spells: SpellRow[]) => void;
  locale: string;
};

export function CharacterSpellList({ spells, onChange, locale }: Props) {
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [preparedFilter, setPreparedFilter] = useState("all");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const filtersActive =
    query.trim() !== "" || levelFilter !== "all" || preparedFilter !== "all";

  const filteredSpells = useMemo(() => {
    const q = query.trim().toLowerCase();
    return spells.filter((sp) => {
      if (q && !sp.name.toLowerCase().includes(q)) return false;
      if (levelFilter !== "all" && sp.level !== Number(levelFilter)) return false;
      if (preparedFilter === "prepared" && !(sp.prepared || sp.level === 0)) return false;
      if (preparedFilter === "unprepared" && sp.level > 0 && sp.prepared) return false;
      return true;
    });
  }, [spells, query, levelFilter, preparedFilter]);

  const updateSpell = (id: string, patch: Partial<SpellRow>) => {
    onChange(spells.map((sp) => (sp.id === id ? { ...sp, ...patch } : sp)));
  };

  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    onChange(reorderSpells(spells, draggingId, targetId));
    setDraggingId(null);
    setDropTargetId(null);
  };

  return (
    <div className="space-y-3">
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Buscar por nombre…"
      />
      <FilterChips
        label="Nivel"
        allLabel="Todos"
        value={levelFilter}
        onChange={setLevelFilter}
        options={[
          { value: "0", label: "Trucos" },
          ...Array.from({ length: 9 }, (_, i) => ({
            value: String(i + 1),
            label: `Nivel ${i + 1}`,
          })),
        ]}
      />
      <FilterChips
        label="Preparado"
        allLabel="Todos"
        value={preparedFilter}
        onChange={setPreparedFilter}
        options={[
          { value: "prepared", label: "Preparados" },
          { value: "unprepared", label: "No preparados" },
        ]}
      />
      {filtersActive ? (
        <p className="text-xs text-[var(--muted)]">
          Limpia los filtros para reordenar conjuros.
        </p>
      ) : null}
      {filteredSpells.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Ningún conjuro coincide con los filtros.</p>
      ) : (
        <div className="space-y-2">
          {filteredSpells.map((sp) => (
            <div
              key={sp.id}
              onDragOver={(e) => {
                if (filtersActive || !draggingId || draggingId === sp.id) return;
                e.preventDefault();
                setDropTargetId(sp.id);
              }}
              onDragLeave={() => {
                if (dropTargetId === sp.id) setDropTargetId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (!filtersActive) handleDrop(sp.id);
              }}
              className={`space-y-2 rounded-lg border p-2 transition ${
                sp.level === 0 || sp.prepared
                  ? "border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_14%,var(--surface))]"
                  : "border-[var(--border)] bg-[var(--surface)]"
              } ${draggingId === sp.id ? "opacity-50" : ""} ${
                dropTargetId === sp.id ? "ring-2 ring-[var(--accent)]" : ""
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                {!filtersActive ? (
                  <button
                    type="button"
                    draggable
                    className="cursor-grab touch-none rounded px-1 py-2 text-[var(--muted)] active:cursor-grabbing"
                    aria-label="Arrastrar para reordenar"
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      setDraggingId(sp.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDropTargetId(null);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                      aria-hidden
                    >
                      <path d="M7 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM7 10a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM7 16a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM13 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM13 10a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM13 16a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
                    </svg>
                  </button>
                ) : null}
                {sp.level > 0 ? (
                  <label className="flex shrink-0 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={sp.prepared ?? false}
                      onChange={(e) => updateSpell(sp.id, { prepared: e.target.checked })}
                    />
                    Preparado
                  </label>
                ) : null}
                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-5">
                  <NumberInput
                    className={inputClass()}
                    value={sp.level}
                    onChange={(level) =>
                      updateSpell(sp.id, {
                        level,
                        prepared: level > 0 ? sp.prepared : false,
                      })
                    }
                  />
                  <input
                    className={`${inputClass()} sm:col-span-2`}
                    value={sp.name}
                    onChange={(e) => updateSpell(sp.id, { name: e.target.value })}
                  />
                  <input
                    className={inputClass()}
                    placeholder="Tiempo"
                    value={sp.castingTime}
                    onChange={(e) => updateSpell(sp.id, { castingTime: e.target.value })}
                  />
                  <input
                    className={inputClass()}
                    placeholder="Alcance"
                    value={sp.range}
                    onChange={(e) => updateSpell(sp.id, { range: e.target.value })}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={sp.concentration}
                      onChange={(e) => updateSpell(sp.id, { concentration: e.target.checked })}
                    />
                    C
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={sp.ritual}
                      onChange={(e) => updateSpell(sp.id, { ritual: e.target.checked })}
                    />
                    R
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={sp.material}
                      onChange={(e) => updateSpell(sp.id, { material: e.target.checked })}
                    />
                    M
                  </label>
                  {sp.spellSlug ? (
                    <a
                      href={`/${locale}/spells/${sp.spellSlug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--accent)] underline"
                    >
                      Info
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="text-red-600"
                    onClick={() => onChange(spells.filter((x) => x.id !== sp.id))}
                  >
                    Quitar
                  </button>
                </div>
              </div>
              <textarea
                className={`${inputClass()} min-h-16`}
                placeholder="Notas del conjuro…"
                value={sp.notes}
                onChange={(e) => updateSpell(sp.id, { notes: e.target.value })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
