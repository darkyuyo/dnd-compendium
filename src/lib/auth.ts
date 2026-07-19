const encoder = new TextEncoder();

export const AUTH_COOKIE = "dnd_auth";
export const AUTH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  return process.env.AUTH_SECRET || "dev-secret-change-me";
}

async function sha256(input: string): Promise<string> {
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createAuthToken(password: string): Promise<string> {
  return sha256(`${password}:${getSecret()}`);
}

export async function isValidAuthToken(token: string): Promise<boolean> {
  const password = process.env.SITE_PASSWORD;
  if (!password) return false;
  const expected = await createAuthToken(password);
  return token === expected;
}

export async function verifyPassword(password: string): Promise<boolean> {
  const expected = process.env.SITE_PASSWORD;
  if (!expected) return false;
  return password === expected;
}
