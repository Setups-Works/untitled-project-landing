# Self-hosting (Docker)

The whole product runs on services you control. There is no Supabase or other hosted backend.

| Need           | Service                                         | Where in the code                                             |
| -------------- | ----------------------------------------------- | ------------------------------------------------------------- |
| Database       | **PostgreSQL 16** with Row-Level Security       | `db/migrations`, `src/server/db/*`                            |
| Sign-in        | **Better Auth** (email+password, Google)        | `src/server/auth.ts`, `/api/auth/*`, `src/lib/auth/client.ts` |
| Files          | **S3-compatible storage** (SeaweedFS in Docker) | `src/server/storage.ts`, `/api/v1/storage/*`                  |
| Realtime       | Postgres `pg_notify` → Server-Sent Events       | `src/server/realtime.ts`, `/api/v1/realtime`                  |
| Cache / limits | **Redis 7**                                     | `src/server/redis.ts`                                         |
| Email          | SMTP (Mailpit in dev, your provider in prod)    | `src/server/mail.ts`                                          |

> MinIO stopped publishing Docker images, so object storage runs on SeaweedFS. The app only speaks the S3 API: MinIO, Garage, RustFS or AWS S3 work by changing the `S3_*` variables.

## How requests are secured

1. The browser never talks to the database or the object store. Data goes through `/api/v1/db`, files through `/api/v1/storage/*`.
2. `/api/v1/db` takes a JSON query description (not SQL). The server validates every table and column against the real schema, only allows tables listed in `CLIENT_TABLES` (`src/server/db/schema.ts`), sends every value as a SQL parameter, and requires a signed-in session.
3. The query runs in a transaction as the `authenticated` database role with `app.user_id` set, so the RLS policies (`user_id = auth.uid()`) decide what the user can see and change. Owner-level access (`adminDb()`, `withOwner()`) is only used by admin code and the public share page, after explicit checks.
4. Files are keyed `<user id>/…`; the storage routes refuse any key outside the caller's folder. Private files are served to the owner, or through expiring HMAC-signed links (shared chats).
5. State-changing routes also check the `Origin` header, on top of `SameSite=Lax` cookies.

## Local development

```bash
cp .env.selfhost.example .env.selfhost   # change every password
cp .env.example .env.local               # same passwords, host addresses (127.0.0.1)
npm run docker:up
npm run db:migrate
npm run dev
```

Mailpit shows every email at http://localhost:8025 (verification and reset links). To send real email, set `SMTP_URL` (and `MAIL_FROM`) in `.env.local`, e.g. `smtps://user%40example.com:password@smtp.example.com:465` (URL-encode special characters).

Stop: `npm run docker:down`. Wipe all local data: `docker compose --env-file .env.selfhost down -v`.

## Running the app in Docker too

```bash
docker compose --env-file .env.selfhost --profile app up -d --build
```

This builds the image (`Dockerfile`, Next.js `standalone` output), runs `migrate` once, then starts `web` on `127.0.0.1:3000`. Put a TLS reverse proxy (Caddy, Traefik, Nginx, Cloudflare Tunnel) in front.

## Production checklist

- Strong random values for every secret in `.env.selfhost` (`openssl rand -hex 24`); `BETTER_AUTH_URL` = the public https address.
- Do not publish ports 5432, 6379, 8333 or 8025 to the internet (they bind to 127.0.0.1 by default).
- Real SMTP with SPF/DKIM for your sending domain.
- **Backups, tested:** nightly `pg_dump` (plus WAL archiving for point-in-time recovery) and a copy of the `storagedata` volume, stored off the server. Try a restore before you need one.
- Set up Google sign-in (optional): create OAuth credentials, add `<BETTER_AUTH_URL>/api/auth/callback/google` as a redirect URI, set `GOOGLE_CLIENT_ID/SECRET`.
- Keep images updated; monitor disk space; limit SSH access.
- Run more than one `web` instance only after reading "Scaling" below.

## Scaling notes

Realtime events are delivered by each web process from its own Postgres `LISTEN` connection, so any number of instances work (each tab connects to one). Sessions live in PostgreSQL, so instances share logins. Add PgBouncer if you exceed ~100 connections.

## Moving existing data from Supabase

Users keep their ids so all rows stay linked. High level:

1. Export the Supabase database: `pg_dump --data-only --schema=public --disable-triggers` for the `public` tables, plus `select id, email, raw_user_meta_data->>'full_name', email_confirmed_at, encrypted_password, created_at from auth.users`.
2. Create the tables with `npm run db:migrate`, insert the users into `auth.users` (same `id`) and `auth.accounts` (`provider_id = 'credential'`, `account_id` = user id). Supabase uses bcrypt, Better Auth uses scrypt: users who can't sign in with their old password should use "Forgot password" (or add a bcrypt `password.verify` to `src/server/auth.ts`).
3. Import the public tables, then download the Supabase Storage buckets (`avatars`, `note-files`) and upload them with the same `<user id>/…` keys.
4. Move `preferences` / onboarding state from the old `user_metadata` into `profiles.preferences` / `profiles.onboarding`.

Do a rehearsal on a copy first, keep the Supabase project paused (not deleted) for a few weeks.
