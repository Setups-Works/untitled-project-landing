import "server-only";
import { AiProviderError, getProvider, type AiChunk, type AiMessage } from "../../providers/ai";
import { redis } from "../../redis";
import { userDb } from "../../db/builders";
import { CHAT_PROMPT } from "./prompts/chat";

/** Limits live here (not in routes) so every caller gets the same behaviour. */
const LIMITS = { historyMessages: 20, charsPerMessage: 6000, repliesPerMinute: 20, savedChars: 19000 } as const;

export type ChatReply = { ok: true; stream: ReadableStream<Uint8Array> } | { ok: false; status: number; error: string };

/** Allows `repliesPerMinute` replies per user per minute. Without Redis there is no limit (the provider's own limits still apply). */
async function underRateLimit(userId: string) {
  const r = redis();
  if (!r) return true;
  try {
    const key = `ai:${userId}:${Math.floor(Date.now() / 60000)}`;
    const n = await r.incr(key);
    if (n === 1) await r.expire(key, 90);
    return n <= LIMITS.repliesPerMinute;
  } catch {
    return true; // a Redis hiccup must not block people from chatting
  }
}

/**
 * Generates the assistant's reply to the latest user message in a chat and returns it as a text stream.
 * The conversation is read as the signed-in user (row-level security decides which chats they may use), the finished
 * reply is saved as an assistant message, and the provider key never leaves the server. Prompt and answer text are never logged.
 */
export async function startChatReply(opts: {
  userId: string;
  chatId: string;
  providerId: string;
  signal?: AbortSignal;
}): Promise<ChatReply> {
  const provider = getProvider(opts.providerId);
  if (!provider || provider.runtime !== "server" || !provider.isAvailable())
    return { ok: false, status: 400, error: "That AI isn’t available on this server." };
  if (!(await underRateLimit(opts.userId)))
    return { ok: false, status: 429, error: "You’re sending messages very fast. Wait a moment and try again." };

  const db = userDb(opts.userId);
  const { data } = await db
    .from("chat_messages")
    .select("role,body")
    .eq("chat_id", opts.chatId)
    .order("created_at", { ascending: false })
    .limit(LIMITS.historyMessages);
  const rows = ((data ?? []) as { role: "user" | "assistant"; body: string }[]).reverse();
  if (!rows.length) return { ok: false, status: 404, error: "Chat not found." };
  if (rows[rows.length - 1].role !== "user") return { ok: false, status: 400, error: "Nothing to reply to." };

  const messages: AiMessage[] = [
    { role: "system", content: CHAT_PROMPT.system },
    ...rows.map((m) => ({ role: m.role, content: m.body.slice(0, LIMITS.charsPerMessage) })),
  ];
  const it = provider.stream({ messages, signal: opts.signal })[Symbol.asyncIterator]();

  // Pull the first piece before replying, so a configuration or rate-limit problem becomes a proper error response.
  let step: IteratorResult<AiChunk>;
  try {
    step = await it.next();
  } catch (e) {
    const err = e instanceof AiProviderError ? e : null;
    return { ok: false, status: err?.code === "rate_limited" ? 429 : 502, error: err?.message ?? "The AI couldn’t answer that." };
  }

  const enc = new TextEncoder();
  let full = "";
  const save = async () => {
    const text = full.trim().slice(0, LIMITS.savedChars);
    if (!text) return;
    await db.from("chat_messages").insert({ chat_id: opts.chatId, role: "assistant", body: text });
    await db.from("chats").update({ updated_at: new Date().toISOString() }).eq("id", opts.chatId);
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (!step.done) {
          if (step.value.type === "text") {
            full += step.value.text;
            controller.enqueue(enc.encode(step.value.text));
          }
          step = await it.next();
        }
      } catch {
        // A broken stream still keeps whatever was already written.
      } finally {
        await save().catch(() => undefined);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
    cancel() {
      void it.return?.();
    },
  });
  return { ok: true, stream };
}
