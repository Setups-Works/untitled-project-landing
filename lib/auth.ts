import crypto from "node:crypto";
import { cookies } from "next/headers";
import { collections } from "./mongo";

const COOKIE = "up_admin";
const MAX_AGE = 60 * 60 * 8; // 8 hours

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET is not set");
  return s;
}

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");
const sign = (body: string) => crypto.createHmac("sha256", secret()).update(body).digest("base64url");

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string) {
  const a = Buffer.from(crypto.scryptSync(password, salt, 64).toString("hex"));
  const b = Buffer.from(hash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function createSession(email: string) {
  const body = b64(JSON.stringify({ email, exp: Date.now() + MAX_AGE * 1000 }));
  return `${body}.${sign(body)}`;
}

export function readSession(token?: string | null): { email: string } | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const ok = sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  if (!ok) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    return p.exp > Date.now() ? { email: String(p.email) } : null;
  } catch {
    return null;
  }
}

export async function currentAdmin() {
  const jar = await cookies();
  return readSession(jar.get(COOKIE)?.value);
}

export const cookieOptions = {
  name: COOKIE,
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
};

/** Makes sure the admin from ADMIN_EMAIL / ADMIN_PASSWORD exists (stored hashed, never in plain text). */
export async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const { admins } = await collections();
  const existing = await admins.findOne({ email });
  if (existing && verifyPassword(password, existing.salt, existing.hash)) return;
  const { salt, hash } = hashPassword(password);
  await admins.updateOne({ email }, { $set: { salt, hash, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
}
