# lib/supabase

| File | Use |
| --- | --- |
| `config.ts` | Reads and **validates** `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` (trims, checks characters). Exposes `supabaseConfigured`, `supabaseProblem`, `safeNext()` |
| `client.ts` | `supabaseBrowser()` — for client components (RLS applies) |
| `server.ts` | `supabaseServer()` — request-scoped client in Server Components / actions (cookie session) |
| `admin.ts` | **Service role**, `import "server-only"`. Helpers: `supabaseAdmin()`, `isAdmin()`, `requireAdmin()`, `assertAdmin()`, `currentUser()`, `listAllUsers()`, `audit()`, `countRows()` |

## Rules

- Pick the least-privileged client that works: browser < server (user session) < admin.
- Service-role code must check the caller first (`assertAdmin()` / a service permission check). It bypasses RLS.
- If you need a rule-heavy query, don't write it in a component — add a repository function (UNT-57).
- Don't read `process.env.NEXT_PUBLIC_SUPABASE_*` directly elsewhere; import from `config.ts`.
