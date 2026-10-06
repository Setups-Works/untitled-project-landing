-- Chat v2: folders, pinned chats, unread tracking and message attachments.

create table if not exists public.chat_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now()
);
alter table public.chat_folders enable row level security;
drop policy if exists "owner all" on public.chat_folders;
create policy "owner all" on public.chat_folders for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.chats
  add column if not exists pinned boolean not null default false,
  add column if not exists folder_id uuid references public.chat_folders(id) on delete set null,
  add column if not exists last_read_at timestamptz not null default now();

alter table public.chat_messages
  add column if not exists attachments jsonb not null default '[]'::jsonb;

-- A chat may only be filed in a folder the user owns.
drop policy if exists "owner all" on public.chats;
create policy "owner all" on public.chats for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (folder_id is null or exists (select 1 from public.chat_folders f where f.id = folder_id and f.user_id = auth.uid()))
  );
