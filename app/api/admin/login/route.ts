import { NextResponse } from "next/server";
import { collections } from "../../../../lib/mongo";
import { cookieOptions, createSession, ensureAdmin, verifyPassword } from "../../../../lib/auth";
import { clean } from "../../../../lib/validate";

export const runtime = "nodejs";

// Tiny in-memory throttle: 8 attempts / 10 min / IP (per server instance).
const tries = new Map<string, { n: number; t: number }>();

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const now = Date.now();
  const rec = tries.get(ip);
  if (rec && now - rec.t < 600_000 && rec.n >= 8) {
    return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const email = clean(b.email, 254).toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  try {
    await ensureAdmin();
    const { admins } = await collections();
    const a = await admins.findOne({ email });
    const ok = !!a && verifyPassword(password, a.salt, a.hash);
    if (!ok) {
      tries.set(ip, { n: (rec && now - rec.t < 600_000 ? rec.n : 0) + 1, t: rec && now - rec.t < 600_000 ? rec.t : now });
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }
    tries.delete(ip);
    const { name, ...opts } = cookieOptions;
    const res = NextResponse.json({ ok: true });
    res.cookies.set(name, createSession(email), opts);
    return res;
  } catch (e) {
    console.error("login error", e);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
