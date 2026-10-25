import "server-only";
import type { RssFeed, RssItem } from "@untitled/types";
import { RSS } from "@untitled/logic/rss";
import { ConflictError, NotFoundError, RateLimitError, ValidationError } from "../../errors";
import { underLimit } from "../../rateLimit";
import * as repo from "../../repositories/rss.repository";
import { findFeedLink, parseFeed, type ParsedFeed } from "./parse";
import { itemsQuery } from "./rss.schema";
import { safeGet } from "./safeFetch";
import type { z } from "zod";

/** Typing "example.com" is fine: a missing scheme becomes https. */
const withScheme = (raw: string) => (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);

async function fetchFeed(address: string): Promise<{ url: string; feed: ParsedFeed }> {
  const first = await safeGet(address);
  try {
    return { url: first.url, feed: parseFeed(first.body, first.url) };
  } catch {
    // A web page rather than a feed: follow the feed it advertises, once.
    const advertised = findFeedLink(first.body, first.url);
    if (!advertised) throw new ValidationError("We couldn’t find a feed at that address.");
    const second = await safeGet(advertised);
    try {
      return { url: second.url, feed: parseFeed(second.body, second.url) };
    } catch {
      throw new ValidationError("We couldn’t read the feed at that address.");
    }
  }
}

export const listFeeds = (userId: string) => repo.listFeeds(userId);

export async function addFeed(userId: string, rawUrl: string): Promise<RssFeed> {
  if (!(await underLimit(`rss-add:${userId}`, RSS.addsPerHour, 3600))) throw new RateLimitError("You’ve added a lot of feeds. Try again in a bit.");
  if ((await repo.countFeeds(userId)) >= RSS.maxFeeds) throw new ValidationError(`You can follow up to ${RSS.maxFeeds} feeds.`);
  const address = withScheme(rawUrl);
  if (await repo.feedUrlTaken(userId, [address])) throw new ConflictError("You already follow this feed.");
  const { url, feed } = await fetchFeed(address);
  if (await repo.feedUrlTaken(userId, [url])) throw new ConflictError("You already follow this feed.");
  const id = await repo.insertFeed(userId, { url, siteUrl: feed.siteUrl, title: feed.title, description: feed.description, imageUrl: feed.imageUrl });
  await repo.saveItems(userId, id, feed.items, RSS.itemsPerFeed);
  return (await repo.getFeed(userId, id))!;
}

export async function removeFeed(userId: string, id: string) {
  if (!(await repo.deleteFeed(userId, id))) throw new NotFoundError("That feed isn’t in your list.");
}

/** Fetches one feed again. A failure is remembered on the feed (shown in the list) instead of failing the whole refresh. */
async function refreshOne(userId: string, feed: RssFeed): Promise<boolean> {
  try {
    const { feed: parsed } = await fetchFeed(feed.url);
    await repo.markFeedFetched(userId, feed.id, { siteUrl: parsed.siteUrl, title: parsed.title, description: parsed.description, imageUrl: parsed.imageUrl }, null);
    await repo.saveItems(userId, feed.id, parsed.items, RSS.itemsPerFeed);
    return true;
  } catch (e) {
    await repo.markFeedFetched(userId, feed.id, null, e instanceof ValidationError ? e.message : "Couldn’t load this feed.");
    return false;
  }
}

/** Refreshes one feed, or all of them a few at a time. Feeds fetched very recently are skipped. */
export async function refreshFeeds(userId: string, feedId?: string) {
  if (!(await underLimit(`rss-refresh:${userId}`, RSS.refreshesPerHour, 3600))) throw new RateLimitError();
  const all = await repo.listFeeds(userId);
  const due = all.filter((f) => (feedId ? f.id === feedId : true)).filter((f) => !f.last_fetched_at || Date.now() - new Date(f.last_fetched_at).getTime() >= RSS.minRefetchMs);
  if (feedId && !all.some((f) => f.id === feedId)) throw new NotFoundError("That feed isn’t in your list.");
  let failed = 0;
  for (let i = 0; i < due.length; i += RSS.refreshConcurrency) {
    const results = await Promise.all(due.slice(i, i + RSS.refreshConcurrency).map((f) => refreshOne(userId, f)));
    failed += results.filter((ok) => !ok).length;
  }
  return { refreshed: due.length - failed, failed };
}

export async function listItems(userId: string, query: z.infer<typeof itemsQuery>) {
  const [at, id] = query.cursor?.split("|") ?? [];
  const cursor = at && id ? { at, id } : undefined;
  if (query.cursor && (!cursor || Number.isNaN(Date.parse(at!)) || !/^[0-9a-f-]{36}$/i.test(id!))) throw new ValidationError("Invalid page.");
  const rows = await repo.listItems(userId, { feedId: query.feed, filter: query.filter, search: query.q || undefined, cursor, limit: query.limit + 1 });
  const items = rows.slice(0, query.limit);
  const last = items.at(-1);
  return { items, next: rows.length > query.limit && last ? `${new Date(last.published_at).toISOString()}|${last.id}` : null };
}

export async function getItem(userId: string, id: string): Promise<RssItem> {
  const item = await repo.getItem(userId, id);
  if (!item) throw new NotFoundError("That article isn’t available.");
  return item;
}

export async function updateItem(userId: string, id: string, patch: { is_read?: boolean; is_starred?: boolean }) {
  if (!(await repo.updateItem(userId, id, patch))) throw new NotFoundError("That article isn’t available.");
}

export const markAllRead = async (userId: string, feedId?: string) => ({ updated: await repo.markAllRead(userId, feedId) });
