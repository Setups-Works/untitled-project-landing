-- Public sharing for a single journal entry. An entry is private unless share_token is set; the token is the secret in the public link.
-- The public page looks the entry up on the server (owner connection) by exact token, so no policy ever exposes shared entries to
-- enumeration. Same model as shared chats (20261007070000_chat_share.sql). The existing owner-only policies are unchanged.

alter table public.journal_entries
  add column if not exists share_token text,
  add column if not exists shared_at timestamptz;

create unique index if not exists journal_entries_share_token on public.journal_entries (share_token) where share_token is not null;
alter table public.journal_entries drop constraint if exists journal_entries_share_token_format;
alter table public.journal_entries add constraint journal_entries_share_token_format check (share_token is null or share_token ~ '^[a-f0-9]{32}$');
