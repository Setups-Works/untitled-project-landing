# src/features — one folder per product feature

**Purpose:** Everything the *client* needs for a feature: components, hooks, client-side state and helpers. Business rules and data access are in `src/server`.

## Structure of a feature folder

```
features/<name>/
  AGENTS.md          what it does, tables, API routes, owner, status, Jira keys
  components/        feature UI (may import src/components/*)
  hooks/             data hooks (call /api/v1 or server actions)
  lib/               pure helpers for this feature (+ unit tests)
  types.ts           feature types (shared ones go in src/types)
  index.ts           the feature's public exports — other code imports only from here
```

## Rules

- A feature may import `src/components`, `src/hooks`, `src/lib`, `src/types`, `src/config` — **never another feature's internals**. Cross-feature needs go through its `index.ts` (or a shared hook/type).
- Features never import `src/server/**`.
- Migrating existing code: move components + helpers in one PR per feature, no behaviour change, parity checklist in the PR (Jira: UNT-60 notes, UNT-61 tasks, UNT-62 journal, UNT-81 chat/AI, UNT-69 insights, UNT-63 search).

| Feature | Track | Phase | State |
| --- | --- | --- | --- |
| `auth` | A | 0–1 | built (in `components/auth`, `lib/supabase`) |
| `workspace` | A | 1 | planned (UNT-55) |
| `notes`, `tasks`, `journal`, `search`, `insights` | B | 2 | built in legacy location → migrate |
| `calendar`, `email` | B (UI) + C (services) | 3 | planned |
| `integrations` | B (UI) + C (service) | 3 | planned |
| `ai` | C (+ B for chat UI) | 4 | planned |
| `meetings`, `automation` | B (UI) + C (engine) | 5 | planned |
