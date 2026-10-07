# src/app/dashboard — the signed-in app shell

**Purpose:** Layout and pages for the user panel. **Owner:** track B (features) with track A for the shell. **Jira:** UNT-49 (route structure), then feature migrations UNT-60/61/62/81.

## Today

- `layout.tsx` (server): auth gate (`currentUser()` → redirect to `/login`), loads active **announcements**, renders `AppNav` (top bar, universal search, account menu, settings popup) + `AnnouncementBanner`.
- `page.tsx` Home → `HomeView`; `journal/`, `chat/`, `notes/`, `todo/` each render one client view (wrapped in `ClientOnly` / `Suspense`).
- `settings/actions.ts`: server action `deleteMyAccount` (service role; typed-email confirmation; blocks `ADMIN_EMAILS` accounts).
- Settings is a **popup** (opened from the avatar menu), not a route.

## Rules

- This folder contains routing glue only. Feature UI lives in `src/features/<name>` (today still in `src/components/app/*`).
- Keep the layout's server work cheap — it runs on every navigation. No heavy queries.
- When the route structure changes (UNT-49), keep redirects from old URLs.
- Nothing here may assume a single user once workspaces land (UNT-54): resolve the active workspace in the layout and pass it down.
