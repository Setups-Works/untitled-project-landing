import "server-only";
import { estimateTokens } from "@untitled/logic/billing";
import { AiProviderError, defaultProvider, parseChoice, type AiChunk, type AiMessage, type AiUsage } from "../../providers/ai";
import { customProvider } from "../../providers/ai/custom";
import { ServiceError } from "../../errors";
import { aiAccessFor } from "../billing/billing.service";
import { underRateLimit } from "./chat";
import { NOTE_ASSIST_PROMPT, type NoteAction } from "./prompts/noteAssist";

const MAX_CHARS = 20_000;

export type NoteAssistResult = { ok: true; stream: ReadableStream<Uint8Array> } | { ok: false; status: number; error: string };

/**
 * Runs one AI action on a piece of a note and streams the result back as text. Nothing is saved here: the editor shows the result
 * and the person decides whether to apply it. Uses the chosen server provider (Groq by default). Note text is never logged.
 */
export async function startNoteAssist(opts: {
  userId: string;
  action: NoteAction;
  text: string;
  instruction?: string;
  providerId?: string;
  signal?: AbortSignal;
}): Promise<NoteAssistResult> {
  // The person's plan decides how AI is paid for: their own key, or ours counted against an allowance or by use.
  let access: Awaited<ReturnType<typeof aiAccessFor>>;
  try {
    access = await aiAccessFor(opts.userId);
  } catch (e) {
    if (e instanceof ServiceError) return { ok: false, status: e.status, error: e.message };
    throw e;
  }
  const byo = access.byo;
  const picked = opts.providerId ? parseChoice(opts.providerId) : null;
  const provider = byo
    ? customProvider
    : picked?.provider && !picked.provider.hidden && picked.provider.runtime === "server" && picked.provider.isAvailable()
      ? picked.provider
      : defaultProvider();
  if (!provider) return { ok: false, status: 400, error: "Connect an AI provider to use AI actions." };
  // Only models the provider itself lists may be used, so a crafted id can't pick an arbitrary model.
  const model = byo
    ? byo.model
    : picked?.provider === provider && picked.model && (await provider.models?.().catch(() => []))?.some((m) => m.id === picked.model)
      ? picked.model
      : undefined;
  if (!(await underRateLimit(opts.userId))) return { ok: false, status: 429, error: "Too many AI requests. Wait a moment and try again." };

  const messages: AiMessage[] = [
    { role: "system", content: NOTE_ASSIST_PROMPT.system },
    { role: "user", content: `${NOTE_ASSIST_PROMPT.task(opts.action, opts.instruction)}\n\n<note>\n${opts.text.slice(0, MAX_CHARS)}\n</note>` },
  ];
  const it = provider
    .stream({ messages, model, temperature: 0.4, signal: opts.signal, ...(byo ? { credentials: { apiKey: byo.apiKey, baseUrl: byo.baseUrl } } : {}) })
    [Symbol.asyncIterator]();
  const promptChars = messages.reduce((n, m) => n + m.content.length, 0);

  // Pull the first piece before replying, so a configuration or rate-limit problem becomes a proper error response.
  let step: IteratorResult<AiChunk>;
  try {
    step = await it.next();
  } catch (e) {
    const err = e instanceof AiProviderError ? e : null;
    return { ok: false, status: err?.code === "rate_limited" ? 429 : 502, error: err?.message ?? "The AI couldn’t do that." };
  }

  const enc = new TextEncoder();
  let written = 0;
  let usage: AiUsage | undefined;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (!step.done) {
          if (step.value.type === "text") {
            written += step.value.text.length;
            controller.enqueue(enc.encode(step.value.text));
          }
          if (step.value.type === "done") usage = step.value.usage;
          step = await it.next();
        }
      } catch {
        /* a broken stream keeps whatever was already written */
      } finally {
        await access
          .record(usage ?? { inputTokens: estimateTokens(promptChars), outputTokens: estimateTokens(written) }, provider.id)
          .catch(() => undefined);
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
