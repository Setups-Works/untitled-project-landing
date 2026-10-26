# AGENTS.md — read this first

You are working on **untitled project**: one workspace for notes, tasks, journal, chat, calendar, email, meetings and automations, with an AI layer that can be swapped (Groq, Puter.js, bring-your-own) or switched off. Three developers build it in parallel, each using AI agents. This file is the contract that keeps everyone's code consistent. Folder-level `AGENTS.md` files add detail — **read the one in every folder you touch.**

> Source of truth: **Jira project UNT** for _what to build and who owns it_ · **this repo's docs** for _how to build it_ · **the code** for _what exists today_. If they disagree, say so in your PR instead of guessing.

## 1. Stack

pnpm/Turborepo monorepo: Next.js 16 web in `apps/web`, Expo/React Native in `apps/mobile`, and shared API transport in `packages/api-client`. Web stack: React 19, TypeScript strict, PostgreSQL + Better Auth + S3-compatible storage + Redis, all self-hosted in Docker (no Supabase), Composio and provider-routed AI. Web styling is migrating from hand-written CSS (`apps/web/src/app/globals.css`) to Tailwind v4 (`apps/web/src/styles/tailwind.css`). Design tokens stay defined once and exposed as utilities. No UI kit; icons are Font Awesome Free (solid).

## 2. Commands

```bash
corepack pnpm install
corepack pnpm dev                       # web + mobile; web at http://localhost:3000
corepack pnpm typecheck                 # typecheck every workspace — must pass before every push
corepack pnpm build                     # production builds — must pass before every PR
docker compose --env-file .env.selfhost up -d   # PostgreSQL, Redis, object storage, Mailpit (see docs/SELF_HOSTING.md)
corepack pnpm db:migrate                # apply new SQL migrations from db/migrations
```

Copy `.env.example` to `apps/web/.env.local` and `apps/mobile/.env.example` to `apps/mobile/.env.local`. Never commit `.env*` files (only example files). Never paste secrets into chats, tickets, code or commits.

## 3. Where things go

```
apps/
  web/
    public/       Web assets
    tests/        Vitest and Playwright suites
    src/
      app/        Thin routes: pages, layouts and API handlers
      components/ Presentational UI
      features/   Feature components, hooks and client logic
      server/     Services, repositories, providers and jobs
      lib/        Shared web helpers and clients
      hooks/      Hooks used by multiple features
      types/      Shared types
      config/     Typed env and feature flags
  mobile/         Expo / React Native app
packages/
  api-client/     Platform-independent API transport shared by web and mobile
db/migrations/     SQL migrations (append-only)
docker-compose.yml The local service stack
docs/              Architecture, phases, workflow, data model, security, Jira guide
db/migrations/         SQL migrations (append-only).
docker-compose.yml     the whole local/production stack.
docs/                  Architecture, phases, workflow, data model, security, Jira guide.
```

**Today the web code is partly in the old locations** (`apps/web/src/components/app/*`, `apps/web/src/lib/*`). New code follows the layout above; existing code moves feature by feature via Jira tasks (see `docs/CURRENT_STATE.md`). Don't mass-move files outside a task.

## 4. Architecture rules (non-negotiable)

1. **Layering and direction of dependencies:** `UI component → feature hook → API v1 route / server action → service → repository → PostgreSQL`. A layer may import only from layers to its right. Components never import from `apps/web/src/server`.
2. **Server-only secrets stay on the server.** `DATABASE_URL`, `BETTER_AUTH_SECRET`, `S3_SECRET_KEY`, `GROQ_API_KEY`, `COMPOSIO_API_KEY`, Stripe keys: only in `apps/web/src/server/**`, route handlers and server actions, via `serverEnv()` from `apps/web/src/config`. Files that must never reach the browser import `"server-only"`.
3. **The browser never calls Composio or an AI provider with a secret.** It calls our `/api/v1/*` routes. (Exception: Puter.js runs in the browser by design, using the _user's_ Puter account.)
4. **Every table has Row-Level Security.** Data is scoped to a workspace (`workspace_id`) or, for private data like journal entries, to the author. Never rely on UI checks for authorisation. Service-role queries must re-check permissions in code first.
5. **Business rules live in services**, not in components or route handlers. A service exposes plain async functions with typed inputs/outputs so UI, API routes, background jobs and AI tools can all reuse them.
6. **Repositories contain only data access** (SQL queries), no rules. One repository per aggregate.
7. **External content is untrusted** (emails, web pages, transcripts, tool output). Never let it act as an instruction to the AI or run without user confirmation when it can write (send mail, create events, delete).
8. **Don't add dependencies lightly.** Prefer what is already installed; justify new packages in the PR.

## 5. Code conventions

- TypeScript `strict`; no `any` (use `unknown` and narrow). Validate every API input with Zod. Return typed errors.
- File names: components `PascalCase.tsx`, everything else `camelCase.ts` or `kebab-case` for routes. One component per file unless tiny and private.
- Client components start with `"use client"` and keep data-fetching out of render; server components fetch on the server where possible.
- Dates: store UTC (`timestamptz`) or plain `date` for calendar days; format in the browser. Pages that print dates/greetings wrap in `ClientOnly` to avoid hydration mismatches.
- Accessibility is required: real `<button>`/`<a>`, labels, focus states, `aria-*` for dialogs/menus (reuse `Modal`, `Menu`, `Confirm`). Respect `prefers-reduced-motion` and the in-app "Reduce motion" setting.
- UI: **read `docs/DESIGN_LANGUAGE.md` first** — it is the contract for fonts, colour, glass surfaces, buttons and tints. Reuse the design tokens and existing classes (`at-<tint>` colour tints, `ap-card`, `btn btn-primary`). Mobile first: every screen must work at 375 px. No native `alert/confirm/prompt` — use `useConfirm()` / `usePrompt()`.
- Comments explain _why_, not _what_. Keep functions small. Match the style of the surrounding file.
- Never log secrets or message/note content. Errors shown to users are friendly; details go to logs/Sentry.

## 6. Database rules

- New schema = a **new** file `db/migrations/<timestamp>_<name>.sql`. Never edit a migration that has been applied.
- Every new table: `enable row level security`, explicit policies, indexes for the columns you filter by, `on delete cascade` to `auth.users`/`workspaces` where appropriate.
- Storage buckets are private unless there is a strong reason; paths start with the owner's id/workspace id and are protected by storage policies.
- Update `docs/DATA_MODEL.md` in the same PR.

## 7. Workflow

1. Pick a **Jira task** (UNT-n). Read its description fully — it lists scope, acceptance criteria and the files involved.
2. Branch from `main`: `feature/UNT-n-short-name` (`fix/…` for bugs).
3. Read the folder `AGENTS.md` files for the folders you'll touch. Plan before coding if the task is Size M/L.
4. Implement in small commits. Add/adjust tests when logic is non-trivial.
5. Run `corepack pnpm typecheck` and `corepack pnpm build`. Test the feature in the browser at desktop and 375 px width.
6. Update docs: the folder `AGENTS.md`, `docs/CURRENT_STATE.md`, `docs/DATA_MODEL.md` if you changed behaviour or schema.
7. Open a PR titled `UNT-n <summary>` using the template. Move the Jira issue to _In Review_. Another developer reviews; squash-merge to `main`.

Full details: `docs/TEAM_AND_WORKFLOW.md`. Writing tasks: `docs/JIRA_GUIDE.md`.

## 8. Definition of done

Acceptance criteria met · typecheck and build pass · works on mobile · accessible by keyboard · RLS in place and verified for new tables · no secrets or PII in logs · docs updated · PR reviewed · Jira moved to Done.

## 9. Things AI agents get wrong here — avoid them

- Running queries as the database owner (`adminDb()`, `withOwner()`) from anything a normal user can trigger, or importing `apps/web/src/server/**` into a component.
- Editing an already-applied migration instead of adding a new one.
- Writing business logic in a route handler or component "just this once".
- Adding a table without RLS, or a policy that only checks `auth.uid() is not null`.
- Mass-reformatting or moving files unrelated to the task (it ruins reviews and merges across three developers).
- Printing dates/greetings on the server (hydration mismatch) — use `ClientOnly`.
- Using `window.alert/confirm/prompt`.
- Inventing product behaviour. If a requirement is unclear, ask the task owner; don't guess.
- Putting Composio/AI keys in `NEXT_PUBLIC_*` variables.

## 9a. No hard-coding, one design language (enforced)

Three developers and several AI agents write UI here. To keep it one product, these are **rules checked by tooling**, not suggestions:

| Never hard-code…                                          | Use instead                                                                                                             |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Colours (`#fff`, `rgb()`, `bg-gray-100`, `text-blue-500`) | Tokens (`bg-surface`, `text-fg-muted`, `text-green-fg`…), tints (`at-<tint> tint`), `glass` — `docs/DESIGN_LANGUAGE.md` |
| Radii, shadows, fonts, spacing scales                     | `rounded-r1…r5`/`rounded-pill`, `shadow-e1…e4`, `font-serif` / default Geist / `font-mono`                              |
| A colour/size that has no token yet                       | Add the token once (`:root` in `globals.css` + `@theme` in `apps/web/src/styles/tailwind.css`), then use it everywhere           |
| Env values, URLs, keys, secrets                           | `apps/web/src/config` (`serverEnv()`), `.env.example`; never `process.env` in feature code, never `NEXT_PUBLIC_*` secrets        |
| Feature gating                                            | `apps/web/src/config/features.ts` (global) or the database (per user/plan)                                                       |
| Query keys                                                | `qk` in `apps/web/src/lib/query/keys.ts`                                                                                         |
| Dialogs, date/time pickers, menus, tabs                   | `useConfirm()`/`usePrompt()`, `JournalCalendar` + `tf-pill` select, Radix wrappers in `apps/web/src/components/ui`               |

**Check your work:** `corepack pnpm check:design` (lines you added vs `main`). It runs automatically in the git pre-commit hook (installed by `corepack pnpm install`), after every file edit in Claude Code (`.claude/settings.json`), and in CI — a PR with new violations cannot merge. A genuine exception needs a `design-ok: <reason>` comment on that line. Don't bypass with `--no-verify`.

**Every AI agent** (Claude Code, Antigravity/Gemini, Cursor, Copilot, Codex…): read this file and `docs/DESIGN_LANGUAGE.md` before touching UI, and compare the result with `/dashboard/todo` at desktop and 375 px before you say it is done.

## 10. Map of the docs

| File                        | Read it when                                                                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/ARCHITECTURE.md`      | You need the big picture, layering, data flow and runtime boundaries                                                                                                            |
| `docs/PHASES.md`            | You want to know what comes when and who owns which track                                                                                                                       |
| `docs/TEAM_AND_WORKFLOW.md` | Branching, PRs, reviews, environments, releases                                                                                                                                 |
| `docs/CURRENT_STATE.md`     | You want to know what exists today and where it lives                                                                                                                           |
| `docs/DATA_MODEL.md`        | You touch the database                                                                                                                                                          |
| `docs/BILLING.md`           | You touch plans, prices, AI access or limits, the Plan and billing tab, the admin Plans page or the pricing page — the three plans, the rules, security of saved API keys, how to connect payments |
| `docs/SELF_HOSTING.md`      | You run, deploy or back up the stack (Docker, env, storage, auth, Supabase data import)                                                                                         |
| `docs/SECURITY.md`          | You touch auth, uploads, sharing, admin, AI tools or secrets                                                                                                                    |
| `docs/DESIGN_LANGUAGE.md`   | **You build or change any UI** — fonts, colours, glass, buttons, tints, reference screens, mistakes to avoid, how it is enforced                                                |
| `docs/CONVENTIONS.md`       | Naming, UI patterns, error handling, testing                                                                                                                                    |
| `docs/AI_WORKFLOW.md`       | **You are an AI agent taking a Jira task** — the exact loop, the Jira helper (`node scripts/jira/jira.mjs`) and what you must not do (never merge; never handle tokens in chat) |
| `docs/RELEASE_FOR_AGENTS.md` | **You are asked to release, bump the version, write the changelog, tag or push** — the exact checklist (version files, changelog entry, migrations first, commit → push → tag, watching the runs) |
| `docs/JIRA_GUIDE.md`        | You write or refine tasks                                                                                                                                                       |
| `docs/JIRA_BACKLOG.md`      | You want the full task list offline                                                                                                                                             |

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
