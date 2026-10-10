-- Phase 3: Calendar events table for the Calendar feature (UNT-73) and sync cache (UNT-72).
-- Backed by Row-Level Security: each user can only read, insert, update and delete their own events.

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  external_id text,
  calendar_id text not null default 'primary',
  title text not null check (char_length(title) between 1 and 300),
  description text not null default '',
  location text not null default '',
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean not null default false,
  color text not null default 'blue' check (color in ('violet', 'blue', 'green', 'amber', 'clay', 'mint', 'gold', 'sand')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calendar_events_user_time on public.calendar_events (user_id, start_at, end_at);
create index if not exists calendar_events_user_ext on public.calendar_events (user_id, external_id) where external_id is not null;

alter table public.calendar_events enable row level security;
drop policy if exists "owner all" on public.calendar_events;
create policy "owner all" on public.calendar_events
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
