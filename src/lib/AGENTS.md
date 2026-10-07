# src/lib — small shared libraries

**Purpose:** Code usable from both client and server that isn't a feature or a service: the browser data client, vocabulary/types for integrations, the client-safe AI provider list, auth helpers, pure utilities. **Anything needing a secret belongs in `src/server`.**

| Folder / file   | What                                                                                                     | Safe in browser?                                             |
| --------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `api/`          | `builder.ts` (typed query builder), `client.ts` (browser `api()`: `from`, `storage`)                     | yes                                                          |
| `composio/`     | Integration vocabulary and types                                                                         | yes                                                          |
| `ai/`           | Client-safe list of AI options shown in the composer                                                     | yes                                                          |
| `auth/`         | `client.ts` (Better Auth browser client), `redirect.ts` (`safeNext`); roles/permissions helpers (UNT-58) | yes                                                          |
| `utils/`        | Generic helpers (planned home for `dates`, `validate`, formatting)                                       | yes                                                          |
| `*.ts` (legacy) | `dates`, `prefs`, `notes`, `tasks`, `chat`, `insights`, `workspace` (types), `site`, `logos`, `validate` | yes — feature helpers move to their feature folder over time |

## Rules

- No React components here. No database queries except through `api/`.
- Pure functions with unit tests wherever there's logic (`dates`, `tasks`, `insights`, `prefs`).
- Owner-level database access lives in `src/server/session.ts` (`adminDb()`) — keep its use rare, behind explicit permission checks, never imported from client components.
- Don't add feature-specific code here "because it's shared by two files" — put it in the feature.
