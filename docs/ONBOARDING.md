# Onboarding — your first day

For every new developer (and the AI agent you'll work with). About 30 minutes.

## 1. Get access

| Tool     | What you need                                                                                    | Ask       |
| -------- | ------------------------------------------------------------------------------------------------ | --------- |
| GitHub   | Member of the **Setups-Works** org with write access to `untitled-project-landing`               | tech lead |
| Jira     | Access to project **UNT** — https://setups-works.atlassian.net/jira/software/projects/UNT/boards | tech lead |
| Supabase | Invite to the dev project (never the production one by default)                                  | tech lead |
| Vercel   | Read access to deployments / preview logs                                                        | tech lead |
| Secrets  | A `.env.local` for **dev** (shared securely, e.g. a password manager — never chat/email/git)     | tech lead |

## 2. Run it locally

```bash
git clone https://github.com/Setups-Works/untitled-project-landing.git
cd untitled-project-landing
npm install
cp .env.example .env.local     # fill in the dev values you were given
npm run dev                    # http://localhost:3000
```

Sign up with your own email on the local site. To get the admin panel, ask the tech lead to add your email to `ADMIN_EMAILS` in _your_ `.env.local` (or to promote you from `/admin/users`).

Useful checks before every push:

```bash
npx tsc --noEmit && npx next build   # don't run `next build` while `npm run dev` is running
```

## 3. Read (in this order, ~20 min)

1. `AGENTS.md` — the rules (humans and AI agents).
2. `docs/ARCHITECTURE.md` — layers and boundaries.
3. `docs/PHASES.md` — tracks, phases, who owns what.
4. `docs/CURRENT_STATE.md` — what exists and where.
5. The `AGENTS.md` in the folders you'll work in.

## 4. Pick your first task

1. Open the board, filter by your track label: `track-platform`, `track-workspace` or `track-ai` (`project = UNT AND labels = track-ai AND statusCategory != Done`).
2. Choose a task with **no unfinished blockers** (Jira shows "is blocked by"). Small ones (`size-s`) are good first tasks.
3. Assign yourself, move to **In Progress**, read the whole description.

## 5. Ship it

```bash
git checkout main && git pull
git checkout -b feature/UNT-123-short-name
# … work, commit in small steps …
git push -u origin feature/UNT-123-short-name
```

Open a PR on GitHub with the title **`UNT-123 Short summary`** (a check enforces the Jira key), fill in the template, move the Jira issue to **In Review**. When approved, **squash-merge**; Jira → **Done**. Update `docs/CURRENT_STATE.md`.

## 6. Working with an AI agent

Start the session with: _"Read AGENTS.md and the AGENTS.md of the folders involved, then implement Jira task UNT-123: <paste the task>. Plan first."_ You are responsible for the result — read the diff, run the app, test the acceptance criteria. Don't give agents production secrets or let them run destructive commands unattended. See `docs/TEAM_AND_WORKFLOW.md` §8.

## 7. When you're stuck

Comment on the Jira task (answers stay with the task) · tag the track owner in the PR · architecture questions → propose a change to the decisions log in `docs/ARCHITECTURE.md`.
