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
| `S3_ACCESS_KEY`                                     | file storage credentials             | server only                                               |
| `S3_ENDPOINT`, `S3_REGION`, `S3_AUTO_CREATE_BUCKETS` | object storage endpoint and behavior | server-only configuration                                 |
| `ADMIN_EMAILS`                                    | bootstrap admins                     | server only                                              |
| `GROQ_API_KEY`, `COMPOSIO_API_KEY`                | AI / integrations services           | server only (Phase 3–4)                                  |
| `CRON_SECRET`                                     | protects `/api/v1/jobs/*`            | server only                                              |
| `SENTRY_*`, `NEXT_PUBLIC_POSTHOG_KEY`             | observability                        | DSN/keys are public identifiers; auth tokens server only |
| Stripe keys                                       | billing                              | server only (Phase 6)                                    |

Rotation: change the value in `.env.selfhost` / your secret manager and recreate the containers (rotating `BETTER_AUTH_SECRET` signs everyone out); hosting dashboard → Environment Variables; Vercel → Environment Variables; then redeploy **without build cache** (NEXT_PUBLIC values are baked at build). A pasted value containing characters like “…” or spaces breaks every request — the app now detects this and says which variable is wrong.

## Auth and sessions

- Better Auth with email+password and Google; sessions stored in PostgreSQL (cookie `better-auth.session_token`); `apps/web/src/proxy.ts` only redirects, every page re-verifies the session.
- Google One Tap runs on the login and signup pages through Better Auth. The public client ID is returned by `/api/v1/auth-config`; the secret stays server-side. Add each deployed site origin (including `http://localhost:3000` for local development) to the Google OAuth client's Authorized JavaScript origins. The standard Google button remains available if the prompt is unavailable or dismissed.
- Better Auth's last-login-method plugin keeps only the most recently used method name in a readable, first-party cookie for 30 days, so the login form can show a “Last used” hint. It does not store this preference in the database.
- Better Auth's admin plugin endpoints require the `admin` role. The app's `/admin` pages and server actions continue to enforce `requireAdmin`/`assertAdmin`, protect the acting admin and `ADMIN_EMAILS` accounts, and record admin-panel mutations in `admin_audit`.
- Usernames are optional for existing accounts, required for new email/password signups, normalized to lowercase, and unique. Users can set or change them in Profile settings; the public availability endpoint is disabled to reduce username enumeration.
- Passkeys use Better Auth WebAuthn and are stored in `auth.passkeys`, an RLS-enabled server-only table with no client policies. `BETTER_AUTH_URL` must match the public auth origin; production passkeys require HTTPS. The Expo client uses the device credential manager and needs a native development/release build. Set `PASSKEY_ORIGINS` to the comma-separated Android signing origins (`android:apk-key-hash:<base64-sha256>`) for every build certificate; Android also needs `/.well-known/assetlinks.json`, and iOS needs the `webcredentials:` associated domain plus an Apple App Site Association file. These values must match the app's actual signing and bundle identifiers.
- `BETTER_AUTH_TRUSTED_ORIGINS` is a comma-separated list merged into Better Auth's trusted origins. Set it to `exp://**` when testing OAuth from Expo Go against a deployed backend; server config also normalizes a plain `exp://` value to that wildcard pattern.
- Forgot-password uses Better Auth email OTPs: six digits, five-minute expiry, three attempts, hashed at rest, and limited to three requests per minute. The UI uses a generic response so it does not reveal whether an email has an account. OTPs are sent through the configured SMTP transport and must never be logged.
- Redirect targets (`?next=`) are validated by `safeNext` (same-site relative paths only).
- Admin = `app_metadata.role = 'admin'` or an email in `ADMIN_EMAILS`. Every `/admin/*` page and server action re-checks on the server (`requireAdmin` / `assertAdmin`). Admins can't demote/ban/delete themselves or `ADMIN_EMAILS` accounts.
- Account deletion and "reset workspace" remove rows **and** storage files.

## Data protection

- RLS on every table (see `DATA_MODEL.md`). New tables without RLS must not merge.
- Private Storage bucket for user files with owner-folder policies; files are served through short-lived signed URLs.
- Journal entries are private to their author even in shared workspaces. **Shared journals** are a separate, opt-in thing: they live in their own tables, a person sees one only as its owner or after accepting an invitation, and the role (owner / editor / viewer) is enforced by row-level security, not by the UI. Members never see each other's email, only username and name. Inviting is rate limited, a journal holds at most 20 people, and a stranger who guesses a journal id gets "not found". Files attached to shared entries are readable only by members of that journal and uploadable only by their author.
- The admin Usage page reads only ids/counts — never user content. Admin tools must not expose note/journal/chat content.
- Audit log: every admin action recorded in `admin_audit` (service-role only).

## Public sharing

- Chats are private unless `share_token` is set (32 random hex chars). The public page `/share/[token]` queries by exact token on the server; no anon RLS policy exists that would allow listing shared chats.
- The page is `noindex` with `referrer: no-referrer`; it shows no owner identity. "Stop sharing" clears the token immediately.
- A single **journal entry** can be shared the same way (`journal_entries.share_token`, page `/share/journal/[token]`): a random 32-hex token, looked up by exact match on the server, read-only, no name or email, files signed only when they sit in the author's own folder, switched off instantly, and turning it on again makes a new token. Nothing else in the journal is reachable from the link.

## Uploads

- 10 MB limit (bucket) plus type checks in UI; Phase 2 adds server-side MIME validation and rejects executables (UNT-67).
- Never render uploaded HTML/SVG inline; images and audio use `<img>`/`<audio>` via signed URLs; other files open in a new tab with `rel="noopener noreferrer"`.

## Plans, usage and saved API keys

Full design: `docs/BILLING.md`.

- A person cannot write their own plan, usage or prices: `user_billing`, `ai_usage` and `billing_plans` have no client write path (grants revoked, tested in `tests/db/billing.test.ts`); the billing service changes them after checking the caller.
- **A saved AI key is a secret.** It is stored AES-256-GCM sealed with a key derived from `BETTER_AUTH_SECRET` and bound to the user id; `user_ai_keys` is unreadable by `authenticated`; the browser only gets the last four characters. Never log a key or return it. Rotating `BETTER_AUTH_SECRET` makes saved keys unreadable (people re-enter them).
- The own-key provider can only call the fixed hosts in `BYO_PROVIDERS` (`packages/logic/src/billing.ts`). **Never build that address from user input** (SSRF), and never pass a provider's error body on.
- Every AI entry point must call `aiAccessFor()` first (plan check, allowance, own key) and `record()` after. Only token counts are stored, never prompts or answers.
- Admin plan changes require `assertAdmin()` and are written to `admin_audit`.

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

`apps/web/src/server/session.ts` `adminDb()` / `withOwner()` (admin panel, share page, announcements, audit) · `apps/web/src/server/repositories/billing.repository.ts` (writes to plans, a person's plan, usage and saved keys; reached only from `services/billing` after the caller is checked) · `apps/web/src/app/admin/plans/actions.ts` · `apps/web/src/app/admin/actions.ts` · `apps/web/src/app/dashboard/settings/actions.ts` (delete account) · `apps/web/src/app/share/[token]/page.tsx`.
