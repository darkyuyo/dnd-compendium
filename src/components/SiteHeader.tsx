"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";

const links = [
  { href: "/", key: "home" as const },
  { href: "/monsters", key: "monsters" as const },
  { href: "/spells", key: "spells" as const },
  { href: "/weapons", key: "weapons" as const },
  { href: "/equipment", key: "equipment" as const },
  { href: "/classes", key: "classes" as const },
  { href: "/species", key: "species" as const },
  { href: "/backgrounds", key: "backgrounds" as const },
  { href: "/feats", key: "feats" as const },
  { href: "/how-to-play", key: "howToPlay" as const },
  { href: "/character-creation", key: "characterCreation" as const },
];

export function SiteHeader() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const locale = useLocale();
  const otherLocale = locale === "es" ? "en" : "es";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--header-bg)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="font-display text-xl font-bold tracking-wide text-[var(--accent)]"
        >
          D&amp;D Compendium
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={pathname}
            locale={otherLocale}
            className="rounded-md border border-[var(--border)] px-2.5 py-1 text-sm font-semibold uppercase hover:bg-[var(--surface-2)]"
          >
            {otherLocale === "es" ? "ES" : "EN"}
          </Link>
        </div>
      </div>

      <nav className="mx-auto max-w-6xl overflow-x-auto px-4 pb-3">
        <ul className="flex min-w-max gap-1">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`block rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition ${
                    active
                      ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                      : "text-[var(--foreground)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  {t(link.key)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
