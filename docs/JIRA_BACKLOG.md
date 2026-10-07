# Jira backlog (project UNT)

Generated from the Jira project so humans and AI agents can see the whole plan offline. **Jira is the source of truth for status and assignees** — this file is the map. Regenerate it when the plan changes.

Board: https://setups-works.atlassian.net/jira/software/projects/UNT/boards

Tracks: `track-platform` = Track A — Platform, Admin & Infrastructure · `track-workspace` = Track B — Workspace features · `track-ai` = Track C — AI & Integrations

Sizes: S ≈ 1 day · M ≈ 2–4 days · L ≈ 1 week or more.

## [UNT-40](https://setups-works.atlassian.net/browse/UNT-40) Phase 0 — Foundation & conventions

Make the repo ready for three developers (and their AI agents) to work in parallel without stepping on each other.

_Exit: src/ architecture adopted, docs and AGENTS.md in place, CI green on every PR, route structure decided, shared UI primitives exist, env and secrets handled safely._

| Key                                                        | Task                                                           | Track          | Size | Depends on |
| ---------------------------------------------------------- | -------------------------------------------------------------- | -------------- | ---- | ---------- |
| [UNT-47](https://setups-works.atlassian.net/browse/UNT-47) | Adopt the src/ layout and architecture skeleton                | track-platform | S    | —          |
| [UNT-48](https://setups-works.atlassian.net/browse/UNT-48) | Write AGENTS.md, per-folder guides and project docs            | track-platform | S    | —          |
| [UNT-49](https://setups-works.atlassian.net/browse/UNT-49) | Decide and migrate the route structure                         | track-platform | M    | —          |
| [UNT-50](https://setups-works.atlassian.net/browse/UNT-50) | Shared UI primitives in components/ui                          | track-platform | M    | —          |
| [UNT-51](https://setups-works.atlassian.net/browse/UNT-51) | CI: lint, typecheck and build on every pull request            | track-platform | M    | —          |
| [UNT-52](https://setups-works.atlassian.net/browse/UNT-52) | Branch protection, PR template and CODEOWNERS                  | track-platform | S    | UNT-51     |
| [UNT-53](https://setups-works.atlassian.net/browse/UNT-53) | Environment management and local development guide             | track-platform | S    | —          |
| [UNT-33](https://setups-works.atlassian.net/browse/UNT-33) | Automated tests: Vitest unit tests and a Playwright smoke test | track-platform | M    | —          |

## [UNT-41](https://setups-works.atlassian.net/browse/UNT-41) Phase 1 — Platform core

Workspaces and membership, the API v1 pattern, the repository/service layers and background jobs. Everything later depends on these.

_Exit: every table is workspace-scoped with RLS, notes run through API v1 -> service -> repository as the reference implementation, and a job runner exists._

| Key                                                        | Task                                                          | Track          | Size | Depends on |
| ---------------------------------------------------------- | ------------------------------------------------------------- | -------------- | ---- | ---------- |
| [UNT-54](https://setups-works.atlassian.net/browse/UNT-54) | Workspaces and membership: data model and RLS                 | track-platform | L    | —          |
| [UNT-55](https://setups-works.atlassian.net/browse/UNT-55) | Workspace switcher, creation and member invites (UI)          | track-platform | M    | UNT-54     |
| [UNT-56](https://setups-works.atlassian.net/browse/UNT-56) | REST API v1 foundation                                        | track-platform | M    | UNT-54     |
| [UNT-57](https://setups-works.atlassian.net/browse/UNT-57) | Repository and service layer pattern (notes as the reference) | track-platform | M    | UNT-56     |
| [UNT-58](https://setups-works.atlassian.net/browse/UNT-58) | Roles and permissions (RBAC)                                  | track-platform | M    | UNT-54     |
| [UNT-59](https://setups-works.atlassian.net/browse/UNT-59) | Background jobs runner                                        | track-platform | M    | UNT-56     |

## [UNT-42](https://setups-works.atlassian.net/browse/UNT-42) Phase 2 — Core productivity

Notes, Tasks, Journal and Search moved onto the new architecture and deepened.

_Exit: each feature lives in src/features/<name> with service + repository + API v1, server-side search works, attachments and realtime are shared utilities._

| Key                                                        | Task                                                          | Track           | Size | Depends on |
| ---------------------------------------------------------- | ------------------------------------------------------------- | --------------- | ---- | ---------- |
| [UNT-60](https://setups-works.atlassian.net/browse/UNT-60) | Notes: migrate to src/features/notes                          | track-workspace | M    | UNT-57     |
| [UNT-61](https://setups-works.atlassian.net/browse/UNT-61) | Tasks: migrate to src/features/tasks                          | track-workspace | M    | UNT-57     |
| [UNT-62](https://setups-works.atlassian.net/browse/UNT-62) | Journal: migrate to src/features/journal                      | track-workspace | M    | UNT-57     |
| [UNT-63](https://setups-works.atlassian.net/browse/UNT-63) | Server-side search: full-text index and /api/v1/search        | track-workspace | L    | UNT-54     |
| [UNT-64](https://setups-works.atlassian.net/browse/UNT-64) | Notes v2: tags, backlinks, archive and trash                  | track-workspace | M    | UNT-60     |
| [UNT-65](https://setups-works.atlassian.net/browse/UNT-65) | Tasks v2: subtasks, labels, reminders and board drag-and-drop | track-workspace | M    | UNT-61     |
| [UNT-66](https://setups-works.atlassian.net/browse/UNT-66) | Journal v2: templates, prompts, mood and weekly review        | track-workspace | M    | UNT-62     |
| [UNT-67](https://setups-works.atlassian.net/browse/UNT-67) | Shared attachments service                                    | track-workspace | S    | UNT-57     |
| [UNT-68](https://setups-works.atlassian.net/browse/UNT-68) | Realtime updates across tabs and devices                      | track-workspace | M    | UNT-54     |
| [UNT-69](https://setups-works.atlassian.net/browse/UNT-69) | Insights page v1                                              | track-workspace | M    | UNT-57     |

## [UNT-43](https://setups-works.atlassian.net/browse/UNT-43) Phase 3 — Integrations: Composio, Calendar, Email

Connect Gmail and Google Calendar through Composio and build the Calendar, Email and Daily Brief experiences.

_Exit: a user can connect Google, see and create events, read and send mail, and open a Daily Brief — all without AI._

| Key                                                        | Task                                        | Track           | Size | Depends on     |
| ---------------------------------------------------------- | ------------------------------------------- | --------------- | ---- | -------------- |
| [UNT-70](https://setups-works.atlassian.net/browse/UNT-70) | Composio service and connection management  | track-ai        | L    | UNT-56         |
| [UNT-71](https://setups-works.atlassian.net/browse/UNT-71) | Integrations page                           | track-workspace | M    | UNT-70         |
| [UNT-72](https://setups-works.atlassian.net/browse/UNT-72) | Calendar service: sync, cache and timezones | track-ai        | M    | UNT-70, UNT-59 |
| [UNT-73](https://setups-works.atlassian.net/browse/UNT-73) | Calendar feature (month, week, day, agenda) | track-workspace | L    | UNT-72         |
| [UNT-74](https://setups-works.atlassian.net/browse/UNT-74) | Email service: fetch, cache, send           | track-ai        | M    | UNT-70, UNT-59 |
| [UNT-75](https://setups-works.atlassian.net/browse/UNT-75) | Email feature (inbox, thread view, compose) | track-workspace | L    | UNT-74         |
| [UNT-76](https://setups-works.atlassian.net/browse/UNT-76) | Daily Brief page (no AI)                    | track-workspace | M    | UNT-73, UNT-75 |

## [UNT-44](https://setups-works.atlassian.net/browse/UNT-44) Phase 4 — AI

Provider router (Groq, Puter.js), the AI orchestrator, streaming chat, tool calling and usage limits.

_Exit: Chat answers with a real model, can use tools safely, is metered per user, and works in 'No AI' mode when no provider is available._

| Key                                                        | Task                                                      | Track           | Size | Depends on             |
| ---------------------------------------------------------- | --------------------------------------------------------- | --------------- | ---- | ---------------------- |
| [UNT-77](https://setups-works.atlassian.net/browse/UNT-77) | AI provider router                                        | track-ai        | M    | —                      |
| [UNT-78](https://setups-works.atlassian.net/browse/UNT-78) | Groq provider                                             | track-ai        | M    | UNT-77                 |
| [UNT-79](https://setups-works.atlassian.net/browse/UNT-79) | Puter.js provider (browser runtime)                       | track-ai        | M    | UNT-77                 |
| [UNT-80](https://setups-works.atlassian.net/browse/UNT-80) | AI orchestrator and streaming chat API                    | track-ai        | L    | UNT-78, UNT-56         |
| [UNT-81](https://setups-works.atlassian.net/browse/UNT-81) | Chat UI: streaming, regenerate, markdown and model picker | track-workspace | M    | UNT-80                 |
| [UNT-82](https://setups-works.atlassian.net/browse/UNT-82) | AI tools via Composio (calendar, mail, tasks, notes)      | track-ai        | L    | UNT-80, UNT-72, UNT-74 |
| [UNT-83](https://setups-works.atlassian.net/browse/UNT-83) | AI usage tracking and limits                              | track-ai        | M    | UNT-80                 |
| [UNT-84](https://setups-works.atlassian.net/browse/UNT-84) | Prompt library and safety rules                           | track-ai        | M    | UNT-80                 |
| [UNT-85](https://setups-works.atlassian.net/browse/UNT-85) | AI actions in Notes                                       | track-workspace | M    | UNT-80                 |
| [UNT-86](https://setups-works.atlassian.net/browse/UNT-86) | Semantic search (pgvector)                                | track-ai        | M    | UNT-63, UNT-59         |

## [UNT-45](https://setups-works.atlassian.net/browse/UNT-45) Phase 5 — Meetings, Automation, Notifications, Insights

The remaining product surface: meetings with transcripts, an automation engine, notifications and AI-written insights.

_Exit: meetings produce transcripts/summaries/tasks, automations run reliably with history, users get notifications they can control._

| Key                                                        | Task                                       | Track           | Size | Depends on             |
| ---------------------------------------------------------- | ------------------------------------------ | --------------- | ---- | ---------------------- |
| [UNT-87](https://setups-works.atlassian.net/browse/UNT-87) | Meetings feature                           | track-workspace | L    | UNT-73, UNT-67         |
| [UNT-88](https://setups-works.atlassian.net/browse/UNT-88) | Meeting transcription and summary pipeline | track-ai        | L    | UNT-87, UNT-80, UNT-59 |
| [UNT-89](https://setups-works.atlassian.net/browse/UNT-89) | Automation engine                          | track-ai        | L    | UNT-59, UNT-70         |
| [UNT-90](https://setups-works.atlassian.net/browse/UNT-90) | Automations UI                             | track-workspace | M    | UNT-89                 |
| [UNT-91](https://setups-works.atlassian.net/browse/UNT-91) | Notifications service                      | track-ai        | M    | UNT-59                 |
| [UNT-92](https://setups-works.atlassian.net/browse/UNT-92) | Notification centre and settings           | track-workspace | M    | UNT-91                 |
| [UNT-93](https://setups-works.atlassian.net/browse/UNT-93) | Insights v2: AI weekly review              | track-workspace | M    | UNT-80, UNT-69, UNT-91 |
| [UNT-94](https://setups-works.atlassian.net/browse/UNT-94) | Slack and GitHub integrations              | track-ai        | S    | UNT-89, UNT-71         |

## [UNT-46](https://setups-works.atlassian.net/browse/UNT-46) Phase 6 — Admin completion, observability & launch

Finish the admin panel, add Sentry/PostHog, Cloudflare, billing, security and performance hardening, then launch.

_Exit: production is monitored and protected, plans are enforced, the security checklist is signed off, launch checklist complete._

| Key                                                          | Task                                               | Track          | Size | Depends on      |
| ------------------------------------------------------------ | -------------------------------------------------- | -------------- | ---- | --------------- |
| [UNT-95](https://setups-works.atlassian.net/browse/UNT-95)   | Admin: workspaces page                             | track-platform | M    | UNT-58          |
| [UNT-96](https://setups-works.atlassian.net/browse/UNT-96)   | Admin: AI and integrations pages                   | track-platform | M    | UNT-83, UNT-70  |
| [UNT-97](https://setups-works.atlassian.net/browse/UNT-97)   | Admin: analytics and logs pages                    | track-platform | M    | UNT-34          |
| [UNT-34](https://setups-works.atlassian.net/browse/UNT-34)   | Observability: Sentry, PostHog and structured logs | track-platform | M    | —               |
| [UNT-98](https://setups-works.atlassian.net/browse/UNT-98)   | Cloudflare in front of Vercel                      | track-platform | M    | —               |
| [UNT-39](https://setups-works.atlassian.net/browse/UNT-39)   | Billing: Free vs Pro                               | track-platform | M    | UNT-83          |
| [UNT-99](https://setups-works.atlassian.net/browse/UNT-99)   | Security review                                    | track-platform | M    | —               |
| [UNT-100](https://setups-works.atlassian.net/browse/UNT-100) | Performance and accessibility pass                 | track-platform | M    | —               |
| [UNT-35](https://setups-works.atlassian.net/browse/UNT-35)   | Move admin Usage counting into the database        | track-platform | S    | —               |
| [UNT-101](https://setups-works.atlassian.net/browse/UNT-101) | Backups, staging environment and release process   | track-platform | S    | UNT-53          |
| [UNT-102](https://setups-works.atlassian.net/browse/UNT-102) | Privacy and data-rights review                     | track-platform | M    | —               |
| [UNT-103](https://setups-works.atlassian.net/browse/UNT-103) | Launch checklist and changelog                     | track-platform | S    | UNT-99, UNT-100 |
