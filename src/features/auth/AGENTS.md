# features/auth

**Does:** sign-up, email or username login, passkey sign-in/enrollment, Google sign-in and One Tap, last-used sign-in hint, email OTP password reset (with legacy reset-link support), Better Auth admin APIs, sign-out, signed-in awareness for marketing buttons. **Track A. Phase 0–1.**

**Today (legacy):** `components/auth/{AuthForm,AuthShell,SignOut,AuthLink,HeaderAuth,useAuthState}`, `lib/auth/{client,redirect}.ts`, `server/{auth,session}.ts`, `proxy.ts`, routes `login/ signup/ forgot-password/ reset-password/ auth/callback/`.

**Backed by:** Better Auth (`auth.users/sessions/accounts/verifications`), `profiles`. Usernames are normalized to lowercase for uniqueness; existing users set one in Profile settings. `src/proxy.ts` only redirects on the session cookie.

**Rules**

- Redirect targets go through `safeNext()`. Don't build redirect URLs from raw query params.
- `/api/v1/auth-config` tells the sign-in page whether the server is configured and Google is enabled; keep the friendly setup notice.
- `AuthLink` / `useAuthState` are cookie-hinted + Better Auth-confirmed so static marketing pages can show "Dashboard" vs "Get started" without becoming dynamic. Don't read `cookies()` in the root layout (it would make every page dynamic).
- Roles: see `src/lib/auth` (RBAC, UNT-58).

**Jira:** UNT-58 (RBAC), UNT-53 (env), UNT-99 (security review).
