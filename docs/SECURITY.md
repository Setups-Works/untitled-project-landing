# Security

Rules for everyone (and every AI agent). The checklist at the bottom is finished in Phase 6 (UNT-99).

## Principles

1. **Authorisation lives in the database (RLS) and the services**, never only in the UI.
2. **Least privilege:** the browser gets only the anon key; the service-role key is used in few, reviewed places and always after an explicit permission check.
3. **Untrusted input everywhere:** user text, uploads, emails, transcripts, tool output, URL params.
4. **No secrets in code, git, chats or logs.** Rotate on any suspicion.

## Secrets inventory (names only)

| Variable | Where used | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | public by design (RLS protects data); validated in `src/lib/supabase/config.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | admin panel, share page, account deletion, server jobs | **server only** |
| `ADMIN_EMAILS` | bootstrap admins | server only |
| `GROQ_API_KEY`, `COMPOSIO_API_KEY` | AI / integrations services | server only (Phase 3–4) |
| `CRON_SECRET` | protects `/api/v1/jobs/*` | server only |
| `SENTRY_*`, `NEXT_PUBLIC_POSTHOG_KEY` | observability | DSN/keys are public identifiers; auth tokens server only |
| Stripe keys | billing | server only (Phase 6) |

Rotation: Supabase dashboard → Settings → API / Database; Vercel → Environment Variables; then redeploy **without build cache** (NEXT_PUBLIC values are baked at build). A pasted value containing characters like “…” or spaces breaks every request — the app now detects this and says which variable is wrong.

## Auth and sessions

- Supabase Auth with email+password and Google; sessions refreshed by `src/proxy.ts`.
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

`src/lib/supabase/admin.ts` (admin panel, share page, announcements, audit) · `src/app/admin/actions.ts` · `src/app/dashboard/settings/actions.ts` (delete account) · `src/app/share/[token]/page.tsx`.
