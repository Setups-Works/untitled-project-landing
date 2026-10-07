# Phases and tracks

Seven phases, three parallel **tracks** (one per developer). Task details, acceptance criteria and dependency links are in Jira (project **UNT**); the full list is mirrored in `JIRA_BACKLOG.md`.

## Tracks

| Track                                    | Label             | Owns                                                                                                                                  | Typical folders                                                                                                                |
| ---------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **A — Platform, Admin & Infrastructure** | `track-platform`  | Auth, workspaces, RBAC, API v1, services/repositories pattern, jobs, admin panel, CI, security, observability, Cloudflare, billing    | `src/app/api/v1`, `src/server/{repositories,jobs}`, `src/lib/{auth,supabase}`, `src/app/admin`, `supabase/`, `.github/`        |
| **B — Workspace features**               | `track-workspace` | Notes, Tasks, Journal, Search UI, Calendar UI, Email UI, Meetings UI, Automations UI, Insights, Notifications UI                      | `src/features/{notes,tasks,journal,calendar,email,meetings,automation,search,insights}`, `src/components`                      |
| **C — AI & Integrations**                | `track-ai`        | AI providers, router, orchestrator, tools, prompts, usage/limits, Composio, calendar/email services, automation engine, transcription | `src/server/{providers,services/{ai,composio,calendar,automation}}`, `src/lib/{ai,composio}`, `src/features/{ai,integrations}` |

Assign people to tracks in Jira (assignee) — labels already say which track a task belongs to. Developers may swap tracks, but only one person at a time should own a folder.

## Phase map

| Phase | Epic                                                 | Goal                                                         | Exit criteria                                                                             |
| ----- | ---------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| 0     | UNT-40 Foundation & conventions                      | Repo ready for 3 devs + AI agents                            | src/ layout, docs, CI green, route structure decided, UI primitives, safe env handling    |
| 1     | UNT-41 Platform core                                 | Workspaces, API v1, service/repo pattern, jobs               | All tables workspace-scoped with RLS; notes run end to end through API→service→repository |
| 2     | UNT-42 Core productivity                             | Notes, Tasks, Journal, Search on the new architecture        | Each feature in `src/features/<name>`; server-side search; shared attachments + realtime  |
| 3     | UNT-43 Integrations                                  | Composio, Calendar, Email, Daily Brief                       | Connect Google; events + mail work without AI                                             |
| 4     | UNT-44 AI                                            | Provider router, Groq, Puter.js, orchestrator, tools, limits | Chat answers with a real model, safe tools, metered; "No AI" mode intact                  |
| 5     | UNT-45 Meetings, Automation, Notifications, Insights | Remaining product surface                                    | Transcripts/summaries/tasks; reliable automations; notifications users control            |
| 6     | UNT-46 Admin completion, observability & launch      | Production readiness                                         | Monitored, protected, billed, secure, launched                                            |

## Dependency spine (what blocks what)

```
UNT-54 Workspaces + RLS ──┬─► UNT-55 Workspace UI
                          ├─► UNT-56 API v1 ──┬─► UNT-57 Service/repo pattern ──► UNT-60/61/62 migrate notes/tasks/journal
                          │                   ├─► UNT-59 Jobs runner ──► UNT-72/74 calendar/email services, UNT-88/89/91
                          │                   └─► UNT-70 Composio service ──► UNT-71 Integrations UI, UNT-82 AI tools
                          ├─► UNT-58 RBAC
                          └─► UNT-63 Server-side search
UNT-77 Provider router ──► UNT-78 Groq / UNT-79 Puter ──► UNT-80 Orchestrator ──► UNT-81 Chat UI, UNT-82 tools, UNT-83 usage
```

Dependencies are also recorded as Jira "blocks" links — an issue shows what blocks it.

## Suggested start for three developers

- **A (platform):** UNT-47/48 review & merge → UNT-51 CI → **UNT-54 workspaces + RLS** (highest risk, start first) → UNT-56 API v1 → UNT-57 reference service/repository.
- **B (workspace):** UNT-50 UI primitives → UNT-49 route decision with A → once UNT-57 lands, UNT-60/61/62 migrations; meanwhile prepare Notes v2 / Tasks v2 designs.
- **C (AI & integrations):** _Doesn't wait for workspaces_ — UNT-77 provider router → UNT-78 Groq → UNT-84 prompt library; spike Composio (read-only) to de-risk UNT-70; then UNT-80 orchestrator when UNT-56 is ready.

## Decisions waiting (tag `decision-needed`)

Route structure (UNT-49) · embedding provider (UNT-86) · transcription provider (UNT-88) · transactional email provider (UNT-91).

## Status flow in Jira

To Do → In Progress → In Review → Done. A task is _Done_ only when it meets the Definition of Done in `AGENTS.md` §8.
