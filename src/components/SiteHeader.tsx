"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const links = [
  { href: "/", key: "home" as const },
  { href: "/characters", key: "characters" as const },
  { href: "/monsters", key: "monsters" as const },
  { href: "/spells", key: "spells" as const },
  { href: "/weapons", key: "weapons" as const },
  { href: "/armor", key: "armor" as const },
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
  const [user, setUser] = useState<{ name: string } | null | undefined>(
    undefined,
  );

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, [pathname]);

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
          {user === undefined ? null : user ? (
            <>
              <span className="hidden text-sm text-[var(--muted)] sm:inline">
                {user.name}
              </span>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="rounded-md px-2.5 py-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  {t("logout")}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-2.5 py-1 text-sm hover:bg-[var(--surface-2)]"
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-[var(--accent)] px-2.5 py-1 text-sm font-semibold text-[var(--accent-fg)]"
              >
                {t("register")}
              </Link>
            </>
          )}
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
