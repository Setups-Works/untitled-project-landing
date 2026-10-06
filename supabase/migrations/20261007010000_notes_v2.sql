-- Notes v2: categories, pinning, voice notes, ordering, attachments and version history.

alter table public.notes
  add column if not exists category text not null default 'Others' check (char_length(category) <= 60),
  add column if not exists pinned boolean not null default false,
  add column if not exists kind text not null default 'text' check (kind in ('text', 'voice')),
  add column if not exists sort_order double precision not null default (extract(epoch from now()) * 1000),
  add column if not exists attachments jsonb not null default '[]'::jsonb;

create table if not exists public.note_versions (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default '',
  body text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists note_versions_note on public.note_versions (note_id, created_at desc);

alter table public.note_versions enable row level security;
drop policy if exists "owner all" on public.note_versions;
create policy "owner all" on public.note_versions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Keep a snapshot of the previous text when a note changes, at most one every 2 minutes, newest 30 kept.
create or replace function public.snapshot_note() returns trigger language plpgsql as $$
begin
  if (old.title is distinct from new.title or old.body is distinct from new.body)
     and (old.title <> '' or old.body <> '')
     and not exists (select 1 from public.note_versions v where v.note_id = old.id and v.created_at > now() - interval '2 minutes') then
    insert into public.note_versions (note_id, user_id, title, body) values (old.id, old.user_id, old.title, old.body);
    delete from public.note_versions where note_id = old.id and id not in (
      select id from public.note_versions where note_id = old.id order by created_at desc limit 30);
  end if;
  return new;
end $$;

drop trigger if exists notes_snapshot on public.notes;
create trigger notes_snapshot before update on public.notes for each row execute function public.snapshot_note();

-- Private bucket for note images, files and voice recordings. Each user can only touch their own folder.
insert into storage.buckets (id, name, public, file_size_limit)
values ('note-files', 'note-files', false, 10485760)
on conflict (id) do update set public = false, file_size_limit = 10485760;

drop policy if exists "note files owner" on storage.objects;
create policy "note files owner" on storage.objects for all to authenticated
  using (bucket_id = 'note-files' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'note-files' and (storage.foldername(name))[1] = auth.uid()::text);
