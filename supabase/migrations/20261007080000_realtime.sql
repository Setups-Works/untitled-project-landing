-- Realtime: let the app hear about row changes (used by useRealtimeInvalidate to keep TanStack Query caches fresh).
-- Row-Level Security still applies — a client only receives changes for rows it is allowed to read.
do $$
declare t text;
begin
  foreach t in array array['tasks', 'task_lists', 'notes', 'chats', 'chat_folders', 'chat_messages', 'journal_entries'] loop
    if not exists (
      select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
