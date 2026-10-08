-- Passkey credentials are private authentication material managed by Better Auth.
create table if not exists auth.passkeys (
  id uuid primary key default gen_random_uuid(),
  name text,
  public_key text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  credential_id text not null unique,
  counter integer not null default 0,
  device_type text not null,
  backed_up boolean not null default false,
  transports text,
  created_at timestamptz not null default now(),
  aaguid text
);

create index if not exists passkeys_user on auth.passkeys (user_id);
alter table auth.passkeys enable row level security;
