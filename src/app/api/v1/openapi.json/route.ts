import { NextResponse } from "next/server";
import { buildOpenApi } from "../../../../lib/api/openapi";

export const dynamic = "force-dynamic";

/** The API description (OpenAPI 3.1). Set API_DOCS=off to hide it in an environment where it should not be public. */
export async function GET() {
  if (process.env.API_DOCS?.trim().toLowerCase() === "off") return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(buildOpenApi(), { headers: { "cache-control": "no-store" } });
}
