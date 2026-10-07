# Data model

Supabase Postgres. **All tables have Row-Level Security enabled.** Migrations live in `supabase/migrations/` and are append-only. Update this file in the same PR as any schema change.

## Current tables

| Table | Purpose | Key columns | Access |
| --- | --- | --- | --- |
| `profiles` | Per-user settings row | `user_id` PK, `plan` ('free'/'pro'), `personality` (unused) | Owner can read/insert (plan must be 'free')/update; `update(plan)` revoked for `authenticated` — plan changes are service-role only |
| `tasks` | To-do items | `user_id`, `title`, `description`, `priority` 1–4, `list_id`→`task_lists`, `due_date` (date), `done`/`done_at`, `cancelled`, `archived`, `recurrence` (daily/weekdays/weekly/monthly/yearly) | Owner only; `list_id` must be a list the user owns |
| `task_lists` | Named lists | `user_id`, `name`, `color` (tint name) | Owner only |
| `journal_entries` | Many timestamped entries per day | `user_id`, `entry_date` (date), `body`, `kind` (text/voice), `attachments` jsonb, `created_at` | Owner only |
| `notes` | Notes | `user_id`, `title`, `body` (markdown), `category`, `pinned`, `kind`, `sort_order`, `color`, `attachments` jsonb | Owner only |
| `note_versions` | History snapshots | `note_id`→`notes` cascade, `title`, `body`, `created_at` | Owner only; written by trigger `snapshot_note` (≤1 per 2 min, newest 30 kept) |
| `chats` | Conversations | `user_id`, `title`, `pinned`, `folder_id`→`chat_folders`, `last_read_at`, `share_token` (32 hex, unique, null = private), `shared_at`, `updated_at` | Owner only; `folder_id` must be the user's. Public sharing is served by the server (service role) looking up the exact token — never by an anon policy |
| `chat_folders` | Chat folders | `user_id`, `name` | Owner only |
| `chat_messages` | Messages | `chat_id`→`chats` cascade, `user_id`, `role` (user/assistant), `body`, `attachments` jsonb | Owner only; chat must be the user's |
| `admin_audit` | Admin action log | `admin_id`, `admin_email`, `action`, `target`, `meta` jsonb | RLS on with **no policies** → service role only |
| `announcements` | Banners from admins | `message`, `tone`, `active` | Authenticated can **select where active**; writes service-role only |

`attachments` is `[{ path, name, type, size }]` where `path` is a key in a Storage bucket.

## Storage

| Bucket | Public | Limit | Path convention | Policy |
| --- | --- | --- | --- | --- |
| `note-files` | no | 10 MB | `<user_id>/<area>/<id>/<uuid>-<filename>` (areas: note id, `journal`, `chat`) | Owner folder only (`storage.foldername(name)[1] = auth.uid()`); read through signed URLs |
| `avatars` | yes (images only) | 2 MB | `<user_id>/avatar-<timestamp>.<ext>` | Owner folder only for writes |

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

## Planned (by phase)

| Phase | Tables / changes |
| --- | --- |
| 1 | `workspaces`, `workspace_members(role)`, `workspace_invites`; `workspace_id` on notes/tasks/task_lists/chats/folders (journal stays author-private); SQL helpers `is_workspace_member()`, `workspace_role()`; `jobs` |
| 2 | `tags` + join tables, note backlinks, soft-delete columns, `subtasks` (parent_id), labels, reminders, mood on journal entries, tsvector + GIN indexes |
| 3 | `integration_connections`, `calendar_events` (cache), email thread metadata cache |
| 4 | `user_ai_settings`, `ai_usage`, embeddings (pgvector) |
| 5 | `meetings`, `meeting_transcripts`, `automations`, `automation_runs`, `notifications`, `notification_preferences` |
| 6 | Billing columns/tables (Stripe ids), aggregated usage views |

## Rules of thumb

- `timestamptz` for moments, `date` for calendar days; store UTC.
- UUID primary keys (`gen_random_uuid()`), `user_id uuid default auth.uid()` on user-owned rows so clients can't spoof ownership.
- Index every column you filter or sort by in lists (e.g. `(user_id, due_date)`).
- A policy of `auth.uid() is not null` is **not** access control.
- Tokens/OAuth credentials are never stored — Composio holds them; we keep connection ids.
