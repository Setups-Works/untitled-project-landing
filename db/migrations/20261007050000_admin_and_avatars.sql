-- Admin audit log, announcements and avatar storage.

-- Audit log: written only by the server with the service role. RLS is on with no policies, so nobody else can read or write it.
create table if not exists public.admin_audit (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid,
  admin_email text not null,
  action text not null,
  target text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_created on public.admin_audit (created_at desc);
alter table public.admin_audit enable row level security;

-- Announcements: every signed-in user can read active ones; only the server (service role) can change them.
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(message) between 1 and 500),
  tone text not null default 'info' check (tone in ('info', 'success', 'warning')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
drop policy if exists "read active" on public.announcements;
create policy "read active" on public.announcements for select to authenticated using (active);

-- Profile pictures live in the public-read `avatars` bucket; each user can only write under their own id (see src/server/storage).
