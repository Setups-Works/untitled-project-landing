-- Plans and billing. Three ways to pay for AI: a subscription (flat fee with a monthly token allowance), pay as you go (billed for the
-- tokens you use) and bring your own API key (you pay your AI provider, we meter nothing). Admins edit the plans; people choose,
-- change and cancel their own plan through the API. No payment provider is connected yet, so a plan change is recorded and takes
-- effect at once; the tables are what a provider would later write into.

create table if not exists public.billing_plans (
  id text primary key check (id in ('subscription', 'payg', 'byo')),
  name text not null check (char_length(name) between 1 and 60),
  tagline text not null default '' check (char_length(tagline) <= 200),
  -- Smallest currency unit: paise for INR (74900 = ₹749).
  price_cents integer not null default 0 check (price_cents >= 0 and price_cents <= 10000000),
  currency text not null default 'inr' check (char_length(currency) = 3),
  interval text not null default 'month' check (interval in ('month', 'year', 'none')),
  -- Tokens included in each billing period (subscription). 0 means none included.
  included_tokens bigint not null default 0 check (included_tokens >= 0),
  -- What each million tokens cost on pay as you go, in the smallest currency unit (paise).
  token_price_cents_per_million integer not null default 0 check (token_price_cents_per_million >= 0),
  features text[] not null default '{}',
  active boolean not null default true,
  sort integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Placeholder prices in rupees (the amounts are in paise) that an admin can change at any time (Admin → Plans). They are not announced prices.
insert into public.billing_plans (id, name, tagline, price_cents, interval, included_tokens, token_price_cents_per_million, features, sort)
values
  ('subscription', 'Subscription', 'One monthly price with AI included.', 74900, 'month', 1000000, 0,
   array['AI included, up to your monthly token allowance', 'Cancel any time, it ends when the month does', 'Switch plans whenever you like'], 1),
  ('payg', 'Pay as you go', 'No monthly fee. Pay only for the AI you use.', 0, 'none', 0, 15000,
   array['No monthly fee', 'Billed for the tokens you use', 'Cancel or switch any time'], 2),
  ('byo', 'Bring your own key', 'Use your own AI provider and pay them directly.', 0, 'none', 0, 0,
   array['Connect OpenAI, Groq, OpenRouter and more', 'We don’t charge or meter your AI use', 'Your key is stored encrypted'], 3)
on conflict (id) do nothing;

-- One row per person who has chosen a plan. No row means they have not chosen one yet.
create table if not exists public.user_billing (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_id text not null references public.billing_plans(id),
  status text not null default 'active' check (status in ('active', 'canceled')),
  period_start timestamptz not null default now(),
  -- When the current period ends (subscription only); the plan renews then unless cancel_at_period_end is set.
  period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  started_at timestamptz not null default now(),
  canceled_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Metered AI use: one row per answer. Tokens only, never any text.
create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text references public.billing_plans(id),
  provider text not null default '' check (char_length(provider) <= 40),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_user_created on public.ai_usage (user_id, created_at desc);

-- The API key someone brings for the "bring your own key" plan. Only the server reads this table: the key is stored encrypted
-- (AES-256-GCM) and the browser never receives it back, only the last four characters as a hint.
create table if not exists public.user_ai_keys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null check (char_length(provider) between 1 and 40),
  model text not null check (char_length(model) between 1 and 100),
  key_cipher text not null,
  key_hint text not null default '' check (char_length(key_hint) <= 8),
  updated_at timestamptz not null default now()
);

alter table public.billing_plans enable row level security;
alter table public.user_billing enable row level security;
alter table public.ai_usage enable row level security;
alter table public.user_ai_keys enable row level security;

-- Anyone signed in can read the plans that are on offer; only the server writes them.
drop policy if exists "read active plans" on public.billing_plans;
create policy "read active plans" on public.billing_plans for select to authenticated using (active);

-- People can read their own plan and usage. Every change goes through the billing service, which checks it first.
drop policy if exists "owner read" on public.user_billing;
create policy "owner read" on public.user_billing for select to authenticated using (user_id = auth.uid());
drop policy if exists "owner read" on public.ai_usage;
create policy "owner read" on public.ai_usage for select to authenticated using (user_id = auth.uid());

-- New tables get full privileges for `authenticated` by default; take the writes back, and everything on the keys.
revoke insert, update, delete on public.billing_plans from authenticated;
revoke insert, update, delete on public.user_billing from authenticated;
revoke insert, update, delete on public.ai_usage from authenticated;
revoke all on public.user_ai_keys from authenticated;
