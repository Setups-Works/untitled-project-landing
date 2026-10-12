@AGENTS.md

# Claude Code specifics

- Prefer the editor tools (Read/Edit/Write) over shell heredocs when changing project code.
- A PostToolUse hook (`.claude/settings.json`) runs `scripts/check-design.mjs` after every edit; if it reports problems, fix them with tokens (see `docs/DESIGN_LANGUAGE.md`) — don't add `design-ok` just to silence it.
- Use `npx tsc --noEmit` after edits and `npx next build` before finishing a task. Don't run `next build` while the user's `next dev` is running — it corrupts `.next`; tell the user to restart dev afterwards.
- Don't commit or push unless asked. When asked: branch from `main`, never commit `.env*`, add the attribution line the harness provides.
- Ask before destructive actions (deleting data, force-pushing, rotating keys, changing production data).
