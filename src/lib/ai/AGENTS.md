# lib/ai

**Contents:** `providers.ts` — the client-safe list of AI options the composer shows (`PROVIDERS`: id, label, note, `available`). `index.ts` re-exports it.

This is a **UI list**, not the real provider implementations (those are `src/server/providers/ai`). When a provider becomes real (UNT-78/79), flip `available` here (or, better, derive it from `/api/v1/ai/providers`). No keys, no SDKs, no network calls in this folder.
