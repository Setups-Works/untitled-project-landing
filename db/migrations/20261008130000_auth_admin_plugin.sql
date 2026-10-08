-- Better Auth's admin plugin stores ban metadata and impersonation session metadata.
alter table auth.users add column if not exists ban_reason text;
alter table auth.users add column if not exists ban_expires timestamptz;
alter table auth.sessions add column if not exists impersonated_by text;

-- The plugin assigns its configured default role to new users.
alter table auth.users drop constraint if exists users_role_check;
alter table auth.users add constraint users_role_check check (role is null or role in ('user', 'admin'));
