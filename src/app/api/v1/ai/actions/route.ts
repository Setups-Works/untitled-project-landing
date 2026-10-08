import { z } from "zod";
import { forbidden, json, sameOrigin, unauthorized } from "../../../../../server/http";
import { currentUser } from "../../../../../server/session";
import { createChatItem } from "../../../../../server/services/ai/actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Creates an item only after the signed-in user confirms the preview shown in chat. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  const user = await currentUser();
  if (!user) return unauthorized();
  const parsed = z.object({ messageId: z.string().uuid() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "That draft is invalid. Ask the assistant to prepare it again." }, 400);
  try {
    const created = await createChatItem(user.id, parsed.data.messageId);
    return created ? json(created, 201) : json({ error: "That draft is no longer available." }, 409);
  } catch {
    return json({ error: "Couldn’t create that item. Please try again." }, 500);
  }
}
