import { NextResponse } from "next/server";
import { collections } from "../../../lib/mongo";
import { EMAIL_RE, clean } from "../../../lib/validate";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (clean(b.website)) return NextResponse.json({ ok: true }); // honeypot: pretend success to bots
  const email = clean(b.email, 254).toLowerCase();
  const name = clean(b.name, 80);
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Please tell us your name." }, { status: 400 });
  try {
    const { waitlist } = await collections();
    const res = await waitlist.updateOne(
      { email },
      { $setOnInsert: { email, name, role: clean(b.role, 40), source: clean(b.source, 40) || "site", createdAt: new Date() } },
      { upsert: true },
    );
    return NextResponse.json({ ok: true, already: res.upsertedCount === 0 });
  } catch (e) {
    console.error("waitlist error", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
