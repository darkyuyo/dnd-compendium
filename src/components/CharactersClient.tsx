"use client";

import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";

type Card = {
  id: string;
  name: string;
  className: string;
  level: number;
  species: string;
  photoUrl: string;
  updatedAt: string;
};

export function CharactersClient({
  userName,
  initial,
}: {
  userName: string;
  initial: Card[];
}) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [creating, setCreating] = useState(false);

  async function create() {
    setCreating(true);
    const res = await fetch("/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Nuevo personaje" }),
    });
    setCreating(false);
    if (!res.ok) return;
    const data = await res.json();
    router.push(`/characters/${data.character.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted)]">Hola, {userName}</p>
          <h1 className="font-display text-3xl font-bold text-[var(--accent)]">
            Mis personajes
          </h1>
        </div>
        <button
          type="button"
          onClick={create}
          disabled={creating}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--accent-fg)] disabled:opacity-60"
        >
          {creating ? "Creando…" : "+ Crear personaje"}
        </button>
      </header>

      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-[var(--muted)]">
          Aún no tienes personajes. Crea el primero para rellenar la hoja.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <li key={c.id}>
              <Link
                href={`/characters/${c.id}`}
                className="block overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition hover:border-[var(--accent)]"
              >
                <div className="aspect-[4/3] bg-[var(--surface-2)]">
                  {c.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.photoUrl}
                      alt={c.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
                      Sin foto
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-display text-lg font-bold">{c.name}</h2>
                  <p className="text-sm text-[var(--muted)]">
                    {c.className || "Sin clase"} · Nivel {c.level}
                    {c.species ? ` · ${c.species}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
