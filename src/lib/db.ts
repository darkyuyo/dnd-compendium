import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { CharacterSheet } from "@/lib/characterTypes";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const CHARACTERS_DIR = path.join(DATA_DIR, "characters");

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
};

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(CHARACTERS_DIR, { recursive: true });
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, "[]", "utf-8");
  }
}

async function readUsers(): Promise<UserRecord[]> {
  await ensureDirs();
  return JSON.parse(await fs.readFile(USERS_FILE, "utf-8")) as UserRecord[];
}

async function writeUsers(users: UserRecord[]) {
  await ensureDirs();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const users = await readUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const users = await readUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<UserRecord> {
  const users = await readUsers();
  if (users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error("EMAIL_TAKEN");
  }
  const user: UserRecord = {
    id: randomUUID(),
    email: input.email.trim().toLowerCase(),
    name: input.name.trim(),
    passwordHash: input.passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await writeUsers(users);
  return user;
}

function characterPath(userId: string, characterId: string) {
  return path.join(CHARACTERS_DIR, userId, `${characterId}.json`);
}

export async function listCharacters(userId: string): Promise<CharacterSheet[]> {
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
  try {
    const raw = await fs.readFile(characterPath(userId, characterId), "utf-8");
    return JSON.parse(raw) as CharacterSheet;
  } catch {
    return null;
  }
}

export async function saveCharacter(sheet: CharacterSheet): Promise<CharacterSheet> {
  const dir = path.join(CHARACTERS_DIR, sheet.userId);
  await fs.mkdir(dir, { recursive: true });
  const next = { ...sheet, updatedAt: new Date().toISOString() };
  await fs.writeFile(
    characterPath(sheet.userId, sheet.id),
    JSON.stringify(next, null, 2),
    "utf-8",
  );
  return next;
}

export async function deleteCharacter(userId: string, characterId: string) {
  try {
    await fs.unlink(characterPath(userId, characterId));
  } catch {
    /* ignore */
  }
}
