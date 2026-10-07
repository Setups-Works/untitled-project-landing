# src/config

| File | Purpose |
| --- | --- |
| `env.ts` | Typed environment access. `publicEnv` (browser-safe `NEXT_PUBLIC_*`), `serverEnv()` (secrets — throws if called in the browser), `requireEnv(name)` |
| `features.ts` | Global feature flags. A flag turns `true` when its Jira epic ships. UI reads `FEATURES.x` / `isEnabled()` |
| `index.ts` | Re-exports |

**Rules**
- Add every new environment variable in **three places**: here (typed access), `.env.example` (with a comment), and `docs/SECURITY.md` (secrets inventory). Secrets never start with `NEXT_PUBLIC_`.
- Supabase URL/key validation stays in `src/lib/supabase/config.ts` (needed by the edge proxy).
- Per-user/per-plan gating belongs in the database (entitlements, UNT-39), not here.
