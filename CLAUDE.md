@AGENTS.md

# Claude Code specifics

- Prefer the editor tools (Read/Edit/Write) over shell heredocs when changing project code.
- A PostToolUse hook (`.claude/settings.json`) runs `scripts/check-design.mjs` after every edit; if it reports problems, fix them with tokens (see `docs/DESIGN_LANGUAGE.md`) — don't add `design-ok` just to silence it.
- Use `corepack pnpm typecheck` after edits and `corepack pnpm build` before finishing a task. Don't build while the user's web dev server is running — both write to `apps/web/.next`.
- Don't commit or push unless asked. When asked: branch from `main`, never commit `.env*`, add the attribution line the harness provides.
- Ask before destructive actions (deleting data, force-pushing, rotating keys, changing production data).
