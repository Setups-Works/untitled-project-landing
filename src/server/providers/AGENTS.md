# src/server/providers

**Purpose:** Adapters to third-party services, each behind an interface so the rest of the code never depends on a vendor. Today: `ai/` (Groq, Puter). Later maybe: transcription, embeddings, email sending. **Owner:** track C.

## Rules

- One folder per vendor under its capability (`ai/groq`, `ai/puter`). A new vendor = a new folder implementing the capability interface + one line in the registry — nothing else changes.
- Providers read secrets via `serverEnv()`; they expose `isAvailable()` so the UI/router can degrade gracefully.
- Map vendor errors to our typed errors (`AiProviderError` with `code`). Never leak vendor error bodies to users.
- No imports from `src/server/services` (providers are leaf dependencies).
- Add contract tests with a fake provider so the orchestrator can be tested without network.
