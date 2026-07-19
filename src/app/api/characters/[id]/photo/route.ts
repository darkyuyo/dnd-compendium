import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getCharacter, isProductionDbConfigured, saveCharacter } from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const character = await getCharacter(user.id, id);
  if (!character) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const form = await request.formData();
  const file = form.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta la foto" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "El archivo debe ser una imagen" },
      { status: 400 },
    );
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Máximo 2 MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // On Vercel / Postgres: store as data URL inside the character JSON
  // (no writable public/ folder on serverless)
  if (process.env.VERCEL || isProductionDbConfigured()) {
    const base64 = buffer.toString("base64");
    const photoUrl = `data:${file.type};base64,${base64}`;
    character.photoUrl = photoUrl;
    const saved = await saveCharacter(character);
    return NextResponse.json({ character: saved, photoUrl });
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const uploadDir = path.join(process.cwd(), "public", "uploads", "characters");
  await fs.mkdir(uploadDir, { recursive: true });
  const filename = `${id}.${ext}`;
  await fs.writeFile(path.join(uploadDir, filename), buffer);

  const photoUrl = `/uploads/characters/${filename}?t=${Date.now()}`;
  character.photoUrl = photoUrl;
  const saved = await saveCharacter(character);
  return NextResponse.json({ character: saved, photoUrl });
}
