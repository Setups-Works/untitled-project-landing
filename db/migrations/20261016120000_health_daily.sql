-- Health: one row per user per day, written by the mobile app from Apple Health (HealthKit) or Android Health Connect and read by
-- the web Health page. Only daily aggregates are stored, never raw samples. No rows yet means "not set up" in the UI.

create table if not exists public.health_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null,
  steps integer check (steps between 0 and 200000),
  distance_m integer check (distance_m between 0 and 500000),
  active_kcal integer check (active_kcal between 0 and 20000),
  resting_hr integer check (resting_hr between 20 and 250),
  hr_min integer check (hr_min between 20 and 250),
  hr_max integer check (hr_max between 20 and 250),
  sleep_minutes integer check (sleep_minutes between 0 and 1440),
  source text not null default 'unknown' check (source in ('healthkit', 'health_connect', 'unknown')),
  synced_at timestamptz not null default now(),
  unique (user_id, day)
);

create index if not exists health_daily_user_day on public.health_daily (user_id, day desc);

alter table public.health_daily enable row level security;
drop policy if exists "owner all" on public.health_daily;
create policy "owner all" on public.health_daily
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Open web tabs refresh when the phone syncs (same trigger the other tables use; see 20261007080000_realtime.sql).
drop trigger if exists health_daily_notify on public.health_daily;
create trigger health_daily_notify
  after insert or update or delete on public.health_daily
  for each row execute function public.notify_row_change();
