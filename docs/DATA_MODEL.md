# Data model

PostgreSQL 16 (Docker). **All tables have Row-Level Security enabled.** Migrations live in `db/migrations/` and are append-only. Update this file in the same PR as any schema change.

## Current tables

| Table             | Purpose                          | Key columns                                                                                                                                                                                  | Access                                                                                                                                                 |
| ----------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `profiles`        | Per-user settings row            | `user_id` PK, `plan` ('free'/'pro', **not used by billing**: see `user_billing`), `personality` (unused)                                                                                                                                  | Owner can read/insert (plan must be 'free')/update; `update(plan)` revoked for `authenticated` — plan changes are service-role only                    |
| `tasks`           | To-do items                      | `user_id`, `title`, `description`, `priority` 1–4, `list_id`→`task_lists`, `due_date` (date), `done`/`done_at`, `cancelled`, `archived`, `recurrence` (daily/weekdays/weekly/monthly/yearly, or `nth:N:day` such as `nth:2:wed` = every 2nd Wednesday) | Owner only; `list_id` must be a list the user owns                                                                                                     |
| `task_lists`      | Named lists                      | `user_id`, `name`, `color` (tint name)                                                                                                                                                       | Owner only                                                                                                                                             |
| `journal_entries` | Many timestamped entries per day | `user_id`, `entry_date` (date), `body`, `kind` (text/voice), `attachments` jsonb, `share_token` (32 hex, unique, null = private), `shared_at`, `created_at`                                                                                               | Owner only                                                                                                                                             |
| `health_daily` | Daily health aggregates synced from the phone | `user_id`, `day` (date, unique per user), `steps`, `distance_m`, `active_kcal`, `resting_hr`, `hr_min`, `hr_max`, `sleep_minutes`, `source` (healthkit/health_connect), `synced_at` | Owner only |
| `shared_journals` | Journals several people write in | `owner_id`, `name` (≤80) | Members read; owner updates/deletes |
| `shared_journal_members` | People in a shared journal | `journal_id`, `user_id`, `role` (editor/viewer); the owner is `shared_journals.owner_id`, not a row here | Members read; owner changes role/removes; anyone may leave; **no insert policy** (added only when an invite is accepted, by server code) |
| `shared_journal_invites` | Invitations by username | `journal_id`, `inviter_id`, `invitee_id`, `role`, `status` (pending/accepted/declined), one pending per person per journal | Invitee and owner read; owner withdraws; created/answered by server code only |
| `shared_journal_entries` | Entries in a shared journal | `journal_id`, `user_id` (author), `entry_date`, `body`, `kind`, `attachments` jsonb | Members read; owner/editor insert as themselves; author edits own; author or owner deletes |
| `notes`           | Notes                            | `user_id`, `title`, `body` (markdown), `category`, `pinned`, `kind`, `sort_order`, `color`, `attachments` jsonb                                                                              | Owner only                                                                                                                                             |
| `note_versions`   | History snapshots                | `note_id`→`notes` cascade, `title`, `body`, `created_at`                                                                                                                                     | Owner only; written by trigger `snapshot_note` (≤1 per 2 min, newest 30 kept)                                                                          |
| `chats`           | Conversations                    | `user_id`, `title`, `pinned`, `folder_id`→`chat_folders`, `last_read_at`, `share_token` (32 hex, unique, null = private), `shared_at`, `updated_at`                                          | Owner only; `folder_id` must be the user's. Public sharing is served by the server (service role) looking up the exact token — never by an anon policy |
| `chat_folders`    | Chat folders                     | `user_id`, `name`                                                                                                                                                                            | Owner only                                                                                                                                             |
| `chat_messages`   | Messages                         | `chat_id`→`chats` cascade, `user_id`, `role` (user/assistant), `body`, `attachments` jsonb                                                                                                   | Owner only; chat must be the user's                                                                                                                    |
| `calendar_events` | Calendar entries / synced cache  | `user_id`, `title`, `description`, `location`, `start_at`, `end_at`, `all_day`, `color`, `calendar_id`, `external_id`                                                                       | Owner only (`user_id = auth.uid()`)                                                                                                                    |
| `billing_plans`   | The three plans on offer, edited in Admin → Plans | `id` (subscription/payg/byo), `name`, `tagline`, `price_cents` (smallest unit: paise for INR), `currency` (default `inr`), `interval` (month/year/none), `included_tokens`, `token_price_cents_per_million`, `features` text[], `active`, `sort` | Authenticated can **select where active**; writes service-role only (insert/update/delete revoked) |
| `user_billing`    | The plan a person chose          | `user_id` PK, `plan_id`→`billing_plans`, `status` (active/canceled), `period_start`, `period_end`, `cancel_at_period_end`, `started_at`, `canceled_at`. No row = no plan chosen | Owner reads; **no client writes**, the billing service changes it |
| `ai_usage`        | Metered AI use, tokens only      | `user_id`, `plan_id`, `provider`, `input_tokens`, `output_tokens`, `created_at` | Owner reads; only the billing service inserts |
| `user_ai_keys`    | A person's own AI key (own-key plan) | `user_id` PK, `provider`, `model`, `key_cipher` (AES-256-GCM, bound to the user), `key_hint` (last 4) | **No access for `authenticated`**; server only |
| `admin_audit`     | Admin action log                 | `admin_id`, `admin_email`, `action`, `target`, `meta` jsonb                                                                                                                                  | RLS on with **no policies** → service role only                                                                                                        |
| `announcements`   | Banners from admins              | `message`, `tone`, `active`                                                                                                                                                                  | Authenticated can **select where active**; writes service-role only                                                                                    |
| `auth.users`      | Better Auth accounts             | `email`, nullable unique `username`, nullable `"displayUsername"` (username plugin display value; backfilled from `display_username`), role, ban state/reason/expiry                   | Auth schema, server only; username availability endpoint disabled                                                                                      |
| `auth.sessions`   | Better Auth sessions             | `user_id`, token, expiry, optional `impersonated_by`                                                                                                                                        | Auth schema, server only                                                                                                                               |
| `auth.passkeys`   | Better Auth WebAuthn credentials | `user_id`, `credential_id`, `public_key`, counter and authenticator metadata                                                                                                                 | Auth schema, RLS enabled with no client policies; Better Auth server only                                                                              |

`attachments` is `[{ path, name, type, size }]` where `path` is a key in a Storage bucket.

## Storage

| Bucket       | Public            | Limit | Path convention                                                               | Policy                                                                                   |
| ------------ | ----------------- | ----- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `note-files` | no                | 10 MB | `<user_id>/<area>/<id>/<uuid>-<filename>` (areas: note id, `journal`, `chat`; shared journals use `<author id>/shared-journal/<journal id>/…`, readable by every member of that journal) | Owner folder only (`storage.foldername(name)[1] = auth.uid()`); read through signed URLs |
| `avatars`    | yes (images only) | 2 MB  | `<user_id>/avatar-<timestamp>.<ext>`                                          | Owner folder only for writes                                                             |

## Auth metadata (not tables)

- `user_metadata`: `full_name`, `avatar_url`, `preferences` { `timeFormat`, `defaultCategory`, `weekStart`, `density`, `reduceMotion`, `todoView` }. Users can edit their own.
- `app_metadata.role = 'admin'`: set only with the service role. `ADMIN_EMAILS` env var bootstraps first admins (also protects them from demotion in the panel).

## Migrations so far (apply in order)

1. `…000000_workspace.sql` — profiles, tasks, journal, notes, chats, chat_messages + RLS
2. `…010000_notes_v2.sql` — categories, pin, voice, ordering, attachments, `note_versions` + trigger, `note-files` bucket
3. `…020000_note_color.sql` — note colour
4. `…030000_journal_entries.sql` — many entries/day, attachments, kind
5. `…040000_todo_v2.sql` — `task_lists`, priorities, cancel/archive, recurrence
6. `…050000_admin_and_avatars.sql` — `admin_audit`, `announcements`, `avatars` bucket
7. `…060000_chat_v2.sql` — folders, pin, unread, message attachments
8. `…070000_chat_share.sql` — `share_token`, `shared_at`
9. `…08100000_auth_passkeys.sql` — private Better Auth WebAuthn credentials in `auth.passkeys`
10. `…08110000_auth_username.sql` — username fields and normalized uniqueness for Better Auth users
11. `…08120000_auth_username_plugin_column.sql` — add Better Auth username plugin's `"displayUsername"` column and backfill existing display values
12. `…08130000_auth_admin_plugin.sql` — add Better Auth admin ban metadata and impersonation session field
13. `…10120000_calendar_events.sql` — `calendar_events` table + RLS policies and indexes
14. `20261020120000_shared_journals.sql` — shared journals: journals, members, invites, entries, `shared_journal_role()` helper, RLS, and a realtime trigger that notifies every person in a journal
15. `20261021120000_journal_entry_share.sql` — `share_token` / `shared_at` on `journal_entries`: a secret, revocable public link to one entry (same model as shared chats)

## Planned (by phase)

| Phase | Tables / changes                                                                                                                                                                                                     |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `workspaces`, `workspace_members(role)`, `workspace_invites`; `workspace_id` on notes/tasks/task_lists/chats/folders (journal stays author-private); SQL helpers `is_workspace_member()`, `workspace_role()`; `jobs` |
| 2     | `tags` + join tables, note backlinks, soft-delete columns, `subtasks` (parent_id), labels, reminders, mood on journal entries, tsvector + GIN indexes                                                                |
| 3     | `integration_connections`, `calendar_events` (cache), email thread metadata cache                                                                                                                                    |
| 4     | `user_ai_settings`, `ai_usage`, embeddings (pgvector)                                                                                                                                                                |
| 5     | `meetings`, `meeting_transcripts`, `automations`, `automation_runs`, `notifications`, `notification_preferences`                                                                                                     |
| 6     | Billing columns/tables (Stripe ids), aggregated usage views                                                                                                                                                          |

## Rules of thumb

- `timestamptz` for moments, `date` for calendar days; store UTC.
- UUID primary keys (`gen_random_uuid()`), `user_id uuid default auth.uid()` on user-owned rows so clients can't spoof ownership.
- Index every column you filter or sort by in lists (e.g. `(user_id, due_date)`).
- A policy of `auth.uid() is not null` is **not** access control.
- Tokens/OAuth credentials are never stored — Composio holds them; we keep connection ids.

## RSS reader

- `rss_feeds` — a person's subscriptions: `url` (unique per user), `site_url`, `title`, `description`, `image_url`, `last_fetched_at`, `last_error`. RLS: owner only.
- `rss_items` — articles as plain text: `guid` (unique per feed), `title`, `link`, `summary`, `content`, `image_url`, `author`, `published_at`, `is_read`, `is_starred`. RLS: owner only, and the feed must belong to the same user. Trimmed to the newest `RSS.itemsPerFeed` per feed (starred ones are kept).
16. `20261025120000_rss_reader.sql` — Reader: `rss_feeds`, `rss_items` + RLS
17. `20261026120000_billing_plans.sql` — plans and billing: `billing_plans` (seeded with placeholder prices), `user_billing`, `ai_usage`, `user_ai_keys`; RLS, and writes revoked from `authenticated` (see `docs/BILLING.md`)
