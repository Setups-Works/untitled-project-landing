import "server-only";
import { AiProviderError, type AiChunk, type AiProvider, type AiRequest } from "../types";

type Delta = {
  choices?: { delta?: { content?: string | null } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number } | null;
};

/**
 * The "bring your own key" provider: an OpenAI-compatible chat endpoint, called with the person's own key (passed in the request,
 * never kept here). The address always comes from the fixed provider list in @untitled/logic/billing, never from user input, so the
 * server can only reach those hosts. It doesn't appear in the model picker: the plan decides when it is used.
 */
export const customProvider: AiProvider = {
  id: "custom",
  label: "Your own key",
  note: "Your AI provider",
  runtime: "server",
  hidden: true,
  isAvailable: () => true,

  async *stream(req: AiRequest): AsyncGenerator<AiChunk> {
    const c = req.credentials;
    if (!c || !req.model) throw new AiProviderError("Add your API key in Settings → Plan and billing to use AI.", "custom", "not_configured");

    let res: Response;
    try {
      res = await fetch(`${c.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { authorization: `Bearer ${c.apiKey}`, "content-type": "application/json" },
        // Some providers reject temperature or max-token settings on certain models, so only the essentials are sent.
        body: JSON.stringify({ model: req.model, messages: req.messages, stream: true, stream_options: { include_usage: true } }),
        signal: req.signal,
      });
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      throw new AiProviderError("Couldn’t reach your AI provider.", "custom", "failed");
    }

    if (!res.ok || !res.body) {
      // The provider's response body is never included: it can echo parts of the request or the key.
      const msg =
        res.status === 401 || res.status === 403
          ? "Your AI provider didn’t accept your key. Check it in Settings → Plan and billing."
          : res.status === 404
            ? "Your AI provider doesn’t know that model. Check the model name in Settings → Plan and billing."
            : res.status === 429
              ? "Your AI provider is rate limiting requests. Try again in a moment."
              : "Your AI provider couldn’t answer that.";
      throw new AiProviderError(msg, "custom", res.status === 429 ? "rate_limited" : "failed");
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
          if (j.usage) usage = { inputTokens: j.usage.prompt_tokens ?? 0, outputTokens: j.usage.completion_tokens ?? 0 };
        }
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      throw new AiProviderError("The reply was interrupted.", "custom", "failed");
    } finally {
      reader.releaseLock();
    }
    yield { type: "done", usage };
  },
};
