# features/auth

**Does:** sign-up, login, Google sign-in, forgot/reset password, sign-out, signed-in awareness for marketing buttons. **Track A. Phase 0–1.**

**Today (legacy):** `components/auth/{AuthForm,AuthShell,SignOut,AuthLink,HeaderAuth,useAuthState}`, `lib/supabase/{client,server,config,admin}.ts`, `proxy.ts`, routes `login/ signup/ forgot-password/ reset-password/ auth/callback/`.

**Backed by:** Supabase Auth (`auth.users`), `profiles`. Cookies are refreshed in `src/proxy.ts`.

**Rules**

- Redirect targets go through `safeNext()`. Don't build redirect URLs from raw query params.
- The Supabase URL/key are validated in `lib/supabase/config.ts` — if they're invalid the UI explains which variable is wrong; keep that behaviour.
- `AuthLink` / `useAuthState` are cookie-hinted + Supabase-confirmed so static marketing pages can show "Dashboard" vs "Get started" without becoming dynamic. Don't read `cookies()` in the root layout (it would make every page dynamic).
- Roles: see `src/lib/auth` (RBAC, UNT-58).

**Jira:** UNT-58 (RBAC), UNT-53 (env), UNT-99 (security review).
