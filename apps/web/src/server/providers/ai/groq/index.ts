import "server-only";
import { serverEnv } from "../../../../config/env";
import { AiProviderError, type AiChunk, type AiProvider, type AiRequest } from "../types";

const BASE = "https://api.groq.com/openai/v1";
// Models that don't answer chat messages (speech, text-to-speech, safety classifiers, …).
const NOT_CHAT = /whisper|orpheus|tts|guard|safeguard|embed|allam/i;
const g = globalThis as unknown as { __groqModels?: { ids: string[]; at: number } };

/**
 * The chat models this key can use. Groq retires and adds models often, so none is hard-coded: we ask Groq and keep the
 * answer for 10 minutes. Largest context window first, then the biggest "<n>b" size, so the first entry is the best default.
 */
async function chatModels(key: string, signal?: AbortSignal): Promise<string[]> {
  if (g.__groqModels && Date.now() - g.__groqModels.at < 10 * 60_000) return g.__groqModels.ids;
  const res = await fetch(`${BASE}/models`, { headers: { authorization: `Bearer ${key}` }, signal });
  if (!res.ok) throw new AiProviderError("Couldn’t read the model list.", "groq", res.status === 429 ? "rate_limited" : "failed");
  const { data } = (await res.json()) as { data?: { id: string; active?: boolean; context_window?: number }[] };
  const size = (id: string) => Number(id.match(/(\d+(?:\.\d+)?)b\b/i)?.[1] ?? 0);
  const ids = (data ?? [])
    .filter((m) => m.active !== false && !NOT_CHAT.test(m.id))
    .sort((a, b) => (b.context_window ?? 0) - (a.context_window ?? 0) || size(b.id) - size(a.id) || a.id.localeCompare(b.id))
    .map((m) => m.id);
  if (!ids.length) throw new AiProviderError("This key has no chat model available.", "groq", "not_configured");
  g.__groqModels = { ids, at: Date.now() };
  return ids;
}

/** GROQ_MODEL wins when set; otherwise the best model the key can use. */
async function resolveModel(key: string, signal?: AbortSignal): Promise<string> {
  const fixed = process.env.GROQ_MODEL?.trim();
  return fixed || (await chatModels(key, signal))[0];
}

type Delta = {
  choices?: { delta?: { content?: string }; finish_reason?: string | null }[];
  x_groq?: { usage?: { prompt_tokens?: number; completion_tokens?: number } };
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

/**
 * Groq, called from the server with GROQ_API_KEY (the key never reaches the browser). Uses Groq's OpenAI-compatible chat
 * completions endpoint with streaming and yields text chunks as they arrive, then one `done` chunk with token usage.
 * The model can be changed with GROQ_MODEL.
 */
export const groqProvider: AiProvider = {
  id: "groq",
  label: "Default model",
  note: "Free model",
  runtime: "server",
  isAvailable: () => Boolean(serverEnv().groqApiKey),

  async models(signal) {
    const key = serverEnv().groqApiKey;
    if (!key) return [];
    // The org prefix ("openai/gpt-oss-120b") is noise in a picker; the model name is what people recognise.
    return (await chatModels(key, signal)).map((id) => ({ id, label: id.split("/").pop() ?? id }));
  },

  async *stream(req: AiRequest): AsyncGenerator<AiChunk> {
    const key = serverEnv().groqApiKey;
    if (!key) throw new AiProviderError("The AI isn’t configured on this server.", "groq", "not_configured");

    let res: Response;
    try {
      const modelId = req.model || (await resolveModel(key, req.signal));
      const send = () =>
        fetch(`${BASE}/chat/completions`, {
          method: "POST",
          headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
          body: JSON.stringify({
            model: modelId,
            messages: req.messages,
            temperature: req.temperature ?? 0.6,
            // Reasoning models spend part of this budget thinking before they write the answer, so keep it generous.
            max_tokens: req.maxTokens ?? 2048,
            stream: true,
          }),
          signal: req.signal,
        });
      res = await send();
      // Groq's per-minute limits clear quickly: when it says to wait only a few seconds, wait and try again (twice at most)
      // instead of showing an error for something that fixes itself.
      for (let tries = 0; res.status === 429 && tries < 2; tries++) {
        const wait = Number(res.headers.get("retry-after"));
        if (!Number.isFinite(wait) || wait > 8) break;
        await new Promise((r) => setTimeout(r, Math.max(wait, 1) * 1000));
        res = await send();
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      if (e instanceof AiProviderError) throw e;
      throw new AiProviderError("Couldn’t reach the AI.", "groq", "failed");
    }

    if (!res.ok || !res.body) {
      // Never include the provider's response body in what we throw: it can echo parts of the request.
      throw new AiProviderError(
        res.status === 429 ? "The AI is rate limiting requests. Try again in a moment." : "The AI couldn’t answer that.",
        "groq",
        res.status === 429 ? "rate_limited" : "failed",
      );
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let usage: { inputTokens: number; outputTokens: number } | undefined;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          let j: Delta;
          try {
            j = JSON.parse(data) as Delta;
          } catch {
            continue;
          }
          const text = j.choices?.[0]?.delta?.content;
          if (text) yield { type: "text", text };
          const u = j.x_groq?.usage ?? j.usage;
          if (u) usage = { inputTokens: u.prompt_tokens ?? 0, outputTokens: u.completion_tokens ?? 0 };
        }
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      throw new AiProviderError("The reply was interrupted.", "groq", "failed");
    } finally {
      reader.releaseLock();
    }
    yield { type: "done", usage };
  },
};
