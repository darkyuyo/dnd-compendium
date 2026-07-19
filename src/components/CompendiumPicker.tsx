"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

type Kind =
  | "spells"
  | "weapons"
  | "armor"
  | "equipment"
  | "feats"
  | "classes"
  | "species"
  | "backgrounds";

type Item = { slug: string; name: string; subtitle: string; href: string };

type Props = {
  open: boolean;
  kind: Kind;
  locale: string;
  title: string;
  onClose: () => void;
  onSelect: (item: Item) => void;
};

export function CompendiumPicker({
  open,
  kind,
  locale,
  title,
  onClose,
  onSelect,
}: Props) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams({ kind, locale, q });
      const res = await fetch(`/api/compendium/search?${params}`);
      const data = await res.json();
      setItems(data.items || []);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [open, kind, locale, q]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2 className="font-display text-lg font-bold text-[var(--accent)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-[var(--muted)] hover:bg-[var(--surface-2)]"
          >
            Cerrar
          </button>
        </div>
        <div className="border-b border-[var(--border)] px-4 py-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar…"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent)]"
            autoFocus
          />
        </div>
        <ul className="flex-1 overflow-y-auto">
          {loading ? (
            <li className="px-4 py-6 text-sm text-[var(--muted)]">Cargando…</li>
          ) : items.length === 0 ? (
            <li className="px-4 py-6 text-sm text-[var(--muted)]">
              Sin resultados
            </li>
          ) : (
            items.map((item) => (
              <li
                key={item.slug}
                className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{item.name}</p>
                  <p className="truncate text-xs text-[var(--muted)]">
                    {item.subtitle}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--surface-2)]"
                  >
                    Info
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className="rounded-md bg-[var(--accent)] px-2 py-1 text-xs font-semibold text-[var(--accent-fg)]"
                  >
                    Añadir
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
