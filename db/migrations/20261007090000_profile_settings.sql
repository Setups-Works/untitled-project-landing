-- Preferences and onboarding progress used to live in the auth provider's user metadata; they now belong to the profile.
alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb,
  add column if not exists onboarding jsonb not null default '{}'::jsonb;
alter table public.profiles alter column user_id set default auth.uid();

-- Users may edit their own settings, but never their plan. (A column-level REVOKE does not undo a table-level grant,
-- so take the table-level UPDATE away and grant only the columns users may change.)
revoke update on public.profiles from authenticated;
grant update (personality, preferences, onboarding) on public.profiles to authenticated;
