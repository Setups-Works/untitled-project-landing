-- Runs once, when the Postgres data volume is first created.
--
-- Security model: the app connects as the database owner and, for every request made on behalf of a signed-in user, runs
--   begin; set local role authenticated; select set_config('app.user_id', '<uuid>', true); ...queries...; commit;
-- so Row-Level Security policies (`user_id = auth.uid()`) are enforced by Postgres itself, as a second line of defence behind the
-- API's own checks. Only server code that has verified an admin runs queries as the owner (which bypasses RLS).

create schema if not exists auth;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;

-- auth.uid(): the signed-in user for this transaction (null when unset, so policies deny by default).
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('app.user_id', true), '')::uuid
$$;

-- The owner must be able to `set local role authenticated` (a superuser always can; a plain owner role needs this).
grant authenticated to current_user;

grant usage on schema public, auth to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;
alter default privileges in schema public grant execute on functions to authenticated;
