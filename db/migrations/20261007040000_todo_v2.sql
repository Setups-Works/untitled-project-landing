-- To-do v2: lists, descriptions, priorities, cancelled/archived states and recurring tasks.

create table if not exists public.task_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  color text not null default 'violet' check (color in ('violet', 'blue', 'green', 'amber', 'clay', 'mint', 'gold', 'sand')),
  created_at timestamptz not null default now()
);
create index if not exists task_lists_user on public.task_lists (user_id, created_at);

alter table public.task_lists enable row level security;
drop policy if exists "owner all" on public.task_lists;
create policy "owner all" on public.task_lists for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.tasks
  add column if not exists description text not null default '' check (char_length(description) <= 5000),
  add column if not exists priority smallint not null default 4 check (priority between 1 and 4),
  add column if not exists list_id uuid references public.task_lists(id) on delete set null,
  add column if not exists cancelled boolean not null default false,
  add column if not exists archived boolean not null default false,
  add column if not exists recurrence text check (recurrence in ('daily', 'weekdays', 'weekly', 'monthly', 'yearly'));

create index if not exists tasks_user_list on public.tasks (user_id, list_id);

-- A task may only point at a list the user owns.
drop policy if exists "owner all" on public.tasks;
create policy "owner all" on public.tasks for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (list_id is null or exists (select 1 from public.task_lists l where l.id = list_id and l.user_id = auth.uid()))
  );
