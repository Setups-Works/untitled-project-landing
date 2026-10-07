/**
 * The contract every AI provider implements. The AI orchestrator (src/server/services/ai) talks only to this
 * interface, so adding a provider never touches feature code.
 */

export type AiRole = "system" | "user" | "assistant";
export type AiMessage = { role: AiRole; content: string };

export type AiRequest = {
  messages: AiMessage[];
  /** Provider-specific model id; the provider picks a default when omitted. */
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** Lets the caller cancel a streaming request (user pressed Stop, navigated away). */
  signal?: AbortSignal;
};

export type AiUsage = { inputTokens: number; outputTokens: number };

/** Streamed pieces of an answer. `done` arrives once, last, with token usage when the provider reports it. */
export type AiChunk = { type: "text"; text: string } | { type: "done"; usage?: AiUsage };

export interface AiProvider {
  /** Stable id stored in the database (e.g. "groq"). Never rename it once data exists. */
  readonly id: string;
  readonly label: string;
  /** One line shown under the name in the model picker (e.g. which model answers). */
  readonly note: string;
  /**
   * Where the provider runs. "server" providers use a secret key and are called from src/server.
   * "client" providers (Puter.js) run in the browser and must be called from client code.
   */
  readonly runtime: "server" | "client";
  /** False until the provider is implemented and configured. The UI greys unavailable providers out. */
  isAvailable(): boolean;
  /** Stream an answer. Throws `AiProviderError` on failure. */
  stream(req: AiRequest): AsyncIterable<AiChunk>;
}

export class AiProviderError extends Error {
  constructor(
    message: string,
    public readonly providerId: string,
    public readonly code: "not_implemented" | "not_configured" | "rate_limited" | "failed" = "failed",
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}
