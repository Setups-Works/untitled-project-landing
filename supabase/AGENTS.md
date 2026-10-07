# supabase/

**Contents:** `config.toml` (CLI config, linked project) and `migrations/` — the database history. **Owner:** track A reviews every migration (tech lead approves).

## Commands

```bash
npx supabase migration new <snake_name>   # create supabase/migrations/<timestamp>_<name>.sql
npx supabase db push --linked             # apply pending migrations to the linked project (dev!)
npx supabase db diff --linked             # see drift between local migrations and the project
```

## Rules

- **Append-only.** Never edit a migration that has been applied anywhere; write a new one.
- Every new table: `enable row level security`, explicit policies (owner / workspace member), indexes, `on delete cascade` for ownership FKs. A policy of `auth.uid() is not null` is not access control.
- Make migrations backward-compatible with the previous app version (add columns nullable/with defaults first, remove later) so deploys can't break running code.
- Storage buckets are private by default; policies restrict paths to the owner/workspace.
- Backfills belong in the migration; test them on a copy of real data for big changes (UNT-54).
- Update `docs/DATA_MODEL.md` in the same PR. Never point local/preview at production.
