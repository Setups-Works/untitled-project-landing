import "server-only";
import type { RssFeed, RssFilter, RssItem } from "@untitled/types";
import { withUser } from "../db/pool";
import type { ParsedItem } from "../services/rss/parse";

/** Data access for feeds and articles. Every call runs as the signed-in user, so row-level security is what scopes it. */

const FEED_SELECT = `f.id, f.url, f.site_url, f.title, f.description, f.image_url, f.last_fetched_at, f.last_error, f.created_at,
  (select count(*)::int from public.rss_items i where i.feed_id = f.id and not i.is_read) as unread`;
const ITEM_SELECT = `i.id, i.feed_id, f.title as feed_title, f.image_url as feed_image_url, i.title, i.link, i.summary, i.image_url,
  i.author, i.published_at, i.is_read, i.is_starred`;

export const listFeeds = (userId: string) =>
  withUser(userId, async (c) => (await c.query<RssFeed>(`select ${FEED_SELECT} from public.rss_feeds f order by lower(f.title), f.created_at`)).rows);

export const getFeed = (userId: string, id: string) =>
  withUser(userId, async (c) => (await c.query<RssFeed>(`select ${FEED_SELECT} from public.rss_feeds f where f.id = $1`, [id])).rows[0] ?? null);

export const countFeeds = (userId: string) =>
  withUser(userId, async (c) => (await c.query<{ n: number }>("select count(*)::int as n from public.rss_feeds")).rows[0]!.n);

export const feedUrlTaken = (userId: string, urls: string[]) =>
  withUser(userId, async (c) => (await c.query("select 1 from public.rss_feeds where url = any($1) limit 1", [urls])).rowCount! > 0);

type FeedMeta = { url: string; siteUrl: string | null; title: string; description: string; imageUrl: string | null };

export const insertFeed = (userId: string, f: FeedMeta) =>
  withUser(
    userId,
    async (c) =>
      (await c.query<{ id: string }>(
        `insert into public.rss_feeds (url, site_url, title, description, image_url, last_fetched_at)
         values ($1, $2, $3, $4, $5, now()) returning id`,
        [f.url, f.siteUrl, f.title, f.description, f.imageUrl],
      )).rows[0]!.id,
  );

export const markFeedFetched = (userId: string, id: string, meta: Omit<FeedMeta, "url"> | null, error: string | null) =>
  withUser(userId, async (c) => {
    if (meta) {
      await c.query(
        `update public.rss_feeds set site_url = $2, title = coalesce(nullif($3, ''), title), description = $4, image_url = $5,
           last_fetched_at = now(), last_error = null where id = $1`,
        [id, meta.siteUrl, meta.title, meta.description, meta.imageUrl],
      );
    } else await c.query("update public.rss_feeds set last_fetched_at = now(), last_error = $2 where id = $1", [id, error]);
  });

export const deleteFeed = (userId: string, id: string) =>
  withUser(userId, async (c) => (await c.query("delete from public.rss_feeds where id = $1", [id])).rowCount! > 0);

/** Adds new articles and refreshes the text of known ones; read and starred marks are kept. Then trims to the newest `keep`. */
export const saveItems = (userId: string, feedId: string, items: ParsedItem[], keep: number) =>
  withUser(userId, async (c) => {
    if (items.length) {
      const cols = 9;
      const params: unknown[] = [feedId];
      const rows = items.map((it, n) => {
        params.push(it.guid, it.title, it.link, it.summary, it.content, it.imageUrl, it.author, it.publishedAt);
        const at = n * 8 + 2;
        return `($1, ${Array.from({ length: cols - 1 }, (_, k) => `$${at + k}`).join(", ")})`;
      });
      await c.query(
        `insert into public.rss_items (feed_id, guid, title, link, summary, content, image_url, author, published_at)
         values ${rows.join(", ")}
         on conflict (feed_id, guid) do update set title = excluded.title, link = excluded.link, summary = excluded.summary,
           content = excluded.content, image_url = excluded.image_url, author = excluded.author`,
        params,
      );
    }
    await c.query(
      `delete from public.rss_items where feed_id = $1 and not is_starred
         and id not in (select id from public.rss_items where feed_id = $1 order by published_at desc, id desc limit $2)`,
      [feedId, keep],
    );
  });

export type ItemQuery = { feedId?: string; filter: RssFilter; search?: string; cursor?: { at: string; id: string }; limit: number };

const escapeLike = (s: string) => s.replace(/[\\%_]/g, "\\$&");

export const listItems = (userId: string, q: ItemQuery) =>
  withUser(userId, async (c) => {
    const where: string[] = [];
    const params: unknown[] = [];
    const add = (v: unknown) => `$${params.push(v)}`;
    if (q.feedId) where.push(`i.feed_id = ${add(q.feedId)}`);
    if (q.filter === "unread") where.push("not i.is_read");
    if (q.filter === "starred") where.push("i.is_starred");
    if (q.search) {
      const like = add(`%${escapeLike(q.search)}%`);
      where.push(`(i.title ilike ${like} or i.summary ilike ${like} or i.author ilike ${like} or f.title ilike ${like})`);
    }
    if (q.cursor) where.push(`(i.published_at, i.id) < (${add(q.cursor.at)}::timestamptz, ${add(q.cursor.id)}::uuid)`);
    const sql = `select ${ITEM_SELECT} from public.rss_items i join public.rss_feeds f on f.id = i.feed_id
      ${where.length ? `where ${where.join(" and ")}` : ""} order by i.published_at desc, i.id desc limit ${add(q.limit)}`;
    return (await c.query<RssItem>(sql, params)).rows;
  });

export const getItem = (userId: string, id: string) =>
  withUser(
    userId,
    async (c) =>
      (await c.query<RssItem>(
        `select ${ITEM_SELECT}, i.content from public.rss_items i join public.rss_feeds f on f.id = i.feed_id where i.id = $1`,
        [id],
      )).rows[0] ?? null,
  );

export const updateItem = (userId: string, id: string, patch: { is_read?: boolean; is_starred?: boolean }) =>
  withUser(
    userId,
    async (c) =>
      (await c.query(
        `update public.rss_items set is_read = coalesce($2, is_read), is_starred = coalesce($3, is_starred) where id = $1`,
        [id, patch.is_read ?? null, patch.is_starred ?? null],
      )).rowCount! > 0,
  );

export const markAllRead = (userId: string, feedId?: string) =>
  withUser(
    userId,
    async (c) =>
      (await c.query("update public.rss_items set is_read = true where not is_read and ($1::uuid is null or feed_id = $1)", [feedId ?? null]))
        .rowCount ?? 0,
  );
