# src/components/navigation

**Purpose:** Navigation chrome: app top bar and tabs, workspace switcher trigger, notification bell, command/search trigger, breadcrumbs. **Owner:** track A. **Jira:** UNT-49, UNT-55, UNT-92.

Today: `AppNav` (tabs, universal search button, account menu, settings popup) lives in `src/components/app/AppNav.tsx`; the marketing header is `SiteChrome.tsx` + `Client.tsx`. `AppNav` moves here.

## Rules

- Navigation items come from one config list (today `TABS` in `AppNav`); adding a section = one line + a route.
- Active state is derived from the URL, never stored separately.
- Must stay usable at 375 px (icon-only tabs) and by keyboard.
