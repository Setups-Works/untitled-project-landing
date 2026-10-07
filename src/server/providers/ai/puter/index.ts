import { AiProviderError, type AiChunk, type AiProvider, type AiRequest } from "../types";

/**
 * Puter.js. NOT IMPLEMENTED YET — Phase 4 task "Puter.js provider".
 *
 * Puter runs in the BROWSER (the user's own Puter account pays for usage, so no server key is needed).
 * That means the real call lives in client code (src/features/ai) and this server-side entry exists only so the
 * provider router can list it and the UI can offer it. The orchestrator must not try to call it from the server:
 * for runtime "client" providers it returns the prompt to the browser and the browser streams the answer back
 * through the same message API so it is stored like any other reply.
 */
export const puterProvider: AiProvider = {
  id: "puter",
  label: "Puter",
  runtime: "client",
  isAvailable: () => false,
  // eslint-disable-next-line require-yield
  async *stream(_req: AiRequest): AsyncGenerator<AiChunk> {
    throw new AiProviderError("Puter runs in the browser and can’t be called from the server.", "puter", "not_implemented");
  },
};
