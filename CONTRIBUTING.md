# Contributing

1. Every change starts from a **Jira task** in project UNT: https://setups-works.atlassian.net/jira/software/projects/UNT/boards
2. Branch from `main`: `feature/UNT-123-short-name` (or `fix/…`, `chore/…`).
3. Follow the rules in [`AGENTS.md`](AGENTS.md) and the `AGENTS.md` of every folder you touch.
4. Before you push: `npx tsc --noEmit && npx next build`.
5. Open a PR titled **`UNT-123 Short summary`** using the template. CI (typecheck + build) and the Jira-key check must pass; one approving review is required.
6. Squash-merge. Move the Jira task to Done and update the docs you changed.

New here? Read [`docs/ONBOARDING.md`](docs/ONBOARDING.md). Team process: [`docs/TEAM_AND_WORKFLOW.md`](docs/TEAM_AND_WORKFLOW.md).

**Never commit secrets** (`.env*` other than `.env.example`, keys, tokens). If one leaks, tell the tech lead and rotate it immediately.
