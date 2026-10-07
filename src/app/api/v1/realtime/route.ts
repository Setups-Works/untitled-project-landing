import { unauthorized } from "../../../../server/http";
import { subscribe } from "../../../../server/realtime";
import { currentUser } from "../../../../server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Server-Sent Events stream: `event: change` with `{"t":"tasks"}` whenever one of the caller's rows changes. */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const enc = new TextEncoder();
  let off: (() => void) | undefined;
  let beat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (s: string) => {
        try {
          controller.enqueue(enc.encode(s));
        } catch {
          /* stream already closed */
        }
      };
      send("retry: 3000\n\n");
      off = subscribe(user.id, (t) => send(`event: change\ndata: ${JSON.stringify({ t })}\n\n`));
      beat = setInterval(() => send(": keep-alive\n\n"), 25_000);
      req.signal.addEventListener("abort", () => {
        off?.();
        clearInterval(beat);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
    cancel() {
      off?.();
      clearInterval(beat);
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
