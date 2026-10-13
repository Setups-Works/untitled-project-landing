# Self-hosting (Docker)

The whole product runs on services you control. There is no Supabase or other hosted backend.

| Need           | Service                                         | Where in the code                                             |
| -------------- | ----------------------------------------------- | ------------------------------------------------------------- |
| Database       | **PostgreSQL 16** with Row-Level Security       | `db/migrations`, `apps/web/src/server/db/*`                            |
| Sign-in        | **Better Auth** (email+password, Google)        | `apps/web/src/server/auth.ts`, `/api/auth/*`, `apps/web/src/lib/auth/client.ts` |
| Files          | **S3-compatible storage** (SeaweedFS in Docker) | `apps/web/src/server/storage.ts`, `/api/v1/storage/*`                  |
| Realtime       | Postgres `pg_notify` → Server-Sent Events       | `apps/web/src/server/realtime.ts`, `/api/v1/realtime`                  |
| Cache / limits | **Redis 7**                                     | `apps/web/src/server/redis.ts`                                         |
| Email          | SMTP (Mailpit in dev, your provider in prod)    | `apps/web/src/server/mail.ts`                                          |

> MinIO stopped publishing Docker images, so object storage runs on SeaweedFS. The app only speaks the S3 API: MinIO, Garage, RustFS, Cloudflare R2 or AWS S3 work by changing the `S3_*` variables.

## How requests are secured

1. The browser never talks to the database or the object store. Data goes through `/api/v1/db`, files through `/api/v1/storage/*`.
2. `/api/v1/db` takes a JSON query description (not SQL). The server validates every table and column against the real schema, only allows tables listed in `CLIENT_TABLES` (`apps/web/src/server/db/schema.ts`), sends every value as a SQL parameter, and requires a signed-in session.
3. The query runs in a transaction as the `authenticated` database role with `app.user_id` set, so the RLS policies (`user_id = auth.uid()`) decide what the user can see and change. Owner-level access (`adminDb()`, `withOwner()`) is only used by admin code and the public share page, after explicit checks.
4. Files are keyed `<user id>/…`; the storage routes refuse any key outside the caller's folder. Private files are served to the owner, or through expiring HMAC-signed links (shared chats).
5. State-changing routes also check the `Origin` header, on top of `SameSite=Lax` cookies.

## Local development

```bash
cp .env.selfhost.example .env.selfhost   # change every password
cp .env.example apps/web/.env.local      # same passwords, host addresses (127.0.0.1)
corepack pnpm docker:up
corepack pnpm db:migrate
corepack pnpm dev:web
```

Mailpit shows every email at http://localhost:8025 (verification and reset links). To send real email, set `SMTP_URL` (and `MAIL_FROM`) in `apps/web/.env.local`, e.g. `smtps://user%40example.com:password@smtp.example.com:465` (URL-encode special characters).

Stop: `corepack pnpm docker:down`. Wipe all local data: `docker compose --env-file .env.selfhost down -v`.

## Running the app in Docker too

```bash
docker compose --env-file .env.selfhost --profile app up -d --build
```

This builds the image (`Dockerfile`, Next.js `standalone` output), runs `migrate` once, then starts `web` on `127.0.0.1:3000`. Put a TLS reverse proxy (Caddy, Traefik, Nginx, Cloudflare Tunnel) in front.

## Using Cloudflare R2 for free-tier object storage

R2 provides an S3-compatible API, so the application can use it without changing the storage transport. Its Standard tier currently includes 10 GB-month of storage, 1 million Class A operations and 10 million Class B operations each month; usage above those allowances can be billed. See [R2 pricing](https://developers.cloudflare.com/r2/pricing/).

Create two R2 buckets named `avatars` and `note-files`, then create an S3 API token with **Object Read & Write** scoped to those buckets. In Azure App Service settings, set `S3_ENDPOINT` to `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`, set `S3_REGION=auto`, set `S3_ACCESS_KEY` and `S3_SECRET_KEY` to the token credentials, and set `S3_AUTO_CREATE_BUCKETS=false`. Pre-creating the buckets lets the app use a bucket-scoped token without account-wide bucket-management access. Keep the credentials in Azure settings, never in client code. See [R2 S3 API compatibility](https://developers.cloudflare.com/r2/api/s3/api/) and [R2 authentication](https://developers.cloudflare.com/r2/api/tokens/).

## Production checklist

- Strong random values for every secret in `.env.selfhost` (`openssl rand -hex 24`); `BETTER_AUTH_URL` = the public https address.
- Do not publish ports 5432, 6379, 8333 or 8025 to the internet (they bind to 127.0.0.1 by default).
- Real SMTP with SPF/DKIM for your sending domain.
- **Backups, tested:** nightly `pg_dump` (plus WAL archiving for point-in-time recovery) and a copy of the `storagedata` volume, stored off the server. Try a restore before you need one.
- Set up Google sign-in (optional): create OAuth credentials, add `<BETTER_AUTH_URL>/api/auth/callback/google` as a redirect URI, set `GOOGLE_CLIENT_ID/SECRET`.
- Keep images updated; monitor disk space; limit SSH access.
- Run more than one `web` instance only after reading "Scaling" below.

## Deploying the Azure Docker app with GitHub Actions

The workflow at `.github/workflows/deploy-azure-docker.yml` builds the web app from the repository `Dockerfile`, publishes an immutable commit-tagged image and `latest` to Docker Hub, then deploys the commit-tagged image to the Azure Web App. It runs on pushes to `main` when app, shared package, database migration, or image build files change. You can also run it from the repository's **Actions** tab with **Run workflow**.

Add these repository secrets in **Settings → Secrets and variables → Actions** before the first run. Azure Deployment Center creates the three Azure identity secrets when GitHub Actions is connected; the workflow below uses the generated names for this app:

| Secret | Value |
| --- | --- |
| `DOCKERHUB_USERNAME` | Docker Hub username (`nitheeshdr`) |
| `DOCKERHUB_TOKEN` | Docker Hub access token with read/write permission for `nitheeshdr/untitled-workspace` |
| `AZUREAPPSERVICE_CLIENTID_136B4B7A0DD148E6A7E948CBCACAF485` | Client ID generated by Azure Deployment Center |
| `AZUREAPPSERVICE_TENANTID_D06354EBB57E49C48FE1EAAFAD01349B` | Tenant ID generated by Azure Deployment Center |
| `AZUREAPPSERVICE_SUBSCRIPTIONID_9014276113D9451381B961FBAFF693B0` | Subscription ID generated by Azure Deployment Center |

For the Azure portal's **Deployment Center → GitHub Actions → Registry settings**, configure Docker Hub separately from the image name:

| Portal field | Value |
| --- | --- |
| Image source | Other container registries |
| Image type | Private |
| Registry login server | `https://index.docker.io` (this is the registry URL, not the Docker Hub username) |
| Registry user name | `nitheeshdr` |
| Registry password | A Docker Hub access token with pull access to the repository |
| Image | `nitheeshdr/untitled-workspace:latest` |

The GitHub workflow logs in to `docker.io` to push the image; App Service separately needs the private-registry credentials above to pull it. The workflow uses Azure OIDC to sign in and deploys the commit-tagged image after pushing it. If the Docker Hub repository is public, select **Public** in the portal and leave its private-registry credential fields empty.

The workflow file must be committed to and pushed to the selected GitHub branch before Azure can select it under **Use available workflow**. If it is not on `main`, choose **Add a workflow** or push the file first. Treat the Azure identity values and Docker Hub token as credentials. Keep runtime application settings, including the database URL and Better Auth secret, in the Azure Web App configuration; the workflow does not put them in the image or GitHub Actions logs.

## Scaling notes

Realtime events are delivered by each web process from its own Postgres `LISTEN` connection, so any number of instances work (each tab connects to one). Sessions live in PostgreSQL, so instances share logins. Add PgBouncer if you exceed ~100 connections.

## Moving existing data from Supabase

Users keep their ids so all rows stay linked. High level:

1. Export the Supabase database: `pg_dump --data-only --schema=public --disable-triggers` for the `public` tables, plus `select id, email, raw_user_meta_data->>'full_name', email_confirmed_at, encrypted_password, created_at from auth.users`.
2. Create the tables with `corepack pnpm db:migrate`, insert the users into `auth.users` (same `id`) and `auth.accounts` (`provider_id = 'credential'`, `account_id` = user id). Supabase uses bcrypt, Better Auth uses scrypt: users who can't sign in with their old password should use "Forgot password" (or add a bcrypt `password.verify` to `apps/web/src/server/auth.ts`).
3. Import the public tables, then download the Supabase Storage buckets (`avatars`, `note-files`) and upload them with the same `<user id>/…` keys.
4. Move `preferences` / onboarding state from the old `user_metadata` into `profiles.preferences` / `profiles.onboarding`.

Do a rehearsal on a copy first, keep the Supabase project paused (not deleted) for a few weeks.
