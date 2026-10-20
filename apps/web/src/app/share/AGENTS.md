# apps/web/src/app/share — public share pages

Read-only pages that anyone with a secret link can open: `[token]` (a shared chat) and `journal/[token]` (one shared journal entry). `layout.tsx` gives them the same **minimal header** (`components/share/ShareHeader`); the landing site's header and footer are hidden on `/share/*` (`components/HideInApp.tsx`).

**Rules:** `noindex`, `referrer: no-referrer`, no author identity, looked up by exact token on the server only. New kinds of share page go under this folder so they get the same header automatically.
