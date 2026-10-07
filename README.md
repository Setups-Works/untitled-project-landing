# untitled project

One workspace for **notes, tasks, journal, chat, calendar, email, meetings and automations** — with an AI layer you can swap, bring your own account to, or switch off entirely.

This repository contains the marketing site **and** the signed-in app (user panel + admin panel). Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Supabase** (Postgres, Auth, Storage, Realtime). Styling is hand-written CSS with design tokens — no Tailwind, no UI kit.

> **Working on this project?** Read [`AGENTS.md`](AGENTS.md) (rules for humans _and_ AI agents), then [`docs/ONBOARDING.md`](docs/ONBOARDING.md). Plan and tasks live in Jira: https://setups-works.atlassian.net/jira/software/projects/UNT/boards

## What's built

- **Marketing site** — home, how it works, product demo, pricing, early users, privacy & security, feature pages with interactive demos.
- **Accounts** — email + password, Google sign-in, forgot/reset password (Supabase Auth).
- **App** — Home, **Journal** (many timestamped entries per day, calendar, voice, attachments), **Notes** (colour cards, editor, slash commands, voice, attachments, history), **To-do** (lists, priorities, repeat, Inbox/Today/Upcoming/Filters, board and calendar layouts, shortcuts), **Chat** (folders, pin, unread, share links — AI replies come in Phase 4), **universal search** (Ctrl/⌘+K), **settings** popup, personality insights computed from your own data.
- **Admin panel** — overview, users (invite, plan, ban, delete), usage, announcements, audit log.

What's planned (workspaces, Calendar, Email, AI, Meetings, Automations, billing…) is in [`docs/PHASES.md`](docs/PHASES.md) and the Jira board.

## Getting started

Requires Node.js 20+ (CI uses 22).

```bash
npm install
cp .env.example .env.local    # fill in the dev values — see below
npm run dev                   # http://localhost:3000
```

| Command                         | Purpose                                             |
| ------------------------------- | --------------------------------------------------- |
| `npm run dev`                   | Dev server with hot reload                          |
| `npx tsc --noEmit`              | Typecheck (must pass before every push)             |
| `npx next build`                | Production build (must pass before every PR)        |
| `npx supabase db push --linked` | Apply new migrations to the linked Supabase project |

> Don't run `next build` while `npm run dev` is running — both write to `.next`. Stop dev (or delete `.next`) first.

### Environment variables

See [`.env.example`](.env.example). Never commit `.env*` files; never prefix a secret with `NEXT_PUBLIC_`.

| Variable                                                               | Needed for                                                     |
| ---------------------------------------------------------------------- | -------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`            | Everything signed-in (without them pages show a setup notice)  |
| `SUPABASE_SERVICE_ROLE_KEY`                                            | Admin panel, public chat links, account deletion (server only) |
| `ADMIN_EMAILS`                                                         | Comma-separated emails that are always admins                  |
| `GROQ_API_KEY`, `COMPOSIO_API_KEY`, `CRON_SECRET`, Sentry/PostHog keys | Later phases                                                   |

If a key contains an invalid character (a pasted "…", a quote or a space) the login page names the variable that's wrong.

### Supabase setup

1. Create a project; copy the URL and anon key into `.env.local`.
2. Authentication → URL Configuration: set _Site URL_ and add `<site>/auth/callback` to _Redirect URLs_ (local and production).
3. Enable the Google provider if you want Google sign-in.
4. Apply the migrations in `supabase/migrations/` (`npx supabase login`, `npx supabase link --project-ref <ref>`, `npx supabase db push --linked`).

## Project structure

```
src/
  app/          Routes: marketing, auth, dashboard (signed-in app), admin, share/[token], api/v1
  components/   Shared UI (ui, layout, navigation, shared) + legacy feature UI being migrated
  features/     One folder per product feature (notes, tasks, journal, calendar, email, meetings,
                automation, integrations, ai, search, insights, workspace, settings)
  server/       Server-only: services, repositories, providers (AI), jobs
  lib/          Supabase clients, composio vocabulary, ai provider list, auth, utils
  hooks/  types/  config/
supabase/       config + migrations (append-only)
docs/           Architecture, phases, workflow, data model, security, Jira guide
```

Every folder has an `AGENTS.md` explaining its purpose and rules. Today part of the code still lives in the legacy locations (`src/components/app/*`, `src/lib/*`); [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) maps what is where.

## Documentation

[`docs/README.md`](docs/README.md) is the index: onboarding, architecture, phases, team workflow, current state, data model, security, conventions, Jira guide and the full backlog.

## Design system

Tokens are at the top of `src/app/globals.css`: canvas `#f5f4eb`, ink `#1b1c14`, forest-green accent `#1f5d49`; categorisation tints (violet, blue, green, amber, clay, sand, mint, gold) applied with `at-<tint>` classes. Type: Instrument Serif (display), Geist (UI), Geist Mono. Pill buttons, hairline inset rings, slow ambient motion that respects `prefers-reduced-motion`.

## Deploying

Vercel (production) with Cloudflare in front (Phase 6). Set the environment variables above for Production and Preview, set Supabase's Site URL and redirect URLs to the deployed domain, and **redeploy without build cache** after changing any `NEXT_PUBLIC_*` value (they are baked in at build time).

## Logos & trademarks

Files in `public/logos/` belong to their respective owners and are shown only to indicate supported integrations. Icons elsewhere are [Font Awesome Free](https://fontawesome.com) (solid).

---

Backed by **Setups Works** (செட்டப்ஸ் வொர்க்ஸ்).
