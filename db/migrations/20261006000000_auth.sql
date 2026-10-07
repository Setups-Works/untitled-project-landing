-- Authentication tables used by Better Auth (see src/server/auth.ts, which maps its model/field names onto these snake_case columns).
-- They live in the `auth` schema; every workspace table references auth.users(id), and the `authenticated` role has no access
-- to these tables, so nothing a signed-in user runs can read password hashes, tokens or other people's accounts.

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  email text not null unique,
  email_verified boolean not null default false,
  image text,
  role text check (role is null or role in ('admin')),
  banned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists auth.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sessions_user on auth.sessions (user_id);

create table if not exists auth.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id text not null,
  provider_id text not null,
  access_token text,
  refresh_token text,
  id_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scope text,
  password text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id, account_id)
);
create index if not exists accounts_user on auth.accounts (user_id);

create table if not exists auth.verifications (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  value text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists verifications_identifier on auth.verifications (identifier);
