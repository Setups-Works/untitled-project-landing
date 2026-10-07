# src/app — routes only

**Purpose:** Next.js App Router: pages, layouts and route handlers. **Thin.** Fetch/compose, render a feature, return. Business rules belong in `src/server/services`, UI in `src/features` / `src/components`.

**Owner:** shared; each subfolder names its track. **Jira:** UNT-49 (final route structure).

## Today

| Folder / file                                                                                                                                 | What                                                 | Notes                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `layout.tsx`, `globals.css`                                                                                                                   | Root layout, fonts, **all CSS and design tokens**    | Append-only edits; give your CSS a commented block per feature. Marketing header/footer are hidden in `/dashboard` and `/admin` by `components/HideInApp.tsx` |
| `page.tsx` + `how-it-works/`, `pricing/`, `demo/`, `early-users/`, `privacy-security/`, `universal-search/`, `context-graph/`, `daily-brief/` | Marketing site (static)                              | Target: `(marketing)` route group                                                                                                                             |
| `login/`, `signup/`, `forgot-password/`, `reset-password/`, `auth/callback/`                                                                  | Auth                                                 | Target: `(auth)` route group                                                                                                                                  |
| `dashboard/`                                                                                                                                  | Signed-in app (Home, journal, chat, notes, todo)     | See `dashboard/AGENTS.md`                                                                                                                                     |
| `share/[token]/`                                                                                                                              | Public read-only chat page (service role, `noindex`) | Do not add features that expose more than the shared chat                                                                                                     |
| `admin/`                                                                                                                                      | Admin panel                                          | See `admin/AGENTS.md`                                                                                                                                         |
| `api/v1/`                                                                                                                                     | REST API (to be built, Phase 1)                      | See `api/v1/AGENTS.md`                                                                                                                                        |
| `not-found.tsx`, `icon.svg`                                                                                                                   | 404 and favicon                                      |                                                                                                                                                               |

## Rules

- A page file should read like a table of contents. If it grows past ~80 lines, extract into a feature component.
- Pages that print dates/times/greetings wrap their client view in `ClientOnly`; pages using `useSearchParams` need a `<Suspense>` boundary.
- Auth: signed-out access to `/dashboard/*` and `/admin/*` is redirected by `src/proxy.ts`; layouts re-check on the server (`currentUser()`, `requireAdmin()`).
- Never import from `src/server/repositories` here — go through a service.
- New routes: add `metadata` with `robots: { index: false }` for anything behind login or share links.
