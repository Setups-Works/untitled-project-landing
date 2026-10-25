/** Query keys in one place (the web keeps its own in apps/web/src/lib/query/keys.ts). */
export const qk = {
  tasks: ["tasks"] as const,
  notes: ["notes"] as const,
  journal: ["journal"] as const,
  sharedJournals: ["shared-journals"] as const,
  settings: ["settings"] as const,
  health: ["health"] as const,
  calendar: ["calendar"] as const,
  rss: {
    all: ["rss"] as const,
    feeds: ["rss", "feeds"] as const,
    lists: ["rss", "items"] as const,
    items: (feed: string, filter: string, q: string) => ["rss", "items", feed, filter, q] as const,
    item: (id: string) => ["rss", "item", id] as const,
    refresh: ["rss-refresh"] as const, // outside qk.rss.all on purpose: a data change must not trigger another network refresh
  },
};
