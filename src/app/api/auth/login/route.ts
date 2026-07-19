import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail, isProductionDbConfigured } from "@/lib/db";
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
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Credenciales inválidas." }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Email o contraseña incorrectos." },
        { status: 401 },
      );
    }

    const token = await createSessionToken(user.id);
    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json(
      { error: "Error de servidor. Revisa DATABASE_URL en Vercel." },
      { status: 500 },
    );
  }
}
