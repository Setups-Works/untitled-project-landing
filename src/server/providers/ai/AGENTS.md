# providers/ai

**Contract:** `types.ts` — `AiProvider { id, label, runtime: "server" | "client", isAvailable(), stream(req) }`, `AiMessage`, `AiRequest`, `AiChunk` (text | done+usage), `AiProviderError`. **Registry:** `index.ts` (`listProviders`, `getProvider`, `defaultProvider`).

| Provider | Folder   | Runtime                                        | Status                                                                                           | Jira   |
| -------- | -------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------ |
| Groq     | `groq/`  | server (`GROQ_API_KEY`, optional `GROQ_MODEL`) | **done** — streams via Groq's OpenAI-compatible API; `isAvailable()` is true when the key is set | UNT-78 |
| Puter.js | `puter/` | **browser** (user's own Puter account)         | **stub**                                                                                         | UNT-79 |

**Adding a provider:** create `<name>/index.ts` exporting an `AiProvider`, add it to `PROVIDERS` in `index.ts`, give it a `label` and `note` (the chat's model picker is built from `/api/v1/ai/status`, nothing is hard-coded in the browser), document env vars in `.env.example` and `src/config/env.ts`.

**Rules**

- `stream()` is an async generator: yield `{ type: "text" }` chunks, finish with exactly one `{ type: "done", usage }`. Respect `req.signal`.
- Don't keep conversation state in a provider; the orchestrator owns context.
- Router fallback (UNT-77) uses `isAvailable()` and error `code` (`rate_limited` → try next, `not_configured` → skip).
