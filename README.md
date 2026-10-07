# untitled project

One workspace for **notes, tasks, journal, chat, calendar, email, meetings and automations** — with an AI layer you can swap, bring your own account to, or switch off entirely.

This repository contains the marketing site **and** the signed-in app (user panel + admin panel). Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **PostgreSQL + Better Auth + S3 storage + Redis, self-hosted in Docker**. Styling is moving from hand-written CSS with design tokens to Tailwind v4 (see `AGENTS.md`).

> **Working on this project?** Read [`AGENTS.md`](AGENTS.md) (rules for humans _and_ AI agents), then [`docs/ONBOARDING.md`](docs/ONBOARDING.md). Plan and tasks live in Jira: https://setups-works.atlassian.net/jira/software/projects/UNT/boards

## What's built

- **Marketing site** — home, how it works, product demo, pricing, early users, privacy & security, feature pages with interactive demos.
- **Accounts** — email + password, Google sign-in, forgot/reset password, email verification (Better Auth).
- **App** — Home, **Journal** (many timestamped entries per day, calendar, voice, attachments), **Notes** (colour cards, editor, slash commands, voice, attachments, history), **To-do** (lists, priorities, repeat, Inbox/Today/Upcoming/Filters, board and calendar layouts, shortcuts), **Chat** (folders, pin, unread, share links — AI replies come in Phase 4), **universal search** (Ctrl/⌘+K), **settings** popup, personality insights computed from your own data.
- **Admin panel** — overview, users (invite, plan, ban, delete), usage, announcements, audit log.

What's planned (workspaces, Calendar, Email, AI, Meetings, Automations, billing…) is in [`docs/PHASES.md`](docs/PHASES.md) and the Jira board.

## Getting started

Requires **Node.js 20+** (CI uses 22) and **Docker**. Everything the app needs runs in Docker: PostgreSQL, Redis, S3-compatible object storage and a local mail catcher. There is no third-party backend service.

```bash
npm install
cp .env.selfhost.example .env.selfhost     # set the passwords (openssl rand -hex 16)
cp .env.example .env.local                 # use the same passwords
npm run docker:up                          # PostgreSQL, Redis, storage, Mailpit
npm run db:migrate                         # create the tables
npm run dev                                # http://localhost:3000   (emails: http://localhost:8025)
```

Or run the whole thing, app included, in Docker: `docker compose --env-file .env.selfhost --profile app up -d --build`. Full guide (backups, production, Google sign-in, moving data from Supabase): [`docs/SELF_HOSTING.md`](docs/SELF_HOSTING.md).

| Command              | Purpose                                       |
| -------------------- | --------------------------------------------- |
| `npm run dev`        | Dev server with hot reload                    |
| `npm run docker:up`  | Start the data services                       |
| `npm run db:migrate` | Apply new SQL migrations from `db/migrations` |
| `npx tsc --noEmit`   | Typecheck (must pass before every push)       |
| `npx next build`     | Production build (must pass before every PR)  |

> Don't run `next build` while `npm run dev` is running — both write to `.next`. Stop dev (or delete `.next`) first.

### Environment variables

See [`.env.example`](.env.example). Never commit `.env*` files; never prefix a secret with `NEXT_PUBLIC_`.

| Variable                                                               | Needed for                                              |
| ---------------------------------------------------------------------- | ------------------------------------------------------- |
| `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`                | Everything signed-in (without them pages show a notice) |
| `REDIS_URL`                                                            | Cache and rate limits (optional; the app runs without)  |
| `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`                        | Avatars, note/journal/chat attachments                  |
| `SMTP_URL`, `MAIL_FROM`                                                | Verification, password reset and invitation emails      |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                             | Optional "Continue with Google"                         |
| `ADMIN_EMAILS`                                                         | Comma-separated emails that are always admins           |
| `GROQ_API_KEY`, `COMPOSIO_API_KEY`, `CRON_SECRET`, Sentry/PostHog keys | Later phases                                            |

## Project structure

```
src/
  app/          Routes: marketing, auth, dashboard (signed-in app), admin, share/[token], api/v1
  components/   Shared UI (ui, layout, navigation, shared) + legacy feature UI being migrated
  features/     One folder per product feature (notes, tasks, journal, calendar, email, meetings,
                automation, integrations, ai, search, insights, workspace, settings)
  server/       Server-only: services, repositories, providers (AI), jobs
  lib/          browser data client (api/), composio vocabulary, ai provider list, auth client, utils
  hooks/  types/  config/
db/             SQL migrations (append-only)
docker-compose.yml  PostgreSQL, Redis, object storage, Mailpit (+ the app with `--profile app`)
docs/           Architecture, phases, workflow, data model, security, Jira guide
```

Every folder has an `AGENTS.md` explaining its purpose and rules. Today part of the code still lives in the legacy locations (`src/components/app/*`, `src/lib/*`); [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) maps what is where.

## Documentation

[`docs/README.md`](docs/README.md) is the index: onboarding, architecture, phases, team workflow, current state, data model, security, conventions, Jira guide and the full backlog.

## Design system

Tokens are at the top of `src/app/globals.css`: canvas `#f5f4eb`, ink `#1b1c14`, forest-green accent `#1f5d49`; categorisation tints (violet, blue, green, amber, clay, sand, mint, gold) applied with `at-<tint>` classes. Type: Instrument Serif (display), Geist (UI), Geist Mono. Pill buttons, hairline inset rings, slow ambient motion that respects `prefers-reduced-motion`.

## Deploying

Docker Compose on any server (see [`docs/SELF_HOSTING.md`](docs/SELF_HOSTING.md)): put a TLS proxy (Caddy/Traefik/Cloudflare) in front of the `web` service, use real SMTP, strong passwords, and set `BETTER_AUTH_URL` to the public address. Back up PostgreSQL and the storage volume.

## Logos & trademarks

Files in `public/logos/` belong to their respective owners and are shown only to indicate supported integrations. Icons elsewhere are [Font Awesome Free](https://fontawesome.com) (solid).

---

Backed by **Setups Works** (செட்டப்ஸ் வொர்க்ஸ்).
