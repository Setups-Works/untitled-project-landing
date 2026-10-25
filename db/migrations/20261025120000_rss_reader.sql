-- RSS reader (Workspace → Reader). A person's subscriptions and the articles fetched from them. Articles keep plain text only
-- (no feed HTML is ever stored or rendered), and every row belongs to one user.

create table if not exists public.rss_feeds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  url text not null check (char_length(url) <= 2048),
  site_url text check (char_length(site_url) <= 2048),
  title text not null default '' check (char_length(title) <= 300),
  description text not null default '' check (char_length(description) <= 2000),
  image_url text check (char_length(image_url) <= 2048),
  last_fetched_at timestamptz,
  last_error text check (char_length(last_error) <= 300),
  created_at timestamptz not null default now(),
  unique (user_id, url)
);
create index if not exists rss_feeds_user on public.rss_feeds (user_id, created_at);

create table if not exists public.rss_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  feed_id uuid not null references public.rss_feeds(id) on delete cascade,
  guid text not null check (char_length(guid) <= 2048),
  title text not null default '' check (char_length(title) <= 500),
  link text check (char_length(link) <= 2048),
  summary text not null default '' check (char_length(summary) <= 1000),
  content text not null default '' check (char_length(content) <= 60000),
  image_url text check (char_length(image_url) <= 2048),
  author text check (char_length(author) <= 200),
  published_at timestamptz not null default now(),
  is_read boolean not null default false,
  is_starred boolean not null default false,
  unique (feed_id, guid)
);
create index if not exists rss_items_user_published on public.rss_items (user_id, published_at desc);
create index if not exists rss_items_feed_published on public.rss_items (feed_id, published_at desc);
create index if not exists rss_items_user_unread on public.rss_items (user_id, feed_id) where not is_read;

alter table public.rss_feeds enable row level security;
alter table public.rss_items enable row level security;

drop policy if exists "owner all" on public.rss_feeds;
create policy "owner all" on public.rss_feeds
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- An article must sit under one of the caller's own feeds, so a row cannot be planted in someone else's subscription.
drop policy if exists "owner all" on public.rss_items;
create policy "owner all" on public.rss_items
  for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.rss_feeds f where f.id = feed_id and f.user_id = auth.uid())
  );

-- Open tabs refresh when a feed is added or updated (see 20261007080000_realtime.sql).
drop trigger if exists rss_feeds_notify on public.rss_feeds;
create trigger rss_feeds_notify after insert or update or delete on public.rss_feeds
  for each row execute function public.notify_row_change();
drop trigger if exists rss_items_notify on public.rss_items;
create trigger rss_items_notify after insert or update or delete on public.rss_items
  for each row execute function public.notify_row_change();
