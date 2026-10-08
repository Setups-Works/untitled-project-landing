import "server-only";
import { AiProviderError, getProvider, type AiChunk, type AiMessage } from "../../providers/ai";
import { redis } from "../../redis";
import { userDb } from "../../db/builders";
import { parseChatAction, parseChatActions, type ChatAction } from "../../../lib/chat-actions";
import { CHAT_PROMPT } from "./prompts/chat";

/** Limits live here (not in routes) so every caller gets the same behaviour. */
const LIMITS = { historyMessages: 20, charsPerMessage: 6000, repliesPerMinute: 20, savedChars: 19000 } as const;

type CreateKind = ChatAction["kind"];
type CreateIntent = { kind: CreateKind; requestIndex: number };

function requestedKind(text: string): CreateKind | null {
  if (!/\b(create|make|save|add|write|draft|put)\b/i.test(text)) return null;
  if (/\b(notes?|notebook)\b/i.test(text)) return "note";
  if (/\b(journal|diary|journal entry)\b/i.test(text)) return "journal";
  if (/\b(tasks?|to[ -]?dos?)\b/i.test(text)) return "task";
  return null;
}

/** A short request that points back at earlier content ("add this in note", "save that as a to-do"). */
function referencesEarlier(text: string) {
  return text.trim().length <= 80 && /\b(this|that|it|above|these|those)\b/i.test(text);
}

function hasCreateOffer(text: string) {
  return /\b(if you(?:'d| would) like|would you like|want me to|shall i|i can)\b[\s\S]{0,180}\b(create|make|save|add|write|note|journal|task|to[ -]?do)\b/i.test(
    text,
  );
}

function affirming(text: string) {
  return /^\s*(yes|yeah|yep|sure|please|do that|go ahead|sounds good|okay|ok)[!.\s]*$/i.test(text);
}

function handledAfter(rows: { role: "user" | "assistant"; body: string }[], from: number) {
  return rows.slice(from + 1).some((row) => {
    if (row.role !== "assistant") return false;
    return parseChatActions(row.body).proposals.length > 0 || /\[Open your (?:note|journal entry|to-do)\]\(https?:\/\//i.test(row.body);
  });
}

function draftTitle(text: string, kind: CreateKind, request: string) {
  // Headings inside code blocks (comments, markup) are part of the code, not a title for the whole answer.
  const headings = text
    .replace(/```[\s\S]*?(?:```|$)/g, "")
    .split("\n")
    .map((line) => line.match(/^\s{0,3}#{1,3}\s+(.+?)\s*#*\s*$/)?.[1] ?? line.match(/^\s*\*\*(.+?)\*\*\s*$/)?.[1])
    .filter((line): line is string => Boolean(line));
  const heading = headings.find((line) => /\b(note|journal|task|to-do|features|summary|plan)\b/i.test(line)) ?? headings[0];
  const raw = (heading ?? request)
    .replace(/^\s*(?:note|journal entry|journal|task|to-do)\s*[:–—-]\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (raw) return raw.slice(0, kind === "task" ? 300 : 200);
  return kind === "note" ? "Chat note" : kind === "journal" ? "Journal entry" : "To-do";
}

function falseSavedClaims(text: string) {
  return text
    .replace(
      /\b(?:the (?:note|journal entry|task|to-do) has been|i(?:'ve| have))\s+(?:created|saved|added)\b[^.!?]*(?:[.!?]|$)/gi,
      "Here’s a draft for you to review.",
    )
    .replace(/\b(?:i created|i saved|i added)\b[^.!?]*(?:[.!?]|$)/gi, "Here’s a draft for you to review.");
}

function hasSavedClaim(text: string) {
  return /\b(?:the (?:note|journal entry|task|to-do) has been|i(?:'ve| have)\s+(?:created|saved|added)|i (?:created|saved|added))\b/i.test(
    text,
  );
}

function prepareCreateProposal(
  rows: { role: "user" | "assistant"; body: string }[],
  assistantText: string,
  localDate: string,
): { text: string; appended: string } | null {
  const requestIndex = rows.reduce((last, row, index) => (row.role === "user" && requestedKind(row.body) ? index : last), -1);
  if (requestIndex < 0 || handledAfter(rows, requestIndex)) return null;
  const request = rows[requestIndex].body;
  const kind = requestedKind(request)!;
  const latestUser = rows.at(-1);
  const directRequest = latestUser?.role === "user" && requestedKind(latestUser.body) !== null;
  // "add this in note" points at the answer just above, not at the model's reply to this very message.
  const previousIndex = rows.length - 2;
  const previous = rows[previousIndex];
  const refersBack = directRequest && referencesEarlier(request) && previous?.role === "assistant" && !hasSavedClaim(previous.body);
  // When the person points back at earlier content the draft is built from it, even if the model guessed a different draft.
  if (!refersBack && parseChatAction(assistantText).action) return null;
  if (!directRequest && (!latestUser || latestUser.role !== "user" || !affirming(latestUser.body))) return null;
  if (!directRequest && !rows.slice(requestIndex + 1, -1).some((row) => row.role === "assistant" && hasCreateOffer(row.body))) return null;

  const source = refersBack
    ? previous.body
    : directRequest
      ? assistantText
      : ([...rows.slice(requestIndex + 1, -1)]
          .reverse()
          .find((row) => row.role === "assistant" && !hasCreateOffer(row.body) && !hasSavedClaim(row.body))?.body ?? assistantText);
  const cleanSource = falseSavedClaims(parseChatAction(source).body).trim().slice(0, 9_000);
  // The title of a saved answer comes from what was asked for, e.g. "write login page html code", not from "add this in note".
  const asked = refersBack
    ? rows
        .slice(0, previousIndex)
        .reverse()
        .find((r) => r.role === "user")?.body
    : undefined;
  const title = draftTitle(cleanSource, kind, asked ?? request);
  let action: ChatAction;
  if (kind === "note") action = { kind, title, body: cleanSource || request.slice(0, 9_000) };
  else if (kind === "journal") action = { kind, body: cleanSource || request.slice(0, 9_000), entry_date: localDate };
  else action = { kind, title: title.slice(0, 300), description: cleanSource || request.slice(0, 5_000), due_date: null };

  // The model's own text may describe a different draft than the one built here, so it is replaced.
  const safeReply = refersBack
    ? `I’ve prepared a ${kind === "task" ? "to-do" : kind === "journal" ? "journal entry" : "note"} draft from my last answer.`
    : falseSavedClaims(parseChatAction(assistantText).body).trim().slice(0, 4_000);
  const intro = safeReply ? `${safeReply}\n\n` : "";
  const note = "Review this draft below. It will only be saved when you choose Create.";
  const block = `<create-item>${JSON.stringify(action)}</create-item>`;
  return { text: `${intro}${note}\n\n${block}`, appended: `\n\n${note}\n\n${block}` };
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

  const messages: AiMessage[] = [
    { role: "system", content: `${CHAT_PROMPT.system} The user's local calendar date is ${opts.localDate}.` },
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
        if (completed && !cancelled) {
          const prepared = prepareCreateProposal(rows, full, opts.localDate);
          if (prepared) {
            full = prepared.text;
            try {
              controller.enqueue(enc.encode(prepared.appended));
            } catch {
              /* the browser may have navigated away after generation finished */
            }
          }
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
      // Keep an interrupted answer, but never turn an incomplete generation into a create proposal.
      cancelled = true;
      void it.return?.();
    },
  });
  return { ok: true, stream };
}
