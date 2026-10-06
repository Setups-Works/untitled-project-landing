-- Public sharing for chats. A chat is private unless share_token is set; the token is the secret in the public link.
-- The public page looks the chat up on the server (service role) by exact token, so the API never exposes shared chats to enumeration.

alter table public.chats
  add column if not exists share_token text,
  add column if not exists shared_at timestamptz;

create unique index if not exists chats_share_token on public.chats (share_token) where share_token is not null;
alter table public.chats drop constraint if exists chats_share_token_format;
alter table public.chats add constraint chats_share_token_format check (share_token is null or share_token ~ '^[a-f0-9]{32}$');
