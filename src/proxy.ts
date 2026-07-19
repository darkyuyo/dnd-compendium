import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { SESSION_COOKIE, verifySessionToken } from "./lib/sessionToken";

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never touch API routes (next-intl would prefix /es and break them)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Legacy root /login
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/es/login", request.url));
  }

  const isCharactersRoute =
    /\/(es|en)\/characters(\/|$)/.test(pathname);

  if (isCharactersRoute) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const userId = token ? await verifySessionToken(token) : null;
    if (!userId) {
      const locale = pathname.startsWith("/en") ? "en" : "es";
      const login = new URL(`/${locale}/login`, request.url);
      login.searchParams.set("from", pathname);
      return NextResponse.redirect(login);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
