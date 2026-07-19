import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { listCharacters, saveCharacter } from "@/lib/db";
import { createEmptyCharacter } from "@/lib/characterTypes";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const characters = await listCharacters(user.id);
  return NextResponse.json({
    characters: characters.map((c) => ({
      id: c.id,
      name: c.name || "Sin nombre",
      className: c.className,
      level: c.level,
      species: c.species,
      photoUrl: c.photoUrl,
      updatedAt: c.updatedAt,
    })),
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const sheet = createEmptyCharacter(user.id);
  if (typeof body?.name === "string" && body.name.trim()) {
    sheet.name = body.name.trim();
  }
  const saved = await saveCharacter(sheet);
  return NextResponse.json({ character: saved }, { status: 201 });
}
