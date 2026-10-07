import { z } from "zod";
import { forbidden, json, sameOrigin, unauthorized } from "../../../../../server/http";
import { currentUser } from "../../../../../server/session";
import { startChatReply } from "../../../../../server/services/ai/chat";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const body = z.object({ chatId: z.string().uuid(), provider: z.string().regex(/^[a-z0-9_-]{1,40}$/) });

/** Generates the assistant's reply to a chat and streams it back as plain text. All logic is in the AI service. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  const user = await currentUser();
  if (!user) return unauthorized();
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return json({ error: "Bad request." }, 400);

  const r = await startChatReply({ userId: user.id, chatId: p.data.chatId, providerId: p.data.provider, signal: req.signal });
  if (!r.ok) return json({ error: r.error }, r.status);
  return new Response(r.stream, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" },
  });
}
