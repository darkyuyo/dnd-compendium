import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { deleteCharacter, getCharacter, saveCharacter } from "@/lib/db";
import type { CharacterSheet } from "@/lib/characterTypes";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const character = await getCharacter(user.id, id);
  if (!character) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  return NextResponse.json({ character });
}

export async function PUT(request: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const existing = await getCharacter(user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  const body = (await request.json()) as CharacterSheet;
  const next: CharacterSheet = {
    ...body,
    id: existing.id,
    userId: user.id,
    createdAt: existing.createdAt,
  };
  const saved = await saveCharacter(next);
  return NextResponse.json({ character: saved });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const existing = await getCharacter(user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  await deleteCharacter(user.id, id);
  return NextResponse.json({ ok: true });
}
