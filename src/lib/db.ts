import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { CharacterSheet } from "@/lib/characterTypes";

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
};

function usePostgres(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

let sqlClient: NeonQueryFunction<false, false> | null = null;
let schemaReady = false;

function sql() {
  if (!sqlClient) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    sqlClient = neon(url);
  }
  return sqlClient;
}

async function ensurePgSchema() {
  if (schemaReady) return;
  const db = sql();
  await db`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await db`CREATE INDEX IF NOT EXISTS characters_user_id_idx ON characters(user_id)`;
  schemaReady = true;
}

// ─── File fallback (local only) ───────────────────────────

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const CHARACTERS_DIR = path.join(DATA_DIR, "characters");

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(CHARACTERS_DIR, { recursive: true });
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, "[]", "utf-8");
  }
}

async function readUsersFile(): Promise<UserRecord[]> {
  await ensureDirs();
  return JSON.parse(await fs.readFile(USERS_FILE, "utf-8")) as UserRecord[];
}

async function writeUsersFile(users: UserRecord[]) {
  await ensureDirs();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

function characterPath(userId: string, characterId: string) {
  return path.join(CHARACTERS_DIR, userId, `${characterId}.json`);
}

// ─── Users ────────────────────────────────────────────────

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  if (usePostgres()) {
    await ensurePgSchema();
    const rows = await sql()`
      SELECT id, email, name, password_hash AS "passwordHash", created_at AS "createdAt"
      FROM users WHERE lower(email) = ${email.toLowerCase()} LIMIT 1
    `;
    const row = rows[0] as UserRecord | undefined;
    if (!row) return null;
    return {
      ...row,
      createdAt:
        typeof row.createdAt === "string"
          ? row.createdAt
          : new Date(row.createdAt as unknown as string).toISOString(),
    };
  }

  const users = await readUsersFile();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  if (usePostgres()) {
    await ensurePgSchema();
    const rows = await sql()`
      SELECT id, email, name, password_hash AS "passwordHash", created_at AS "createdAt"
      FROM users WHERE id = ${id} LIMIT 1
    `;
    const row = rows[0] as UserRecord | undefined;
    if (!row) return null;
    return {
      ...row,
      createdAt:
        typeof row.createdAt === "string"
          ? row.createdAt
          : new Date(row.createdAt as unknown as string).toISOString(),
    };
  }

  const users = await readUsersFile();
  return users.find((u) => u.id === id) ?? null;
}

export async function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<UserRecord> {
  const user: UserRecord = {
    id: randomUUID(),
    email: input.email.trim().toLowerCase(),
    name: input.name.trim(),
    passwordHash: input.passwordHash,
    createdAt: new Date().toISOString(),
  };

  if (usePostgres()) {
    await ensurePgSchema();
    try {
      await sql()`
        INSERT INTO users (id, email, name, password_hash, created_at)
        VALUES (${user.id}, ${user.email}, ${user.name}, ${user.passwordHash}, ${user.createdAt})
      `;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/unique|duplicate/i.test(message)) throw new Error("EMAIL_TAKEN");
      throw err;
    }
    return user;
  }

  const users = await readUsersFile();
  if (users.some((u) => u.email.toLowerCase() === user.email)) {
    throw new Error("EMAIL_TAKEN");
  }
  users.push(user);
  await writeUsersFile(users);
  return user;
}

// ─── Characters ───────────────────────────────────────────

export async function listCharacters(userId: string): Promise<CharacterSheet[]> {
  if (usePostgres()) {
    await ensurePgSchema();
    const rows = await sql()`
      SELECT data FROM characters
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
    `;
    return rows.map((r) => r.data as CharacterSheet);
  }

  const dir = path.join(CHARACTERS_DIR, userId);
  try {
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json"));
    const items: CharacterSheet[] = [];
    for (const file of files) {
      const raw = await fs.readFile(path.join(dir, file), "utf-8");
      items.push(JSON.parse(raw) as CharacterSheet);
    }
    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

export async function getCharacter(
  userId: string,
  characterId: string,
): Promise<CharacterSheet | null> {
  if (usePostgres()) {
    await ensurePgSchema();
    const rows = await sql()`
      SELECT data FROM characters
      WHERE id = ${characterId} AND user_id = ${userId}
      LIMIT 1
    `;
    return (rows[0]?.data as CharacterSheet) ?? null;
  }

  try {
    const raw = await fs.readFile(characterPath(userId, characterId), "utf-8");
    return JSON.parse(raw) as CharacterSheet;
  } catch {
    return null;
  }
}

export async function saveCharacter(sheet: CharacterSheet): Promise<CharacterSheet> {
  const next = { ...sheet, updatedAt: new Date().toISOString() };

  if (usePostgres()) {
    await ensurePgSchema();
    await sql()`
      INSERT INTO characters (id, user_id, data, updated_at)
      VALUES (${next.id}, ${next.userId}, ${JSON.stringify(next)}, ${next.updatedAt})
      ON CONFLICT (id) DO UPDATE SET
        data = EXCLUDED.data,
        updated_at = EXCLUDED.updated_at
    `;
    return next;
  }

  const dir = path.join(CHARACTERS_DIR, sheet.userId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    characterPath(sheet.userId, sheet.id),
    JSON.stringify(next, null, 2),
    "utf-8",
  );
  return next;
}

export async function deleteCharacter(userId: string, characterId: string) {
  if (usePostgres()) {
    await ensurePgSchema();
    await sql()`
      DELETE FROM characters WHERE id = ${characterId} AND user_id = ${userId}
    `;
    return;
  }

  try {
    await fs.unlink(characterPath(userId, characterId));
  } catch {
    /* ignore */
  }
}

export function isProductionDbConfigured(): boolean {
  return usePostgres();
}
