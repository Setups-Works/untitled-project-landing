-- Shared journals: named journals several people write in together. Separate from the private `journal_entries` on purpose, so personal
-- views, AI context, insights and exports never see anyone else's words.
--   owner  — created it; manages members and can delete any entry or the whole journal
--   editor — can add entries and edit/delete their own
--   viewer — read only
-- People are added by invitation (by username): the server creates the invite, the invitee accepts or declines, and only then does a
-- membership row exist. Writes to members/invites that need to look at other people's accounts go through server code, not the browser.

create table if not exists public.shared_journals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shared_journals_owner on public.shared_journals (owner_id);

create table if not exists public.shared_journal_members (
  journal_id uuid not null references public.shared_journals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('editor', 'viewer')),
  joined_at timestamptz not null default now(),
  primary key (journal_id, user_id)
);
create index if not exists shared_journal_members_user on public.shared_journal_members (user_id);

create table if not exists public.shared_journal_invites (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.shared_journals(id) on delete cascade,
  inviter_id uuid not null references auth.users(id) on delete cascade,
  invitee_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('editor', 'viewer')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);
-- One open invitation per person per journal.
create unique index if not exists shared_journal_invites_one_pending
  on public.shared_journal_invites (journal_id, invitee_id) where status = 'pending';
create index if not exists shared_journal_invites_invitee on public.shared_journal_invites (invitee_id, status);

create table if not exists public.shared_journal_entries (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.shared_journals(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_date date not null,
  body text not null default '' check (char_length(body) <= 50000),
  kind text not null default 'text' check (kind in ('text', 'voice')),
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shared_journal_entries_day on public.shared_journal_entries (journal_id, entry_date, created_at);

-- The caller's role in a journal: 'owner', 'editor', 'viewer' or null. SECURITY DEFINER so policies can ask it without recursing
-- through the policies of the tables it reads.
create or replace function public.shared_journal_role(j uuid) returns text
language sql stable security definer set search_path = public as $$
  select case
    when exists (select 1 from public.shared_journals where id = j and owner_id = auth.uid()) then 'owner'
    else (select role from public.shared_journal_members where journal_id = j and user_id = auth.uid())
  end
$$;

alter table public.shared_journals enable row level security;
alter table public.shared_journal_members enable row level security;
alter table public.shared_journal_invites enable row level security;
alter table public.shared_journal_entries enable row level security;

-- Journals: members see them; only the owner changes or deletes them. (The owner check is on the row itself because the role function,
-- being STABLE, cannot see a row created by the very statement that is reading it back with RETURNING.)
drop policy if exists "members read" on public.shared_journals;
drop policy if exists "owner insert" on public.shared_journals;
drop policy if exists "owner update" on public.shared_journals;
drop policy if exists "owner delete" on public.shared_journals;
create policy "members read" on public.shared_journals for select to authenticated using (owner_id = auth.uid() or public.shared_journal_role(id) is not null);
create policy "owner insert" on public.shared_journals for insert to authenticated with check (owner_id = auth.uid());
create policy "owner update" on public.shared_journals for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner delete" on public.shared_journals for delete to authenticated using (owner_id = auth.uid());

-- Members: everyone in a journal sees who is in it; the owner changes roles and removes people; anyone may leave.
-- There is no insert policy: a membership only appears when an invitation is accepted (server code).
drop policy if exists "members read" on public.shared_journal_members;
drop policy if exists "owner update" on public.shared_journal_members;
drop policy if exists "owner remove or leave" on public.shared_journal_members;
create policy "members read" on public.shared_journal_members for select to authenticated using (public.shared_journal_role(journal_id) is not null);
create policy "owner update" on public.shared_journal_members for update to authenticated
  using (public.shared_journal_role(journal_id) = 'owner') with check (public.shared_journal_role(journal_id) = 'owner');
create policy "owner remove or leave" on public.shared_journal_members for delete to authenticated
  using (public.shared_journal_role(journal_id) = 'owner' or user_id = auth.uid());
-- Roles are the only thing that may change on a membership.
revoke update on public.shared_journal_members from authenticated;
grant update (role) on public.shared_journal_members to authenticated;

-- Invitations: the inviter's journal owner and the invitee can see them; the owner can withdraw one. Creating and answering an
-- invitation is server code (it has to look people up by username and add the membership).
drop policy if exists "owner or invitee read" on public.shared_journal_invites;
drop policy if exists "owner withdraw" on public.shared_journal_invites;
create policy "owner or invitee read" on public.shared_journal_invites for select to authenticated
  using (invitee_id = auth.uid() or public.shared_journal_role(journal_id) = 'owner');
create policy "owner withdraw" on public.shared_journal_invites for delete to authenticated
  using (public.shared_journal_role(journal_id) = 'owner');
revoke insert, update on public.shared_journal_invites from authenticated;

-- Entries: members read; owners and editors write as themselves; an editor edits only their own words, the owner may also delete any.
drop policy if exists "members read" on public.shared_journal_entries;
drop policy if exists "writers insert" on public.shared_journal_entries;
drop policy if exists "authors update" on public.shared_journal_entries;
drop policy if exists "authors or owner delete" on public.shared_journal_entries;
create policy "members read" on public.shared_journal_entries for select to authenticated using (public.shared_journal_role(journal_id) is not null);
create policy "writers insert" on public.shared_journal_entries for insert to authenticated
  with check (user_id = auth.uid() and public.shared_journal_role(journal_id) in ('owner', 'editor'));
create policy "authors update" on public.shared_journal_entries for update to authenticated
  using (user_id = auth.uid() and public.shared_journal_role(journal_id) in ('owner', 'editor'))
  with check (user_id = auth.uid() and public.shared_journal_role(journal_id) in ('owner', 'editor'));
create policy "authors or owner delete" on public.shared_journal_entries for delete to authenticated
  using ((user_id = auth.uid() and public.shared_journal_role(journal_id) in ('owner', 'editor')) or public.shared_journal_role(journal_id) = 'owner');

-- Realtime: tell everyone who can see a journal (owner, members, and an invitee for their invitation) that it changed. Same idea as
-- notify_row_change (table name + recipient, never content), but fanned out to several people.
create or replace function public.notify_shared_journal_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v jsonb := to_jsonb(case when tg_op = 'DELETE' then old else new end);
  jid uuid := coalesce((v ->> 'journal_id')::uuid, case when tg_table_name = 'shared_journals' then (v ->> 'id')::uuid end);
  r uuid;
begin
  for r in
    select owner_id from public.shared_journals where id = jid
    union select user_id from public.shared_journal_members where journal_id = jid
    union select (v ->> 'invitee_id')::uuid where v ? 'invitee_id'
    union select (v ->> 'user_id')::uuid where tg_table_name = 'shared_journal_members'
    union select (v ->> 'owner_id')::uuid where tg_table_name = 'shared_journals'
  loop
    if r is not null then
      perform pg_notify('row_changes', json_build_object('t', tg_table_name, 'u', r)::text);
    end if;
  end loop;
  return null;
end $$;

do $$
declare t text;
begin
  foreach t in array array['shared_journals', 'shared_journal_members', 'shared_journal_invites', 'shared_journal_entries'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_notify', t);
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function public.notify_shared_journal_change()',
      t || '_notify', t);
  end loop;
end $$;
