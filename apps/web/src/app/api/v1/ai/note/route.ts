import { z } from "zod";
import { forbidden, json, sameOrigin, unauthorized } from "../../../../../server/http";
import { currentUser } from "../../../../../server/session";
import { startNoteAssist } from "../../../../../server/services/ai/noteAssist";
import { NOTE_ACTIONS } from "../../../../../server/services/ai/prompts/noteAssist";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const body = z.object({
  action: z.enum(NOTE_ACTIONS),
  text: z.string().trim().min(1).max(40000),
  instruction: z.string().trim().max(500).optional(),
  provider: z
    .string()
    .regex(/^[a-z0-9_-]{1,40}(:[A-Za-z0-9._\/-]{1,100})?$/)
    .optional(),
});

/** Runs an AI action on note text and streams the result back as plain text. All logic is in the AI service. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  const user = await currentUser();
  if (!user) return unauthorized();
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return json({ error: "Select or write some text first." }, 400);

  const r = await startNoteAssist({
    userId: user.id,
    action: p.data.action,
    text: p.data.text,
    instruction: p.data.instruction,
    providerId: p.data.provider,
    signal: req.signal,
  });
  if (!r.ok) return json({ error: r.error }, r.status);
  return new Response(r.stream, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" },
  });
}
