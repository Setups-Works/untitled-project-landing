import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const UI = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14";

/**
 * Swagger UI for /api/v1/openapi.json. It is served from this site, so "Try it out" sends the signed-in session cookie.
 * The Swagger UI files come from a pinned CDN version; for a strict deployment, self-host them or add integrity hashes.
 */
export async function GET() {
  if (process.env.API_DOCS?.trim().toLowerCase() === "off") return NextResponse.json({ error: "Not found." }, { status: 404 });
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>untitled project API</title><link rel="stylesheet" href="${UI}/swagger-ui.css" /></head>
<body><div id="ui"></div>
<script src="${UI}/swagger-ui-bundle.js" crossorigin></script>
<script>window.ui = SwaggerUIBundle({ url: "/api/v1/openapi.json", dom_id: "#ui", deepLinking: true, persistAuthorization: true });</script>
</body></html>`;
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
