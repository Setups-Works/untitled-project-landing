# src/app/api/v1 — REST API

**Purpose:** The versioned HTTP API used by the UI, background jobs, webhooks and (Puter) browser AI flows. **Not built yet** — foundation is **UNT-56** (Phase 1, track A).

## Layout (target)

```
api/v1/
  notes/route.ts, notes/[id]/route.ts
  tasks/…  journal/…  chats/…  search/route.ts
  workspaces/…  integrations/…  ai/{chat,providers,messages,actions}/route.ts
  billing/webhook/route.ts        (Stripe, signature-verified)
  jobs/<name>/route.ts            (CRON_SECRET only)
  webhooks/composio/route.ts      (verified)
```

## Rules

- Every handler is built with the shared `handler({ auth, schema, rateLimit })` helper: Zod-validated input, resolves the user + active workspace, maps typed service errors to `{ error: { code, message } }`.
- Handlers call **services**, never repositories or Supabase directly. No business logic here.
- Cursor pagination (`?cursor=&limit=`), stable ordering, max limit enforced.
- Streaming endpoints (AI) use Server-Sent Events and honour `request.signal` for cancellation.
- Webhook and job routes verify a signature/secret _before_ doing anything and are idempotent.
- Version in the path. Breaking changes → `/api/v2`, not edits to v1.
- Never return secrets, other users' data, or raw database errors.

**Jira:** UNT-56 (foundation), UNT-57 (reference implementation), UNT-59 (jobs), UNT-70 (Composio), UNT-80 (AI chat).
