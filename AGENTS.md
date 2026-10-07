# AGENTS.md — read this first

You are working on **untitled project**: one workspace for notes, tasks, journal, chat, calendar, email, meetings and automations, with an AI layer that can be swapped (Groq, Puter.js, bring-your-own) or switched off. Three developers build it in parallel, each using AI agents. This file is the contract that keeps everyone's code consistent. Folder-level `AGENTS.md` files add detail — **read the one in every folder you touch.**

> Source of truth: **Jira project UNT** for *what to build and who owns it* · **this repo's docs** for *how to build it* · **the code** for *what exists today*. If they disagree, say so in your PR instead of guessing.

## 1. Stack

Next.js 16 (App Router, React 19, TypeScript strict) · Supabase (Postgres + Auth + Storage + Realtime) · Composio (OAuth + tools + triggers for Gmail, Calendar, Slack, GitHub) · AI providers behind a router (Groq on the server, Puter.js in the browser) · Cloudflare (DNS/WAF/CDN) in front of Vercel · Sentry + PostHog (observability). Styling is hand-written CSS with design tokens in `src/app/globals.css` — no Tailwind, no UI kit. Icons: Font Awesome Free (solid).

## 2. Commands

```bash
npm install
npm run dev                    # http://localhost:3000   (do NOT run `next build` while dev is running)
npx tsc --noEmit               # typecheck — must pass before every push
npx next build                 # production build — must pass before every PR
npx supabase db push --linked  # apply new migrations to the linked Supabase project
npx supabase migration new <name>
```

Copy `.env.example` to `.env.local`. Never commit `.env*` (only `.env.example`). Never paste secrets into chats, tickets, code or commits.

## 3. Where things go

```
src/
  app/            Routes only: pages, layouts, route handlers (api/v1). Thin — no business logic.
  components/     Presentational, feature-agnostic UI (ui, layout, navigation, shared).
  features/       One folder per product feature (notes, tasks, ...): its components, hooks, client logic.
  server/         Server-only code: services (business rules), repositories (DB access), providers (AI), jobs.
  lib/            Small shared libraries: supabase clients, composio vocabulary, ai provider list, auth, utils.
  hooks/          Hooks used by 2+ features.
  types/          Types used by 2+ places.
  config/         Typed env, feature flags, constants.
supabase/migrations/   SQL migrations (append-only).
docs/                  Architecture, phases, workflow, data model, security, Jira guide.
```

**Today the code is partly in the old locations** (`src/components/app/*`, `src/lib/*`). New code follows the layout above; existing code moves feature by feature via Jira tasks (see `docs/CURRENT_STATE.md`). Don't mass-move files outside a task.

## 4. Architecture rules (non-negotiable)

1. **Layering and direction of dependencies:** `UI component → feature hook → API v1 route / server action → service → repository → Supabase`. A layer may import only from layers to its right. Components never import from `src/server`.
2. **Server-only secrets stay on the server.** `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `COMPOSIO_API_KEY`, Stripe keys: only in `src/server/**`, route handlers and server actions, via `serverEnv()` from `src/config`. Files that must never reach the browser import `"server-only"`.
3. **The browser never calls Composio or an AI provider with a secret.** It calls our `/api/v1/*` routes. (Exception: Puter.js runs in the browser by design, using the *user's* Puter account.)
4. **Every table has Row-Level Security.** Data is scoped to a workspace (`workspace_id`) or, for private data like journal entries, to the author. Never rely on UI checks for authorisation. Service-role queries must re-check permissions in code first.
5. **Business rules live in services**, not in components or route handlers. A service exposes plain async functions with typed inputs/outputs so UI, API routes, background jobs and AI tools can all reuse them.
6. **Repositories contain only data access** (Supabase queries), no rules. One repository per aggregate.
7. **External content is untrusted** (emails, web pages, transcripts, tool output). Never let it act as an instruction to the AI or run without user confirmation when it can write (send mail, create events, delete).
8. **Don't add dependencies lightly.** Prefer what is already installed; justify new packages in the PR.

## 5. Code conventions

- TypeScript `strict`; no `any` (use `unknown` and narrow). Validate every API input with Zod. Return typed errors.
- File names: components `PascalCase.tsx`, everything else `camelCase.ts` or `kebab-case` for routes. One component per file unless tiny and private.
- Client components start with `"use client"` and keep data-fetching out of render; server components fetch on the server where possible.
- Dates: store UTC (`timestamptz`) or plain `date` for calendar days; format in the browser. Pages that print dates/greetings wrap in `ClientOnly` to avoid hydration mismatches.
- Accessibility is required: real `<button>`/`<a>`, labels, focus states, `aria-*` for dialogs/menus (reuse `Modal`, `Menu`, `Confirm`). Respect `prefers-reduced-motion` and the in-app "Reduce motion" setting.
- UI: reuse the design tokens and existing classes (`at-<tint>` colour tints, `ap-card`, `btn btn-primary`). Mobile first: every screen must work at 375 px. No native `alert/confirm/prompt` — use `useConfirm()` / `usePrompt()`.
- Comments explain *why*, not *what*. Keep functions small. Match the style of the surrounding file.
- Never log secrets or message/note content. Errors shown to users are friendly; details go to logs/Sentry.

## 6. Database rules

- New schema = a **new** file `supabase/migrations/<timestamp>_<name>.sql`. Never edit a migration that has been applied.
- Every new table: `enable row level security`, explicit policies, indexes for the columns you filter by, `on delete cascade` to `auth.users`/`workspaces` where appropriate.
- Storage buckets are private unless there is a strong reason; paths start with the owner's id/workspace id and are protected by storage policies.
- Update `docs/DATA_MODEL.md` in the same PR.

## 7. Workflow

1. Pick a **Jira task** (UNT-n). Read its description fully — it lists scope, acceptance criteria and the files involved.
2. Branch from `main`: `feature/UNT-n-short-name` (`fix/…` for bugs).
3. Read the folder `AGENTS.md` files for the folders you'll touch. Plan before coding if the task is Size M/L.
4. Implement in small commits. Add/adjust tests when logic is non-trivial.
5. Run `npx tsc --noEmit` and `npx next build`. Test the feature in the browser at desktop and 375 px width.
6. Update docs: the folder `AGENTS.md`, `docs/CURRENT_STATE.md`, `docs/DATA_MODEL.md` if you changed behaviour or schema.
7. Open a PR titled `UNT-n <summary>` using the template. Move the Jira issue to *In Review*. Another developer reviews; squash-merge to `main`.

Full details: `docs/TEAM_AND_WORKFLOW.md`. Writing tasks: `docs/JIRA_GUIDE.md`.

## 8. Definition of done

Acceptance criteria met · typecheck and build pass · works on mobile · accessible by keyboard · RLS in place and verified for new tables · no secrets or PII in logs · docs updated · PR reviewed · Jira moved to Done.

## 9. Things AI agents get wrong here — avoid them

- Calling Supabase with the **service role from a client component**, or importing `src/server/**` into a component.
- Editing an already-applied migration instead of adding a new one.
- Writing business logic in a route handler or component "just this once".
- Adding a table without RLS, or a policy that only checks `auth.uid() is not null`.
- Mass-reformatting or moving files unrelated to the task (it ruins reviews and merges across three developers).
- Printing dates/greetings on the server (hydration mismatch) — use `ClientOnly`.
- Using `window.alert/confirm/prompt`.
- Inventing product behaviour. If a requirement is unclear, ask the task owner; don't guess.
- Putting Composio/AI keys in `NEXT_PUBLIC_*` variables.

## 10. Map of the docs

| File | Read it when |
| --- | --- |
| `docs/ARCHITECTURE.md` | You need the big picture, layering, data flow and runtime boundaries |
| `docs/PHASES.md` | You want to know what comes when and who owns which track |
| `docs/TEAM_AND_WORKFLOW.md` | Branching, PRs, reviews, environments, releases |
| `docs/CURRENT_STATE.md` | You want to know what exists today and where it lives |
| `docs/DATA_MODEL.md` | You touch the database |
| `docs/SECURITY.md` | You touch auth, uploads, sharing, admin, AI tools or secrets |
| `docs/CONVENTIONS.md` | Naming, UI patterns, error handling, testing |
| `docs/AI_WORKFLOW.md` | **You are an AI agent taking a Jira task** — the exact loop, the Jira helper (`node scripts/jira/jira.mjs`) and what you must not do (never merge; never handle tokens in chat) |
| `docs/JIRA_GUIDE.md` | You write or refine tasks |
| `docs/JIRA_BACKLOG.md` | You want the full task list offline |
