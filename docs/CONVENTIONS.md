# Conventions

Small rules that keep a three-developer codebase readable. When in doubt, match the file you're editing.

## TypeScript and React

- `strict` mode; no `any`. Use `unknown` and narrow. Export types next to the code that owns them.
- Server Components by default in `src/app`; add `"use client"` only where you need state/effects/events. Keep client components small and push data loading to the server or to hooks.
- Props: explicit types, no spreading unknown props onto DOM elements.
- No default exports for non-component modules. Components may default-export (matches current code).
- Effects: always clean up listeners/timers; guard async setState with a `live` flag.
- Don't print dates, times or greetings during server render — wrap the page in `ClientOnly` (hydration safety).

## Naming and files

| Thing | Convention | Example |
| --- | --- | --- |
| Component | `PascalCase.tsx` | `NoteEditor.tsx` |
| Hook | `useThing.ts` | `useAutosave.ts` |
| Service | `<domain>.service.ts` in `src/server/services/<domain>/` | `notes.service.ts` |
| Repository | `<domain>.repository.ts` | `notes.repository.ts` |
| Zod schema | `<domain>.schema.ts` next to the route/service that uses it | `notes.schema.ts` |
| API route | `src/app/api/v1/<resource>/route.ts` | `notes/route.ts` |
| Migration | `<timestamp>_<snake_name>.sql` | `20261101000000_workspaces.sql` |
| CSS class | feature prefix + role | `nt-card`, `tv-sec`, `cx-msg` |
| Jira branch | `feature/UNT-n-name` | `feature/UNT-60-notes-feature-module` |

## API and errors

- Input validated with Zod at the edge; services receive typed, trusted data.
- Errors: throw typed errors from services (`NotFoundError`, `ForbiddenError`, `ValidationError`); the API helper maps them to `{ error: { code, message } }` with the right status.
- Show users friendly messages ("Couldn't save that change."); send the technical detail to logs/Sentry. Never leak stack traces or SQL.
- Optimistic UI is fine for simple updates: update local state, call the API, reload on failure.

## UI language

- Hand-written CSS with tokens in `src/app/globals.css`: cream canvas, ink text, forest-green accent; tints `violet blue green amber clay sand mint gold` applied with `at-<tint>` classes (cards take `--ab`, `--abl`, `--abf`).
- Type: Instrument Serif for display headings, Geist for UI, Geist Mono for counters.
- Shape: pill buttons, generous radii, hairline inset rings instead of borders.
- Reuse components: `Modal`, `Menu`, `useConfirm()`, `usePrompt()`, `ClientOnly`. Never use native `alert/confirm/prompt`.
- Mobile first. Check 375 px: no horizontal scroll, tap targets ≥ 40 px, bottom sheets for popovers (existing CSS does this at ≤ 700 px).
- Respect `data-density="compact"` and `data-motion="reduce"` set on `<html>` from user preferences.
- Accessibility: keyboard access, visible focus, `role`/`aria-*` on custom widgets, labels for icon-only buttons, colour is never the only signal.

## Data fetching on the client (until services land)

- Use the browser Supabase client from `src/lib/supabase/client.ts`; select only needed columns; add `.limit()`.
- After a mutation, update local state optimistically and reload on error.
- Don't put business rules in components — if you catch yourself writing one, it belongs in a service (even if the service is a TODO — leave a comment referencing the Jira task).

## Testing (UNT-33)

- Pure logic (`dates`, `tasks` recurrence/grouping, `insights`, `prefs`, sanitisers): Vitest, table-driven.
- Services: test against a local/dev Supabase with a throwaway user.
- E2E: Playwright for sign-up → note → task → sign-out; add one test per major feature.
- A bug fix includes a test that fails without the fix when practical.

## Git hygiene

- Don't commit `.env*`, build output, or large binaries. Don't reformat unrelated files.
- Keep commits and PRs focused; rebase before opening a PR.

## Docs

Every PR that changes behaviour updates the relevant folder `AGENTS.md`, `docs/CURRENT_STATE.md` and (for schema) `docs/DATA_MODEL.md`. Outdated docs are bugs.
