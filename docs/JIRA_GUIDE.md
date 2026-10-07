# Jira guide

Project **UNT** — https://setups-works.atlassian.net/jira/software/projects/UNT/boards (team-managed Kanban).

## Structure

- **Epics = phases** (`UNT-40` … `UNT-46`, "Phase 0 — …" to "Phase 6 — …"). Older epics (`UNT-1` … `UNT-7`) group the work that was already shipped.
- **Stories = tasks.** Each story is a unit one developer can finish and one reviewer can review (S ≈ 1 day, M ≈ 2–4 days, L ≈ 1 week or more — split anything bigger).
- **Links:** _blocks / is blocked by_ encode real dependencies. Don't start a task whose blocker isn't done unless you agree an interface first.
- **Statuses:** To Do → In Progress → In Review → Done.

## Labels

| Label                                              | Meaning                                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------------------- |
| `phase-0` … `phase-6`                              | Phase                                                                           |
| `track-platform`, `track-workspace`, `track-ai`    | Owning track (see `docs/PHASES.md`) — use it to assign and to filter your board |
| `size-s`, `size-m`, `size-l`                       | Estimate                                                                        |
| `decision-needed`                                  | A product/tech decision must be made before or during the task                  |
| `security`, `deployment`, `quality`, `performance` | Cross-cutting themes                                                            |

Useful JQL: `project = UNT AND labels = track-ai AND statusCategory != Done ORDER BY rank` · `project = UNT AND labels = decision-needed` · `project = UNT AND status = "In Review"`.

## How tasks are written

Every task has the same sections, so humans and AI agents know what "done" means:

1. **Goal** — the outcome in one or two sentences.
2. **Scope** — what to build (bullets). Anything not listed is out of scope.
3. **Acceptance criteria** — testable statements; the reviewer ticks these.
4. **Where in the repo** — folders/files to start from.
5. **Depends on** — blocking tasks (also linked in Jira).
6. **Notes** — decisions needed, risks, gotchas.
7. **Details** — phase, track, size.
8. **Working on this with an AI agent** — the standard checklist from `AGENTS.md`.

### Writing a new task

- Title: verb + object, specific ("Calendar service: sync, cache and timezones", not "Calendar stuff").
- Prefer vertical slices (service + API + UI for one user outcome) over horizontal ones, unless it's a foundation other tasks depend on.
- Put UI work and service work for the same feature in separate tasks only when they can proceed in parallel (different tracks), and link them.
- Add acceptance criteria that include mobile, accessibility and error states.
- Mention schema changes explicitly (they need tech-lead review).
- If you're unsure about a requirement, add `decision-needed` and a note — don't let an agent guess.

## Working a task

1. Assign yourself → _In Progress_. Branch `feature/UNT-n-…`.
2. Open the task, read every section; read the folder `AGENTS.md` files listed under _Where in the repo_.
3. Comment on the Jira issue if scope changes or you discover a blocker.
4. PR titled `UNT-n …` → _In Review_.
5. After merge: _Done_, and update `docs/CURRENT_STATE.md`.

## Keeping the docs and Jira in sync

`docs/JIRA_BACKLOG.md` is a generated snapshot (task → track → size → dependencies) so agents can read the plan offline. **Jira is the source of truth for status and assignees.** When you add or reshape tasks, update this file (or ask the tech lead to regenerate it).

## Current board snapshot

See `docs/JIRA_BACKLOG.md` — 7 phase epics, 61 tasks across the three tracks, with dependencies as Jira links.
