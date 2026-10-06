-- Workspace tables for the user dashboard. Every row belongs to one user and
-- row-level security makes sure users can only ever see and change their own.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free',
  personality jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  due_date date,
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists tasks_user_due on public.tasks (user_id, due_date);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_date date not null,
  body text not null default '' check (char_length(body) <= 50000),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default '' check (char_length(title) <= 200),
  body text not null default '' check (char_length(body) <= 100000),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists notes_user_updated on public.notes (user_id, updated_at desc);

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default 'New chat' check (char_length(title) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists chats_user_updated on public.chats (user_id, updated_at desc);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'assistant')),
  body text not null check (char_length(body) between 1 and 20000),
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_chat on public.chat_messages (chat_id, created_at);

-- Row-level security: owner only.
do $$
declare t text;
begin
  foreach t in array array['tasks', 'journal_entries', 'notes', 'chats', 'chat_messages'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "owner all" on public.%I', t);
    execute format(
      'create policy "owner all" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

alter table public.profiles enable row level security;
drop policy if exists "owner read" on public.profiles;
drop policy if exists "owner insert" on public.profiles;
drop policy if exists "owner update" on public.profiles;
create policy "owner read" on public.profiles for select to authenticated using (user_id = auth.uid());
create policy "owner insert" on public.profiles for insert to authenticated with check (user_id = auth.uid() and plan = 'free');
-- Users may change their personality result, but never their own plan.
create policy "owner update" on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update (plan) on public.profiles from authenticated;

-- A chat message may only be added to a chat the user owns.
drop policy if exists "owner all" on public.chat_messages;
create policy "owner all" on public.chat_messages for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.chats c where c.id = chat_id and c.user_id = auth.uid()));
