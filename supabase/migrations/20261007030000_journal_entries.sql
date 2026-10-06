-- Journal v2: many timestamped entries per day, with attachments and voice entries.

alter table public.journal_entries drop constraint if exists journal_entries_user_id_entry_date_key;

alter table public.journal_entries
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists attachments jsonb not null default '[]'::jsonb,
  add column if not exists kind text not null default 'text' check (kind in ('text', 'voice'));

-- Existing rows keep the time they were last written; empty placeholder rows from the old one-per-day editor are dropped.
update public.journal_entries set created_at = updated_at;
delete from public.journal_entries where body = '';

create index if not exists journal_user_day on public.journal_entries (user_id, entry_date, created_at);
