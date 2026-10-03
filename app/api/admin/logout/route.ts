import { NextResponse } from "next/server";
import { cookieOptions } from "../../../../lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieOptions.name, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
