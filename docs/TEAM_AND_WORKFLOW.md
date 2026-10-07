# Team and workflow

How three developers (each with AI agents) work in one repository without breaking each other.

## 1. Roles

- **Tech lead** (one of the three, rotates if needed): owns architecture decisions (`docs/ARCHITECTURE.md` decisions log), approves migrations, merges risky PRs, owns secrets rotation.
- **Track owners** (A/B/C — see `PHASES.md`): own their folders, review PRs touching them.
- **AI agents**: work *as* the developer who started them. The developer is accountable for the code; read and understand every diff.

## 2. Branches and commits

- `main` is always deployable. Direct pushes are blocked (UNT-52).
- Branch names: `feature/UNT-n-short-name`, `fix/UNT-n-short-name`, `chore/…`.
- Small commits, imperative messages: `Add notes repository`, `Fix recurring task double-create`. Reference the Jira key in the PR title, not every commit.
- Rebase or merge `main` into your branch before opening the PR; resolve conflicts yourself.
- **Squash-merge** PRs. Delete the branch after merge.

## 3. Pull requests

- Title: `UNT-n <summary>`. Use the PR template: summary, screenshots (desktop + mobile), how you tested, migration checklist, docs updated.
- Keep PRs focused (< ~500 changed lines when possible). Unrelated refactors go in their own PR.
- One approving review from a different developer; the track owner reviews anything in their folders; the tech lead reviews migrations.
- CI must pass: typecheck, lint, build (UNT-51).
- Reviewer checklist: acceptance criteria met · layering respected · RLS for new tables · no secrets · accessibility · mobile · docs updated · tests for logic.

## 4. Avoiding merge pain

- **Own your folders.** If you must edit another track's folder, say so in the PR and tag its owner.
- **Shared hot files** (`src/app/globals.css`, `src/types`, `src/config/features.ts`, `docs/CURRENT_STATE.md`): keep edits small and append-only; rebase often.
- **CSS:** add feature styles in a clearly commented block named after the feature (e.g. `/* ===== calendar ===== */`); don't restyle shared classes without a task.
- **Migrations:** timestamps are unique per file; if two people create migrations the same day, the second renames theirs to a later timestamp before merging. Never edit an applied migration.
- **Generated/lock files:** `package-lock.json` conflicts → take `main`'s, reinstall.

## 5. Environments

| Env | Where | Database | Notes |
| --- | --- | --- | --- |
| Local | `npm run dev` | Shared dev Supabase project, or local via `supabase start` | `.env.local` from `.env.example` |
| Preview | Vercel preview per PR | Dev/staging Supabase | Env vars scoped to Preview |
| Staging | Vercel (Phase 6) | Staging Supabase | Release rehearsal |
| Production | Vercel + Cloudflare | Production Supabase | Migrations applied before deploy |

Never point local or preview at the production database.

## 6. Database changes

1. `npx supabase migration new <name>` → write SQL (RLS included).
2. Test locally or on the dev project (`npx supabase db push --linked`).
3. PR includes the migration + `docs/DATA_MODEL.md` update; tech lead reviews.
4. Release: apply migrations to production first, then deploy the code that uses them (migrations must be backward compatible with the previous code for one release).

## 7. Releases

Merge to `main` → Vercel deploys production. Until staging exists (UNT-101): check the preview deployment of the PR first; tell the team in the channel before merging migrations.

## 8. Working with AI agents

- Give the agent the Jira task text **and** tell it to read `AGENTS.md` plus folder `AGENTS.md` files.
- Ask for a plan first on Size M/L tasks; review the plan against `docs/ARCHITECTURE.md`.
- Don't let agents run destructive commands (drop tables, force-push, rotate keys) unattended.
- Never give an agent production secrets; use dev keys.
- After the agent finishes: read the diff, run the app, test the acceptance criteria yourself, update docs.

## 9. Communication

- Questions about requirements → comment on the Jira task (not in private chat) so the answer is recorded.
- Architecture changes → propose in a PR editing `docs/ARCHITECTURE.md` decisions log.
- Blocked? Move the task to *Blocked* (or comment) and link the blocking issue.

## 10. Daily rhythm (suggested)

Pull `main` → pick/continue a task → small PRs through the day → move Jira status → 10-minute async update in the channel (done / doing / blocked).
