import "server-only";
import { NextResponse } from "next/server";
import { serverEnv } from "../config/env";

/**
 * Cookie-authenticated state-changing requests must come from our own pages (CSRF defence in depth on top of SameSite=Lax cookies).
 * A request with no Origin header (curl, server-to-server) carries no browser cookies of ours, so it is allowed through to the
 * session check, which then rejects it.
 */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const allowed = new URL(serverEnv().authUrl).host;
  return new URL(origin).host === allowed || new URL(origin).host === req.headers.get("host");
}

export const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
export const unauthorized = () => json({ error: "Not signed in." }, 401);
export const forbidden = () => json({ error: "Not allowed." }, 403);
