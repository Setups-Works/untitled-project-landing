# src/server — server-only code

**Purpose:** Everything that must never run in the browser: business rules, data access, AI/Composio calls, background jobs. **Owner:** track A (patterns, repositories, jobs) · track C (AI, Composio, calendar, automation services).

```
server/
  services/       business rules, permission checks, orchestration — one folder per domain
  repositories/   Supabase queries only — one file per aggregate
  providers/      third-party adapters behind interfaces (AI providers)
  jobs/           background job handlers (called by /api/v1/jobs/* and Vercel Cron)
```

## Rules

- Files that hold secrets or must not be bundled for the browser start with `import "server-only"`.
- Read secrets only through `serverEnv()` / `requireEnv()` (`src/config`). Never `process.env.X` scattered around.
- **Services** take typed, already-validated input plus an explicit `ctx` (`{ userId, workspaceId, role }`), check permission with `can()`, then call repositories/providers. They return plain data or throw typed errors (`NotFoundError`, `ForbiddenError`, `ValidationError`). No `next/*` or React imports.
- **Repositories** return rows only; no rules, no cross-aggregate logic. Use the request-scoped Supabase client so RLS applies; use the service-role client only when a service has already authorised the action (and say why in a comment).
- A service must be callable from: an API route, a server action, a job, and an AI tool — design signatures accordingly.
- Never log message/note/transcript content or tokens. Log ids and outcomes.

## Today

Only `providers/ai/*` exists (contract, registry, Groq/Puter stubs). The repository/service pattern is created by **UNT-57** with notes as the reference; read it before adding a new service.
