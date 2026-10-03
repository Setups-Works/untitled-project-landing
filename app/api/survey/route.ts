import { NextResponse } from "next/server";
import { collections } from "../../../lib/mongo";
import { EMAIL_RE, SURVEY, clean, pickMany, pickOne } from "../../../lib/validate";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (clean(b.website)) return NextResponse.json({ ok: true });
  const email = clean(b.email, 254).toLowerCase();
  if (email && !EMAIL_RE.test(email)) return NextResponse.json({ error: "That email doesn’t look right." }, { status: 400 });
  const doc = {
    email: email || null,
    role: pickOne(b.role, SURVEY.roles),
    tools: pickMany(b.tools, SURVEY.tools),
    pains: pickMany(b.pains, SURVEY.pains),
    features: pickMany(b.features, SURVEY.features),
    ai: pickOne(b.ai, SURVEY.ai),
    pay: pickOne(b.pay, SURVEY.pay),
    budget: pickOne(b.budget, SURVEY.budget),
    switchReason: clean(b.switchReason, 1000),
    createdAt: new Date(),
  };
  if (!doc.role || !doc.ai) return NextResponse.json({ error: "Please answer the required questions." }, { status: 400 });
  try {
    const { surveys } = await collections();
    await surveys.insertOne(doc);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("survey error", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
