## Jira

<!-- The PR title must start with the key: "UNT-123 Short summary". Jira links the PR automatically from the title/branch. -->

Closes: [UNT-](https://setups-works.atlassian.net/browse/UNT-)

## What changed

<!-- 2–4 bullets. What does a user/developer see differently? -->

-

## How I tested it

<!-- Steps a reviewer can repeat. Mention desktop AND 375 px mobile for UI changes. -->

- [ ] `corepack pnpm typecheck`
- [ ] `corepack pnpm check:design` (no hard-coded colours/fonts/URLs; UI matches `docs/DESIGN_LANGUAGE.md`)
- [ ] `corepack pnpm build`
- [ ]

## Screenshots / recordings

<!-- UI changes: before/after, desktop + mobile. Delete if not applicable. -->

## Checklist

- [ ] Acceptance criteria of the Jira task are met
- [ ] Layering respected (`UI → feature hook → API/server action → service → repository`); no `apps/web/src/server` imports in client code
- [ ] No secrets, tokens or personal data in code, logs or screenshots
- [ ] UI compared side by side with `/dashboard/todo` (fonts, glass, tints, buttons) — desktop and 375 px
- [ ] Accessible by keyboard; labels/roles on custom controls; works at 375 px
- [ ] Docs updated: folder `AGENTS.md`, `docs/CURRENT_STATE.md`
- [ ] **If the database changed:** new migration file (applied ones untouched) · RLS + policies · indexes · `docs/DATA_MODEL.md` updated · tech lead tagged
- [ ] **If AI/tools are involved:** write actions need user confirmation · tool/user content treated as untrusted · usage metered

## Notes for the reviewer

<!-- Risks, trade-offs, follow-ups (link new Jira tasks), anything you'd like a second opinion on. -->
