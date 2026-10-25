import type { RssFeed, RssFilter, RssItem } from "@untitled/types";
import type { Http } from "./sharedJournals";

/** The RSS reader API, written once for the web and the Expo app (same adapter pattern as shared journals). Routes: app/api/v1/rss. */
type Data<T> = { data: T };
export type RssItemsPage = { items: RssItem[]; next: string | null };
export type RssItemsQuery = { feed?: string; filter?: RssFilter; q?: string; cursor?: string; limit?: number };

const base = "/api/v1/rss";

export function createRssApi(http: Http) {
  const unwrap = async <T>(p: Promise<Data<T>>) => (await p).data;
  return {
    feeds: () => unwrap(http.get<Data<RssFeed[]>>(`${base}/feeds`)),
    addFeed: (url: string) => unwrap(http.post<Data<RssFeed>>(`${base}/feeds`, { url })),
    removeFeed: (id: string) => unwrap(http.delete<Data<null>>(`${base}/feeds/${id}`)),
    items: (q: RssItemsQuery) => {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== "" && !(k === "filter" && v === "all")) params.set(k, String(v));
      const qs = params.toString();
      return unwrap(http.get<Data<RssItemsPage>>(`${base}/items${qs ? `?${qs}` : ""}`));
    },
    item: (id: string) => unwrap(http.get<Data<RssItem>>(`${base}/items/${id}`)),
    setRead: (id: string, is_read: boolean) => unwrap(http.patch<Data<null>>(`${base}/items/${id}`, { is_read })),
    setStarred: (id: string, is_starred: boolean) => unwrap(http.patch<Data<null>>(`${base}/items/${id}`, { is_starred })),
    readAll: (feedId?: string) => unwrap(http.post<Data<{ updated: number }>>(`${base}/read-all`, feedId ? { feed_id: feedId } : {})),
    refresh: (feedId?: string) => unwrap(http.post<Data<{ refreshed: number; failed: number }>>(`${base}/refresh`, feedId ? { feed_id: feedId } : {})),
  };
}
export type RssApi = ReturnType<typeof createRssApi>;
