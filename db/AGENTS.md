# db/ — database history

**Contents:** `migrations/` — plain SQL, applied in filename order by `scripts/db/migrate.mjs`. **Owner:** track A reviews every migration (tech lead approves).

## Commands

```bash
docker compose --env-file .env.selfhost up -d   # PostgreSQL, Redis, object storage, Mailpit
npm run db:migrate                              # apply pending migrations (recorded in public.schema_migrations)
```

Create a migration by adding `db/migrations/<YYYYMMDDHHMMSS>_<snake_name>.sql`. The runner wraps each file in a transaction.

## Rules

- **Append-only.** Never edit a migration that has been applied anywhere; write a new one.
- Every new table: `enable row level security`, explicit policies (`user_id = auth.uid()` for private data), indexes, `on delete cascade` to `auth.users(id)`. A policy of `auth.uid() is not null` is not access control.
- The app runs user requests as the `authenticated` role with `app.user_id` set (see `src/server/db/pool.ts`), so RLS is real. New tables get `select/insert/update/delete` for `authenticated` automatically (default privileges in `docker/postgres/init/00-roles.sql`). To stop users editing a column (like `profiles.plan`), revoke table-level `update` and grant `update (col, …)` on the allowed columns — a column-level `revoke` alone does nothing.
- To let the browser query a new table, add it to `CLIENT_TABLES` in `src/server/db/schema.ts`. Tables not listed there (e.g. `admin_audit`, everything in `auth`) are server-only.
- Want realtime for a table? Add it to the trigger list in a new migration (see `20261007080000_realtime.sql`); the table needs a `user_id` column.
- Make migrations backward-compatible with the previous app version (add columns nullable/with defaults first, remove later) so deploys can't break running code.
- Files are not in Postgres: they live in object storage (`avatars`, `note-files`), keyed `<user id>/…`.
- Update `docs/DATA_MODEL.md` in the same PR. Never point local/preview at production.
