import { forbidden, json, sameOrigin, unauthorized } from "../../../../server/http";
import { currentUser } from "../../../../server/session";
import { getHealth, syncHealth } from "../../../../server/services/health/health.service";
import { healthSyncInput } from "../../../../server/services/health/health.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/v1/health?days=14 — recent days, newest first. */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const days = Number(new URL(req.url).searchParams.get("days") ?? 14);
  try {
    return json({ data: await getHealth(user.id, days) });
  } catch (e) {
    console.error("health GET failed:", e instanceof Error ? e.message : "unknown");
    return json({ error: "Couldn’t load your health data." }, 500);
  }
}

/** PUT /api/v1/health — the phone sends its latest daily totals. */
export async function PUT(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  const user = await currentUser();
  if (!user) return unauthorized();
  const parsed = healthSyncInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: `${parsed.error.issues[0]?.path.join(".") || "body"}: ${parsed.error.issues[0]?.message ?? "invalid"}` }, 400);
  try {
    return json({ data: await syncHealth(user.id, parsed.data) });
  } catch (e) {
    console.error("health PUT failed:", e instanceof Error ? e.message : "unknown");
    return json({ error: "Couldn’t save your health data." }, 500);
  }
}
