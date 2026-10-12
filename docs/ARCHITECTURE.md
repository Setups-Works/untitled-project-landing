# Architecture

The target system, how code is layered, and the rules that keep three developers' work compatible.

## 1. System overview

```
WEB USER ──► CLOUDFLARE ──► NEXT.JS WEB (Vercel)
                           ├─ marketing + auth pages
                           ├─ user panel + admin panel
                           └─ API v1 routes ◄── shared API client ◄── EXPO / REACT NATIVE (iOS + Android)
  │
  ▼
APPLICATION SERVICES (apps/web/src/server/services)
  Auth · Workspace · Notes · Tasks · Calendar · Email · Journal · Meetings ·
  Automation · Search · Notifications · Integrations · AI Orchestrator
  │
  ├──────────────► SELF-HOSTED      PostgreSQL (RLS, triggers) · Better Auth · S3 object storage · Redis · SSE realtime (all Docker)
  ├──────────────► COMPOSIO         OAuth · tools · triggers · connections → Gmail, Google Calendar, Slack, GitHub
  └──────────────► AI PROVIDER ROUTER   provider abstraction → Groq (server) · Puter.js (browser)

OBSERVABILITY: Sentry (errors) · PostHog (product analytics) · audit logs · AI usage metering
```

## 2. Layers and the one rule that matters

```
UI component  →  feature hook  →  API v1 route / server action  →  service  →  repository  →  PostgreSQL
(apps/web/src/components, (apps/web/src/features)    (apps/web/src/app/api/v1)                (apps/web/src/server/   (apps/web/src/server/
 apps/web/src/features)                                                      services)      repositories)
```

A layer may only import from the layer to its right. Concretely:

| Layer                          | May import                                                | Must not                                          |
| ------------------------------ | --------------------------------------------------------- | ------------------------------------------------- |
| Components / features (client) | hooks, `apps/web/src/lib`, `apps/web/src/types`, `apps/web/src/config` (public part) | `apps/web/src/server/**`, secrets, the database owner role |
| API routes / server actions    | services, `apps/web/src/lib`, zod schemas                          | repositories directly, UI                         |
| Services                       | repositories, providers, other services, `apps/web/src/config`     | `next/*` UI APIs, React                           |
| Repositories                   | `apps/web/src/server/db`, `apps/web/src/types`                              | business rules, other services                    |
| Providers (AI)                 | `apps/web/src/config`, SDK                                         | feature services                                  |

Why: services are reused by the UI (through routes), background jobs, automations and **AI tools**. If rules live in a component, the AI can't use them safely.

## 3. Runtime boundaries

| Where it runs                                       | What                                                                     | Secrets?                   |
| --------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------- |
| Browser                                             | React UI, the `/api/v1/db` client (RLS-protected reads/writes), Puter.js | None. Only `NEXT_PUBLIC_*` |
| Vercel server (route handlers, server actions, RSC) | Services, repositories, Groq calls, Composio calls, Stripe               | Yes — via `serverEnv()`    |
| iOS / Android                                        | Expo app, Better Auth Expo client, shared API transport                   | None; session token in SecureStore |
| Vercel Cron → `/api/v1/jobs/*`                      | Background jobs (sync, transcription, automations, digests)              | Yes, plus `CRON_SECRET`    |
| Self-hosted Docker services                         | Postgres (RLS, triggers), Better Auth, S3 storage, Redis, realtime       | Docker                     |

**Browser → `/api/v1/db`** (validated, allow-listed, run as the user so RLS applies) is allowed for simple, RLS-covered CRUD (current notes/tasks/journal/chat code does this). It is **not** allowed for anything with business rules, side effects, third-party calls, or multi-table atomicity — those go through a service. Phase 1 migrates notes as the reference and the rest follow.

## 4. Multi-tenancy (Phase 1)

- `workspaces`, `workspace_members(role)`; every user gets a personal workspace.
- Domain tables get `workspace_id`; RLS uses `is_workspace_member(workspace_id)`.
- Private-by-author data (journal entries, chats unless shared) additionally checks `user_id = auth.uid()`.
- The active workspace is a cookie resolved once per request by the API helper.

## 5. API v1

`apps/web/src/app/api/v1/<resource>/route.ts`, built with the shared `handler({ auth, schema, rateLimit })` helper (Phase 1): Zod validation, uniform error JSON `{ error: { code, message } }`, cursor pagination, rate limiting. Server actions are fine for form-style UI mutations but call the same services.

## 6. AI architecture

```
Chat UI ──► POST /api/v1/ai/chat ──► AI Orchestrator ──► Provider Router ──► Groq (server stream)
                                          │                         └────► Puter.js (browser runtime)
                                          ├─ builds context (conversation window, workspace data)
                                          ├─ tool calls ──► Composio / our services (writes need user confirmation)
                                          ├─ stores messages + usage (ai_usage)
                                          └─ "No AI" mode when no provider is available
```

- Providers implement `AiProvider` (`apps/web/src/server/providers/ai/types.ts`): `id`, `runtime` (`server`|`client`), `isAvailable()`, `stream()`.
- Puter runs in the browser; the orchestrator hands the prompt to the client, which streams the answer and posts the final message back so storage is identical.
- Tool output and user content are **untrusted**; prompts are versioned files in `apps/web/src/server/services/ai/prompts`.

## 7. Integrations (Composio)

Browser → our `/api/v1/integrations/*` → `apps/web/src/server/services/composio` → Composio. We store only Composio connection ids and a display label — never OAuth tokens. Triggers (new mail, calendar change) arrive at a webhook route, are verified, and become job/automation events.

## 8. Realtime, search, jobs

- **Realtime:** Postgres `pg_notify` triggers → Server-Sent Events (`/api/v1/realtime`) → TanStack Query invalidation.
- **Search:** Postgres full-text (tsvector + GIN) first; pgvector hybrid later.
- **Jobs:** `jobs` table + Vercel Cron; locking prevents double runs; retries with backoff.

## 9. Monorepo and source layout

`apps/web` contains the Next.js app and its tests, `apps/mobile` contains the Expo Router app, and `packages/api-client` contains platform-independent HTTP transport shared by both clients. Database migrations and Docker configuration stay at the repository root. See `AGENTS.md` §3 and each app's folder instructions. Target routes (Phase 0 decides final URLs; today everything signed-in lives under `/dashboard/*`): `docs/CURRENT_STATE.md`.

## 10. Decisions log

Record architectural decisions here with date, decision, and reason. Open decisions are tagged `decision-needed` in Jira.

| Date    | Decision                                                                  | Why                                                                                    |
| ------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 2026-10 | `apps/web/src/` layout and layered server code                                     | Parallel work for 3 developers + AI agents; services reusable by UI, jobs and AI tools |
| 2026-10 | Composio for OAuth/tools; we store connection ids only                    | Avoid handling third-party tokens                                                      |
| 2026-10 | Groq on the server, Puter.js in the browser behind one provider interface | Cheap fast default + bring-your-own-account option                                     |
| _open_  | Final route structure (`(app)` group vs `/dashboard/*`)                   | Jira UNT-49                                                                            |
| _open_  | Embedding provider for semantic search                                    | Jira UNT-86                                                                            |
| _open_  | Transcription provider and email-sending provider                         | Jira UNT-88, UNT-91                                                                    |
