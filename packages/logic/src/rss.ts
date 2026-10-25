import type { RssFeed, RssFilter } from "@untitled/types";

/** Every RSS limit and option in one place, shared by the server, the web and the phone app. Change a number here, nowhere else. */
export const RSS = {
  maxFeeds: 100,
  /** Newest articles kept per feed; older ones are dropped on refresh. */
  itemsPerFeed: 200,
  pageSize: 30,
  maxPageSize: 100,
  maxSearchLength: 100,
  fetchTimeoutMs: 8_000,
  maxFeedBytes: 3_000_000,
  maxRedirects: 3,
  /** Pulling to refresh within this time of the last fetch of a feed does not hit the network again. */
  minRefetchMs: 60_000,
  /** How many feeds are fetched at the same time during "refresh all". */
  refreshConcurrency: 4,
  /** How often an open Reader refreshes by itself. */
  autoRefreshMs: 5 * 60_000,
  /** Per person: new feeds and refreshes allowed per hour (each one fetches from the internet). */
  addsPerHour: 30,
  refreshesPerHour: 120,
  summaryLength: 280,
  contentLength: 20_000,
} as const;

export const RSS_FILTERS: { key: RssFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "starred", label: "Starred" },
];

export const isRssFilter = (v: string | null | undefined): v is RssFilter => RSS_FILTERS.some((f) => f.key === v);

/** What to call a feed in lists: its title, else its address without the scheme. */
export const rssFeedName = (f: Pick<RssFeed, "title" | "url">) => f.title || f.url.replace(/^https?:\/\//, "");

/** "5m", "3h", "2d", or a short date for older articles. */
export function rssAge(iso: string, now = Date.now()): string {
  const diff = Math.max(now - new Date(iso).getTime(), 0);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
