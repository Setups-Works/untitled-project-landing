import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { collections } from "../../../../lib/mongo";
import { currentAdmin } from "../../../../lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { type, id } = await req.json().catch(() => ({}));
  if (!ObjectId.isValid(id) || !["waitlist", "survey"].includes(type)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const { waitlist, surveys } = await collections();
  await (type === "waitlist" ? waitlist : surveys).deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ ok: true });
}
