@AGENTS.md

# Claude Code specifics

- Prefer the editor tools (Read/Edit/Write) over shell heredocs when changing project code.
- Use `npx tsc --noEmit` after edits and `npx next build` before finishing a task. Don't run `next build` while the user's `next dev` is running — it corrupts `.next`; tell the user to restart dev afterwards.
- Don't commit or push unless asked. When asked: branch from `main`, never commit `.env*`, add the attribution line the harness provides.
- Ask before destructive actions (deleting data, force-pushing, rotating keys, changing production data).
