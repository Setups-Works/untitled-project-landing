# Security

Rules for everyone (and every AI agent). The checklist at the bottom is finished in Phase 6 (UNT-99).

## Principles

1. **Authorisation lives in the database (RLS) and the services**, never only in the UI.
2. **Least privilege:** the browser gets only the anon key; the service-role key is used in few, reviewed places and always after an explicit permission check.
3. **Untrusted input everywhere:** user text, uploads, emails, transcripts, tool output, URL params.
4. **No secrets in code, git, chats or logs.** Rotate on any suspicion.

## Secrets inventory (names only)

| Variable                                          | Where used                           | Exposure                                                 |
| ------------------------------------------------- | ------------------------------------ | -------------------------------------------------------- |
| `DATABASE_URL`, `REDIS_URL`                       | server only                          | **server only**                                          |
| `BETTER_AUTH_SECRET`, `S3_SECRET_KEY`, `SMTP_URL` | sessions/tokens, file storage, email | **server only**                                          |
| `ADMIN_EMAILS`                                    | bootstrap admins                     | server only                                              |
| `GROQ_API_KEY`, `COMPOSIO_API_KEY`                | AI / integrations services           | server only (Phase 3–4)                                  |
| `CRON_SECRET`                                     | protects `/api/v1/jobs/*`            | server only                                              |
| `SENTRY_*`, `NEXT_PUBLIC_POSTHOG_KEY`             | observability                        | DSN/keys are public identifiers; auth tokens server only |
| Stripe keys                                       | billing                              | server only (Phase 6)                                    |

Rotation: change the value in `.env.selfhost` / your secret manager and recreate the containers (rotating `BETTER_AUTH_SECRET` signs everyone out); hosting dashboard → Environment Variables; Vercel → Environment Variables; then redeploy **without build cache** (NEXT_PUBLIC values are baked at build). A pasted value containing characters like “…” or spaces breaks every request — the app now detects this and says which variable is wrong.

## Auth and sessions

- Better Auth with email+password and Google; sessions stored in PostgreSQL (cookie `better-auth.session_token`); `src/proxy.ts` only redirects, every page re-verifies the session.
- Google One Tap runs on the login and signup pages through Better Auth. The public client ID is returned by `/api/v1/auth-config`; the secret stays server-side. Add each deployed site origin (including `http://localhost:3000` for local development) to the Google OAuth client's Authorized JavaScript origins. The standard Google button remains available if the prompt is unavailable or dismissed.
- Better Auth's last-login-method plugin keeps only the most recently used method name in a readable, first-party cookie for 30 days, so the login form can show a “Last used” hint. It does not store this preference in the database.
- Better Auth's admin plugin endpoints require the `admin` role. The app's `/admin` pages and server actions continue to enforce `requireAdmin`/`assertAdmin`, protect the acting admin and `ADMIN_EMAILS` accounts, and record admin-panel mutations in `admin_audit`.
- Usernames are optional for existing accounts, required for new email/password signups, normalized to lowercase, and unique. Users can set or change them in Profile settings; the public availability endpoint is disabled to reduce username enumeration.
- Passkeys use Better Auth WebAuthn and are stored in `auth.passkeys`, an RLS-enabled server-only table with no client policies. `BETTER_AUTH_URL` must match the public auth origin; production passkeys require HTTPS.
- Forgot-password uses Better Auth email OTPs: six digits, five-minute expiry, three attempts, hashed at rest, and limited to three requests per minute. The UI uses a generic response so it does not reveal whether an email has an account. OTPs are sent through the configured SMTP transport and must never be logged.
- Redirect targets (`?next=`) are validated by `safeNext` (same-site relative paths only).
- Admin = `app_metadata.role = 'admin'` or an email in `ADMIN_EMAILS`. Every `/admin/*` page and server action re-checks on the server (`requireAdmin` / `assertAdmin`). Admins can't demote/ban/delete themselves or `ADMIN_EMAILS` accounts.
- Account deletion and "reset workspace" remove rows **and** storage files.

## Data protection

- RLS on every table (see `DATA_MODEL.md`). New tables without RLS must not merge.
- Private Storage bucket for user files with owner-folder policies; files are served through short-lived signed URLs.
- Journal entries are private to their author even in shared workspaces.
- The admin Usage page reads only ids/counts — never user content. Admin tools must not expose note/journal/chat content.
- Audit log: every admin action recorded in `admin_audit` (service-role only).

## Public sharing

- Chats are private unless `share_token` is set (32 random hex chars). The public page `/share/[token]` queries by exact token on the server; no anon RLS policy exists that would allow listing shared chats.
- The page is `noindex` with `referrer: no-referrer`; it shows no owner identity. "Stop sharing" clears the token immediately.

## Uploads

- 10 MB limit (bucket) plus type checks in UI; Phase 2 adds server-side MIME validation and rejects executables (UNT-67).
- Never render uploaded HTML/SVG inline; images and audio use `<img>`/`<audio>` via signed URLs; other files open in a new tab with `rel="noopener noreferrer"`.

## AI and tools (Phase 4)

- Tool output and external content are data, not instructions (prompt-injection rules in the prompt library, UNT-84).
- **Any write action by the AI (send mail, create/delete events or tasks) requires explicit user confirmation** with a preview (UNT-82).
- Log tool calls to the audit log; meter usage; cap per-user spend (UNT-83).
- Don't send more context to a provider than the feature needs; document what each provider receives.

## Web hardening (Phase 6)

CSP and security headers, Cloudflare WAF + rate limits, dependency audit, secret scanning in CI, bot protection on auth endpoints (UNT-98, UNT-99).

## Reporting and incidents

Found a vulnerability or leaked secret? Tell the tech lead immediately, rotate first, investigate second, and write down what happened here.

## Phase 6 checklist (to be signed off)

- [ ] Every table has RLS + tests; no unintended anon access
- [ ] Service-role usage reviewed (list below)
- [ ] CSP / headers deployed; cookies `Secure`, `HttpOnly`, `SameSite=Lax`
- [ ] Rate limits on auth, AI, upload and share endpoints
- [ ] Share links, uploads and admin actions reviewed
- [ ] AI tool confirmation + injection tests in CI
- [ ] Secrets rotated after development; none in git history (gitleaks)
- [ ] Backups and restore drill done
- [ ] Privacy policy matches actual data flows

### Service-role usage (keep this list current)

`src/server/session.ts` `adminDb()` / `withOwner()` (admin panel, share page, announcements, audit) · `src/app/admin/actions.ts` · `src/app/dashboard/settings/actions.ts` (delete account) · `src/app/share/[token]/page.tsx`.
