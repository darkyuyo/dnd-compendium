import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, findUserByEmail, isProductionDbConfigured } from "@/lib/db";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";

export async function POST(request: Request) {
  try {
    if (process.env.VERCEL && !isProductionDbConfigured()) {
      return NextResponse.json(
        {
          error:
            "Falta DATABASE_URL en Vercel. Crea una base Neon gratis y añádela en Project → Settings → Environment Variables.",
        },
        { status: 503 },
      );
    }

    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !name || password.length < 6) {
      return NextResponse.json(
        { error: "Nombre, email y contraseña (mín. 6) son obligatorios." },
        { status: 400 },
      );
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Ese email ya está registrado." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ email, name, passwordHash });
    const token = await createSessionToken(user.id);
    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === "EMAIL_TAKEN") {
      return NextResponse.json(
        { error: "Ese email ya está registrado." },
        { status: 409 },
      );
    }
    console.error("[register]", err);
    return NextResponse.json(
      { error: "No se pudo crear la cuenta. Revisa DATABASE_URL / logs de Vercel." },
      { status: 500 },
    );
  }
}
