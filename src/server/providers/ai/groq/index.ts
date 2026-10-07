import { serverEnv } from "../../../../config/env";
import { AiProviderError, type AiChunk, type AiProvider, type AiRequest } from "../types";

/**
 * Groq (server-side, uses GROQ_API_KEY). NOT IMPLEMENTED YET — this is the Phase 4 task "Groq provider".
 * Implement `stream()` against Groq's OpenAI-compatible chat completions endpoint with streaming,
 * map errors to AiProviderError, and report token usage in the final `done` chunk.
 */
export const groqProvider: AiProvider = {
  id: "groq",
  label: "Groq",
  runtime: "server",
  isAvailable: () => false, // becomes `Boolean(serverEnv().groqApiKey)` once stream() is implemented
  // eslint-disable-next-line require-yield
  async *stream(_req: AiRequest): AsyncGenerator<AiChunk> {
    void serverEnv;
    throw new AiProviderError("The Groq provider isn’t implemented yet.", "groq", "not_implemented");
  },
};
