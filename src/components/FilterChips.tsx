"use client";

type Option = { value: string; label: string };

type Props = {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  allLabel: string;
};

export function FilterChips({
  label,
  options,
  value,
  onChange,
  allLabel,
}: Props) {
  const chips = [{ value: "all", label: allLabel }, ...options];

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const active = value === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => onChange(chip.value)}
              className={`rounded-md px-3 py-1 text-sm transition ${
                active
                  ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                  : "bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[var(--border)]"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
