import { randomBytes } from "node:crypto";

import { json, sameOrigin, unauthorized, forbidden } from "../../../../../../server/http";
import { currentUser, userDb } from "../../../../../../server/session";

type Ctx = { params: Promise<{ id: string }> };

/** Create or revoke a public read-only chat link for the signed-in user's chat. */
export async function POST(req: Request, { params }: Ctx) {
  if (!sameOrigin(req)) return forbidden();
  const user = await currentUser();
  if (!user) return unauthorized();
  const body = (await req.json().catch(() => null)) as { shared?: unknown } | null;
  if (typeof body?.shared !== "boolean") return json({ error: "Bad request." }, 400);
  const { id } = await params;
  const result = await userDb(user.id).from("chats").update({
    share_token: body.shared ? randomBytes(16).toString("hex") : null,
    shared_at: body.shared ? new Date().toISOString() : null,
  }).eq("id", id).select("share_token").maybeSingle();
  if (result.error) return json({ error: "Couldn’t change chat sharing." }, 500);
  if (!result.data) return json({ error: "Chat not found." }, 404);
  return json({ data: { share_token: result.data.share_token as string | null } });
}
