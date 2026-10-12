import { z } from "zod";
import { json, sameOrigin, unauthorized, forbidden } from "../../../../../server/http";
import { currentUser } from "../../../../../server/session";
import { deleteUserAccount, resetUserWorkspace } from "../../../../../server/services/account.service";

const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reset-workspace"), confirmation: z.string().max(20) }),
  z.object({ action: z.literal("delete-account"), confirmation: z.string().max(254) }),
]);

/** User-confirmed destructive account actions used by mobile settings. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  const user = await currentUser();
  if (!user) return unauthorized();
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Bad request." }, 400);
  if (parsed.data.action === "reset-workspace") {
    if (parsed.data.confirmation.trim().toLowerCase() !== "reset") return json({ error: "Type reset to confirm." }, 400);
    const result = await resetUserWorkspace(user.id);
    return result.ok ? json({ data: { ok: true } }) : json({ error: result.error }, 500);
  }
  const result = await deleteUserAccount(user, parsed.data.confirmation);
  return result.ok ? json({ data: { ok: true } }) : json({ error: result.error }, 400);
}
