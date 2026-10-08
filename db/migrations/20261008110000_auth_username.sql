-- Existing users can choose a username in Profile settings; new accounts set one during signup.
alter table auth.users add column if not exists username text;
alter table auth.users add column if not exists display_username text;

create unique index if not exists users_username_unique
  on auth.users (username)
  where username is not null;
