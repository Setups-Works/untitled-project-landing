import "server-only";
import { AiProviderError, getProvider, type AiChunk, type AiMessage } from "../../providers/ai";
import { redis } from "../../redis";
import { userDb } from "../../db/builders";
import { calendarFor } from "../../../lib/dates";
import { CHAT_PROMPT } from "./prompts/chat";

/** Limits live here (not in routes) so every caller gets the same behaviour. */
const LIMITS = { historyMessages: 20, charsPerMessage: 6000, repliesPerMinute: 20, savedChars: 19000 } as const;

const DRAFT_BLOCK = /<create-item>([\s\S]*?)<\/create-item>/g;

/**
 * Tidies the draft blocks of a finished reply, in a way that doesn't depend on the language or topic of the conversation:
 * - a block whose JSON is broken (code pasted into a JSON string almost always breaks it) is dropped, so it can't surface as an empty draft;
 * - a note whose body is the placeholder `{{reply}}` gets the reply text itself, so whatever the assistant wrote (code, a plan,
 *   a recipe) is saved exactly as shown, without being squeezed through JSON.
 */
export function settleBlocks(full: string, previous: string): string {
  const plain = (s: string) =>
    s
      .replace(DRAFT_BLOCK, "")
      .replace(/<create-item>[\s\S]*$/, "") // a block that was never closed (the answer ran out of room)
      .replace(/<created-item>[\s\S]*?<\/created-item>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, 9_000);
  const now = plain(full);
  const before = plain(previous);
  // A one-line confirmation ("I've prepared a note for you") is not content. When that is all this reply says and the answer
  // before it was much longer, the earlier answer is what the note should hold, whichever placeholder the model picked.
  const confirmationOnly = now.length <= 240 && now.split("\n").filter(Boolean).length <= 2 && before.length > now.length * 2;
  const body: Record<string, string> = {
    "{{reply}}": confirmationOnly ? before : now,
    "{{previous}}": before || now,
  };
  // A note block with broken JSON (typically the model copied code into the body) still tells us what it wanted: a note with this
  // title. Its content is the reply or the earlier answer, exactly as for the placeholders, so the draft isn't lost.
  const rescue = (raw: string) => {
    if (!/"kind"\s*:\s*"note"/.test(raw)) return "";
    let title = "Note";
    const t = /"title"\s*:\s*"((?:[^"\\]|\\.){1,200})"/.exec(raw);
    if (t) {
      try {
        title = JSON.parse(`"${t[1]}"`) as string;
      } catch {
        /* keep the default title */
      }
    }
    const text = confirmationOnly || !now ? before : now;
    return text ? `<create-item>${JSON.stringify({ kind: "note", title, body: text })}</create-item>` : "";
  };
  const tidy = full.replace(DRAFT_BLOCK, (all, json: string) => {
    let a: { kind?: string; body?: unknown };
    try {
      a = JSON.parse(json) as typeof a;
    } catch {
      return rescue(json);
    }
    const text = a.kind === "note" && typeof a.body === "string" ? body[a.body.trim()] : undefined;
    return text ? `<create-item>${JSON.stringify({ ...a, body: text })}</create-item>` : all;
  });
  const open = tidy.lastIndexOf("<create-item>");
  return open < 0 || tidy.includes("</create-item>", open)
    ? tidy
    : `${tidy.slice(0, open).trimEnd()}\n${rescue(tidy.slice(open))}`.trimEnd();
}

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
  localDate: string;
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

  // The model is bad at calendar arithmetic ("next Tuesday", "the 20th"), so it gets a ready list of the coming dates instead.
  const messages: AiMessage[] = [
    { role: "system", content: `${CHAT_PROMPT.system} ${calendarFor(opts.localDate)}` },
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

  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let completed = false;
      try {
        while (!step.done) {
          if (step.value.type === "text") {
            full += step.value.text;
            controller.enqueue(enc.encode(step.value.text));
          }
          step = await it.next();
        }
        completed = step.done;
      } catch {
        // A broken stream still keeps whatever was already written.
      } finally {
        // Never tidy an interrupted generation: an incomplete answer must not turn into a draft.
        if (completed && !cancelled) {
          // The assistant message just before the user's latest one, for "save that" follow-ups.
          const before = rows.length >= 2 && rows[rows.length - 2].role === "assistant" ? rows[rows.length - 2].body : "";
          full = settleBlocks(full, before);
        }
        await save().catch(() => undefined);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
    cancel() {
      cancelled = true;
      void it.return?.();
    },
  });
  return { ok: true, stream };
}
