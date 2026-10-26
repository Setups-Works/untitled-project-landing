# providers/ai

**Contract:** `types.ts` — `AiProvider { id, label, runtime: "server" | "client", isAvailable(), stream(req) }`, `AiMessage`, `AiRequest`, `AiChunk` (text | done+usage), `AiProviderError`. **Registry:** `index.ts` (`listProviders`, `getProvider`, `defaultProvider`).

| Provider | Folder   | Runtime                                        | Status                                                                                           | Jira   |
| -------- | -------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------ |
| Groq     | `groq/`  | server (`GROQ_API_KEY`, optional `GROQ_MODEL`) | **done** — streams via Groq's OpenAI-compatible API; `isAvailable()` is true when the key is set | UNT-78 |
| Puter.js | `puter/` | **browser** (user's own Puter account)         | **stub**                                                                                         | UNT-79 |
| Your own key | `custom/` | server, with the person's key passed in `req.credentials` | **done** — any OpenAI-compatible provider from the fixed list in `packages/logic/src/billing.ts`; `hidden: true`, so it is never in the picker: the Bring your own key plan selects it (`services/billing` → `aiAccessFor`) | — |

**Adding a provider:** create `<name>/index.ts` exporting an `AiProvider`, add it to `PROVIDERS` in `index.ts`, give it a `label` and `note` (the chat's model picker is built from `/api/v1/ai/status`, nothing is hard-coded in the browser), document env vars in `.env.example` and `apps/web/src/config/env.ts`.

**Rules**

- `stream()` is an async generator: yield `{ type: "text" }` chunks, finish with exactly one `{ type: "done", usage }`. Respect `req.signal`.
- Don't keep conversation state in a provider; the orchestrator owns context.
- Router fallback (UNT-77) uses `isAvailable()` and error `code` (`rate_limited` → try next, `not_configured` → skip).
- `hidden` providers are skipped by `listChoices()` and `defaultProvider()`; callers must also refuse a hidden provider requested by id.
- A provider never reads a person's key itself: the key arrives per request in `credentials`, opened by `services/billing/keyVault.ts`, and is never stored or logged here. The base URL always comes from `BYO_PROVIDERS`, never from user input.
- Every AI call goes through `aiAccessFor()` and `record()` (`docs/BILLING.md`); a new entry point without them is a bug.
