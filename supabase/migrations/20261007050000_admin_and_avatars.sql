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

-- Profile pictures: public bucket (so <img> works), but each user can only write inside their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars owner" on storage.objects;
create policy "avatars owner" on storage.objects for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
