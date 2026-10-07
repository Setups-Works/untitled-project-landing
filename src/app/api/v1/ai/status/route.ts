import { listProviders } from "../../../../../server/providers/ai";
import { json, unauthorized } from "../../../../../server/http";
import { currentUser } from "../../../../../server/session";

export const dynamic = "force-dynamic";

/** The AI providers this deployment knows about and whether each is configured. Labels and notes only, never keys. */
export async function GET() {
  if (!(await currentUser())) return unauthorized();
  return json({
    providers: listProviders().map((p) => ({ id: p.id, label: p.label, note: p.note, runtime: p.runtime, available: p.isAvailable() })),
  });
}
