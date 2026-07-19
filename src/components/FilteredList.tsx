"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { SearchBar } from "@/components/SearchBar";
import { FilterChips } from "@/components/FilterChips";
import type { Locale } from "@/i18n/routing";

export type ListItem = {
  slug: string;
  title: string;
  subtitle?: string;
  href: string;
  filterValues?: Record<string, string>;
};

type FilterDef = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
};

type Props = {
  items: ListItem[];
  searchPlaceholder: string;
  allLabel: string;
  noResults: string;
  filters?: FilterDef[];
  locale?: Locale;
};

export function FilteredList({
  items,
  searchPlaceholder,
  allLabel,
  noResults,
  filters = [],
}: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(filters.map((f) => [f.key, "all"])),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (q && !item.title.toLowerCase().includes(q) && !(item.subtitle || "").toLowerCase().includes(q)) {
        return false;
      }
      for (const f of filters) {
        const sel = selected[f.key];
        if (sel && sel !== "all") {
          if ((item.filterValues?.[f.key] ?? "") !== sel) return false;
        }
      }
      return true;
    });
  }, [items, query, selected, filters]);

  return (
    <div className="space-y-4">
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder={searchPlaceholder}
      />
      {filters.map((f) => (
        <FilterChips
          key={f.key}
          label={f.label}
          options={f.options}
          value={selected[f.key] ?? "all"}
          allLabel={allLabel}
          onChange={(value) =>
            setSelected((prev) => ({ ...prev, [f.key]: value }))
          }
        />
      ))}
      {filtered.length === 0 ? (
        <p className="text-[var(--muted)]">{noResults}</p>
      ) : (
        <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          {filtered.map((item) => (
            <li key={item.slug}>
              <Link
                href={item.href}
                className="flex flex-col gap-0.5 px-4 py-3 transition hover:bg-[var(--surface-2)] sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-semibold">{item.title}</span>
                {item.subtitle ? (
                  <span className="text-sm text-[var(--muted)]">
                    {item.subtitle}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
