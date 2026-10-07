-- Realtime: tell the app when rows change. A trigger emits a tiny notification (table + owner, never row content);
-- the server listens, fans it out through Redis and pushes it to the owner's open tabs (src/server/realtime).
-- Clients only learn that "something changed in <table>"; they refetch through the normal API, so RLS still applies.
create or replace function public.notify_row_change() returns trigger language plpgsql as $$
declare uid uuid;
begin
  uid := case when tg_op = 'DELETE' then old.user_id else new.user_id end;
  perform pg_notify('row_changes', json_build_object('t', tg_table_name, 'u', uid)::text);
  return null;
end $$;

do $$
declare t text;
begin
  foreach t in array array['tasks', 'task_lists', 'notes', 'chats', 'chat_folders', 'chat_messages', 'journal_entries'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_notify', t);
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function public.notify_row_change()',
      t || '_notify', t);
  end loop;
end $$;
