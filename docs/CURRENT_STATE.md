# Current state (what exists today)

*Update this file whenever behaviour or locations change. Last reviewed: 2026-10.*

The product works end to end on Supabase, but the code still sits in the pre-architecture locations. New work follows the target layout in `AGENTS.md`; existing code moves feature by feature through Jira tasks.

## Routes

| Area | Routes today | Source |
| --- | --- | --- |
| Marketing | `/`, `/how-it-works`, `/demo`, `/pricing`, `/early-users`, `/privacy-security`, `/universal-search`, `/context-graph`, `/daily-brief` | `src/app/*`, `src/components/{Client,PageKit,SiteChrome,Areas,...}.tsx` |
| Auth | `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback` | `src/app/*`, `src/components/auth/*`, `src/lib/supabase/*` |
| App (signed in) | `/dashboard` (Home), `/dashboard/journal`, `/dashboard/chat`, `/dashboard/notes`, `/dashboard/todo` | `src/app/dashboard`, `src/components/app/*` |
| Public share | `/share/[token]` (read-only chat) | `src/app/share/[token]/page.tsx` |
| Admin | `/admin`, `/admin/users`, `/admin/usage`, `/admin/announcements`, `/admin/audit` | `src/app/admin`, `src/components/admin/*` |
| Gate | Proxy redirects signed-out visitors away from `/dashboard` and `/admin`; admin role re-checked in the admin layout | `src/proxy.ts`, `src/lib/supabase/admin.ts` |

Target URLs (`/notes`, `/tasks`, …, route groups `(marketing)`, `(auth)`, `(app)`) are decided in **UNT-49**.

## Features: status and where they live

| Feature | Status | Code today | Backed by | Moves to |
| --- | --- | --- | --- | --- |
| Auth (email, Google, reset) | ✅ | `components/auth`, `lib/supabase` | Supabase Auth | `features/auth`, `lib/auth` |
| Home dashboard | ✅ | `components/app/HomeView.tsx` | tasks, journal, chats | `features/insights` + `dashboard` |
| Notes | ✅ colours, drag reorder, editor, slash commands, voice, attachments, history | `components/app/{NotesView,NoteEditor,Markdown}.tsx`, `lib/notes.ts` | `notes`, `note_versions`, bucket `note-files` | `features/notes` (UNT-60) |
| Tasks (To-do) | ✅ lists, priorities, repeat, views, board, calendar, shortcuts | `components/app/todo/*`, `lib/tasks.ts` | `tasks`, `task_lists` | `features/tasks` (UNT-61) |
| Journal | ✅ many entries/day, calendar, voice, attachments | `components/app/{JournalView,JournalCalendar}.tsx` | `journal_entries` | `features/journal` (UNT-62) |
| Chat | ✅ folders, pin, unread, rename, export, share links — **no AI replies** | `components/app/chat/*`, `app/share/[token]` | `chats`, `chat_messages`, `chat_folders` | `features/ai` (UNT-81) |
| Universal search | ✅ client-side `ilike` over tasks/notes/journal/chats | `components/app/UniversalSearch.tsx` | tables above | `features/search` (UNT-63) |
| Insights card | ✅ computed in the browser from real data | `lib/insights.ts`, `components/app/InsightsCard.tsx` | tasks, journal, notes | `features/insights` (UNT-69) |
| Settings popup | ✅ profile+picture, preferences, appearance, security, data export, reset, delete account | `components/app/Settings*.tsx` | auth metadata, buckets | `features/settings` |
| Admin | ✅ overview, users (invite, plan, ban…), usage, announcements, audit | `app/admin`, `components/admin` | `admin_audit`, `announcements`, auth admin API | completed in Phase 6 |
| Workspaces / teams | ❌ data is per-user | — | — | UNT-54, UNT-55 |
| AI replies, providers, tools | ❌ stubs only | `server/providers/ai/*` | — | Phase 4 |
| Calendar, Email, Meetings, Automations, Notifications | ❌ not started | marketing demos only | — | Phases 3 & 5 |
| Composio / integrations | ❌ vocabulary only | `lib/composio` | — | UNT-70 |
| Billing | ❌ `profiles.plan` is only a label | — | `profiles` | UNT-39 |

## Foundation code already in place

- `src/config/env.ts` — typed env access (`publicEnv`, `serverEnv()`, `requireEnv`).
- `src/config/features.ts` — feature flags per phase.
- `src/server/providers/ai/*` — provider contract, registry, Groq/Puter stubs (`isAvailable()` is false).
- `src/lib/composio/index.ts` — integration vocabulary and types.
- `src/lib/ai/providers.ts` — client-safe list of AI options shown in the chat composer.
- `src/types/index.ts` — shared type re-exports.

## Known gaps and shortcuts (be aware before building on them)

- Browser code writes directly to Supabase (RLS protects it) — rules like "recurring task creates the next one" live in the client. Moves to services in Phase 1–2.
- No tests, no CI, no error monitoring yet (UNT-33, UNT-51, UNT-34).
- Admin "Usage" scans rows in memory (UNT-35).
- `profiles.personality` column is unused (the quiz was removed).
- Plan (`free`/`pro`) is stored but never enforced.
- Marketing "demo" pages are static illustrations, not the real app.
