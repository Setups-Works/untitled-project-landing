# Architecture

The target system, how code is layered, and the rules that keep three developers' work compatible.

## 1. System overview

```
USER
  │
  ▼
CLOUDFLARE            DNS · WAF · CDN · rate limiting          (Phase 6)
  │
  ▼
NEXT.JS (Vercel)
  ├─ marketing site            src/app/(marketing)
  ├─ auth pages                src/app/(auth)
  ├─ USER PANEL                dashboard, notes, tasks, calendar, email, journal,
  │                            meetings, automations, integrations, ai, search, insights, settings
  ├─ ADMIN PANEL               src/app/admin/*
  └─ API / Server Actions / Proxy (middleware)      src/app/api/v1, src/proxy.ts
  │
  ▼
APPLICATION SERVICES (src/server/services)
  Auth · Workspace · Notes · Tasks · Calendar · Email · Journal · Meetings ·
  Automation · Search · Notifications · Integrations · AI Orchestrator
  │
  ├──────────────► SUPABASE         PostgreSQL (RLS, functions, triggers) · Auth · Storage · Realtime
  ├──────────────► COMPOSIO         OAuth · tools · triggers · connections → Gmail, Google Calendar, Slack, GitHub
  └──────────────► AI PROVIDER ROUTER   provider abstraction → Groq (server) · Puter.js (browser)

OBSERVABILITY: Sentry (errors) · PostHog (product analytics) · audit logs · AI usage metering
```

## 2. Layers and the one rule that matters

```
UI component  →  feature hook  →  API v1 route / server action  →  service  →  repository  →  Supabase
(src/components, (src/features)    (src/app/api/v1)                (src/server/   (src/server/
 src/features)                                                      services)      repositories)
```

A layer may only import from the layer to its right. Concretely:

| Layer | May import | Must not |
| --- | --- | --- |
| Components / features (client) | hooks, `src/lib`, `src/types`, `src/config` (public part) | `src/server/**`, secrets, Supabase service role |
| API routes / server actions | services, `src/lib`, zod schemas | repositories directly, UI |
| Services | repositories, providers, other services, `src/config` | `next/*` UI APIs, React |
| Repositories | Supabase client, `src/types` | business rules, other services |
| Providers (AI) | `src/config`, SDK | feature services |

Why: services are reused by the UI (through routes), background jobs, automations and **AI tools**. If rules live in a component, the AI can't use them safely.

## 3. Runtime boundaries

| Where it runs | What | Secrets? |
| --- | --- | --- |
| Browser | React UI, Supabase *anon* client (RLS-protected reads/writes), Puter.js | None. Only `NEXT_PUBLIC_*` |
| Vercel server (route handlers, server actions, RSC) | Services, repositories, Groq calls, Composio calls, Stripe | Yes — via `serverEnv()` |
| Vercel Cron → `/api/v1/jobs/*` | Background jobs (sync, transcription, automations, digests) | Yes, plus `CRON_SECRET` |
| Supabase | Postgres (RLS, SQL functions, triggers), Auth, Storage, Realtime | Managed |

**Direct browser → Supabase** is allowed for simple, RLS-covered CRUD (current notes/tasks/journal/chat code does this). It is **not** allowed for anything with business rules, side effects, third-party calls, or multi-table atomicity — those go through a service. Phase 1 migrates notes as the reference and the rest follow.

## 4. Multi-tenancy (Phase 1)

- `workspaces`, `workspace_members(role)`; every user gets a personal workspace.
- Domain tables get `workspace_id`; RLS uses `is_workspace_member(workspace_id)`.
- Private-by-author data (journal entries, chats unless shared) additionally checks `user_id = auth.uid()`.
- The active workspace is a cookie resolved once per request by the API helper.

## 5. API v1

`src/app/api/v1/<resource>/route.ts`, built with the shared `handler({ auth, schema, rateLimit })` helper (Phase 1): Zod validation, uniform error JSON `{ error: { code, message } }`, cursor pagination, rate limiting. Server actions are fine for form-style UI mutations but call the same services.

## 6. AI architecture

```
Chat UI ──► POST /api/v1/ai/chat ──► AI Orchestrator ──► Provider Router ──► Groq (server stream)
                                          │                         └────► Puter.js (browser runtime)
                                          ├─ builds context (conversation window, workspace data)
                                          ├─ tool calls ──► Composio / our services (writes need user confirmation)
                                          ├─ stores messages + usage (ai_usage) 
                                          └─ "No AI" mode when no provider is available
```

- Providers implement `AiProvider` (`src/server/providers/ai/types.ts`): `id`, `runtime` (`server`|`client`), `isAvailable()`, `stream()`.
- Puter runs in the browser; the orchestrator hands the prompt to the client, which streams the answer and posts the final message back so storage is identical.
- Tool output and user content are **untrusted**; prompts are versioned files in `src/server/services/ai/prompts`.

## 7. Integrations (Composio)

Browser → our `/api/v1/integrations/*` → `src/server/services/composio` → Composio. We store only Composio connection ids and a display label — never OAuth tokens. Triggers (new mail, calendar change) arrive at a webhook route, are verified, and become job/automation events.

## 8. Realtime, search, jobs

- **Realtime:** Supabase Realtime filtered by workspace for notes/tasks/chat.
- **Search:** Postgres full-text (tsvector + GIN) first; pgvector hybrid later.
- **Jobs:** `jobs` table + Vercel Cron; locking prevents double runs; retries with backoff.

## 9. Source layout

See `AGENTS.md` §3 and the `AGENTS.md` inside each folder. Target routes (Phase 0 decides the final URLs; today everything signed-in lives under `/dashboard/*`): `docs/CURRENT_STATE.md`.

## 10. Decisions log

Record architectural decisions here with date, decision, and reason. Open decisions are tagged `decision-needed` in Jira.

| Date | Decision | Why |
| --- | --- | --- |
| 2026-10 | `src/` layout and layered server code | Parallel work for 3 developers + AI agents; services reusable by UI, jobs and AI tools |
| 2026-10 | Composio for OAuth/tools; we store connection ids only | Avoid handling third-party tokens |
| 2026-10 | Groq on the server, Puter.js in the browser behind one provider interface | Cheap fast default + bring-your-own-account option |
| *open* | Final route structure (`(app)` group vs `/dashboard/*`) | Jira UNT-49 |
| *open* | Embedding provider for semantic search | Jira UNT-86 |
| *open* | Transcription provider and email-sending provider | Jira UNT-88, UNT-91 |
