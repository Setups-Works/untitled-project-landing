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

| Thing       | Convention                                                  | Example                               |
| ----------- | ----------------------------------------------------------- | ------------------------------------- |
| Component   | `PascalCase.tsx`                                            | `NoteEditor.tsx`                      |
| Hook        | `useThing.ts`                                               | `useAutosave.ts`                      |
| Service     | `<domain>.service.ts` in `src/server/services/<domain>/`    | `notes.service.ts`                    |
| Repository  | `<domain>.repository.ts`                                    | `notes.repository.ts`                 |
| Zod schema  | `<domain>.schema.ts` next to the route/service that uses it | `notes.schema.ts`                     |
| API route   | `src/app/api/v1/<resource>/route.ts`                        | `notes/route.ts`                      |
| Migration   | `<timestamp>_<snake_name>.sql`                              | `20261101000000_workspaces.sql`       |
| CSS class   | feature prefix + role                                       | `nt-card`, `tv-sec`, `cx-msg`         |
| Jira branch | `feature/UNT-n-name`                                        | `feature/UNT-60-notes-feature-module` |

## API and errors

- Input validated with Zod at the edge; services receive typed, trusted data.
- Errors: throw typed errors from services (`NotFoundError`, `ForbiddenError`, `ValidationError`); the API helper maps them to `{ error: { code, message } }` with the right status.
- Show users friendly messages ("Couldn't save that change."); send the technical detail to logs/Sentry. Never leak stack traces or SQL.
- Optimistic UI is fine for simple updates: update local state, call the API, reload on failure.

## UI language

The full contract (fonts, tokens, glass surfaces, buttons, reference screens, common mistakes) is in `docs/DESIGN_LANGUAGE.md` — read it before touching UI. Summary:

- Hand-written CSS with tokens in `src/app/globals.css`: cream canvas, ink text, forest-green accent; tints `violet blue green amber clay sand mint gold` applied with `at-<tint>` classes (cards take `--ab`, `--abl`, `--abf`).
- Type: Instrument Serif for display headings, Geist for UI, Geist Mono for counters.
- Shape: pill buttons, generous radii, hairline inset rings instead of borders.
- Reuse components: `Modal`, `Menu`, `useConfirm()`, `usePrompt()`, `ClientOnly`. Never use native `alert/confirm/prompt`.
- Mobile first. Check 375 px: no horizontal scroll, tap targets ≥ 40 px, bottom sheets for popovers (existing CSS does this at ≤ 700 px).
- Respect `data-density="compact"` and `data-motion="reduce"` set on `<html>` from user preferences.
- Accessibility: keyboard access, visible focus, `role`/`aria-*` on custom widgets, labels for icon-only buttons, colour is never the only signal.

## Data fetching on the client (until services land)

- Use the browser data client `api()` from `src/lib/api/client.ts` (`api().from("tasks").select(...)` — same chaining as before; it posts to `/api/v1/db`); select only needed columns; add `.limit()`.
- Use **TanStack Query** (`useQuery`/`useMutation`); never hand-roll load/reload `useEffect` fetching. Keys live in `src/lib/query/keys.ts` (`qk`).
- Optimistic updates: `cancelQueries` → snapshot with `getQueriesData` → `setQueriesData` → roll back in `onError` → `invalidateQueries` in `onSettled`. Reference: `src/features/tasks/queries.ts`.
- Realtime: call `useRealtimeInvalidate(table, [keys])` (`src/hooks`); it debounces invalidation when rows change. The table needs the notify trigger from migration `20261007080000_realtime.sql`.
- Overlays/menus/tabs use the Radix wrappers in `src/components/ui` — don't build custom ones.
- Don't put business rules in components — if you catch yourself writing one, it belongs in a service (even if the service is a TODO — leave a comment referencing the Jira task).

## Testing (UNT-33)

| Command            | What it runs                                                                                                                                                              | Needs                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `npm test`         | Unit tests (`tests/unit/*.test.ts`): dates, tasks, notes/chat helpers, prefs, onboarding, query builder, storage keys and signed links, insights. Runs in CI on every PR. | nothing                                                 |
| `npm run test:db`  | Database tests (`tests/db/*.test.ts`): the API query layer against real Postgres with row-level security (two throwaway users, cleaned up).                               | `docker compose up -d` + `npm run db:migrate`           |
| `npm run test:e2e` | Playwright (`e2e/*.spec.ts`): smoke checks, plus the sign-up → task → note → sign-out journey with `E2E_SIGNUP=1`.                                                        | the app running; once `npx playwright install chromium` |

- No spare disk for Playwright's own browser (~150 MB)? Point it at one you already have: `E2E_BROWSER_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run test:e2e` (Brave and Edge work too). Set `DATABASE_URL` as well and the journey's throwaway account is deleted after the run.
- Pure logic: Vitest, table-driven, no mocks of our own code. Dates are pinned to UTC in `vitest.config.mts`.
- Anything that talks to the database or depends on RLS goes in `tests/db`, never mocked.
- The journey test creates a throwaway account, so the app must run with `AUTH_REQUIRE_EMAIL_VERIFICATION=false`. The manual "E2E" workflow in GitHub Actions starts the whole stack that way.
- Add one Playwright test per major feature. A bug fix includes a test that fails without the fix when practical.

## Git hygiene

- Don't commit `.env*`, build output, or large binaries. Don't reformat unrelated files.
- Keep commits and PRs focused; rebase before opening a PR.

## Docs

Every PR that changes behaviour updates the relevant folder `AGENTS.md`, `docs/CURRENT_STATE.md` and (for schema) `docs/DATA_MODEL.md`. Outdated docs are bugs.
