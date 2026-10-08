-- Better Auth's username plugin uses the camelCase field name as its physical column.
-- Keep the earlier snake_case column intact and copy existing values forward.
alter table auth.users add column if not exists "displayUsername" text;

update auth.users
set "displayUsername" = display_username
where "displayUsername" is null and display_username is not null;
