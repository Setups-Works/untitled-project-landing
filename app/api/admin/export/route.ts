import { NextResponse } from "next/server";
import { collections } from "../../../../lib/mongo";
import { currentAdmin } from "../../../../lib/auth";

export const runtime = "nodejs";

const esc = (v: unknown) => {
  let s = Array.isArray(v) ? v.join("; ") : v instanceof Date ? v.toISOString() : String(v ?? "");
  if (/^[=+\-@]/.test(s)) s = "'" + s; // neutralise spreadsheet formulas
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const type = new URL(req.url).searchParams.get("type") === "survey" ? "survey" : "waitlist";
  const { waitlist, surveys } = await collections();
  const cols = type === "waitlist"
    ? ["name", "email", "role", "source", "createdAt"]
    : ["email", "role", "tools", "pains", "features", "ai", "pay", "budget", "switchReason", "createdAt"];
  const rows = await (type === "waitlist" ? waitlist : surveys).find().sort({ createdAt: -1 }).toArray();
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${type}.csv"`, "Cache-Control": "no-store" },
  });
}
