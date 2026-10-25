"use client";
import { createRssApi } from "@untitled/api-client";
import { RSS } from "@untitled/logic/rss";
import type { RssFeed, RssFilter, RssItem } from "@untitled/types";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useRealtimeInvalidate } from "../../hooks/useRealtimeInvalidate";
import { http, restMessage } from "../../lib/api/rest";
import { qk } from "../../lib/query/keys";

/** Data layer for the Reader. The calls are shared with the phone app (packages/api-client); components use these hooks only. */
const rssApi = createRssApi(http);

type Page = Awaited<ReturnType<typeof rssApi.items>>;
export type ArticleQuery = { feed?: string; filter: RssFilter; q: string };

/** Open tabs refresh when a feed or article changes (a refresh on another device, a new feed). */
export function useRssRealtime() {
  useRealtimeInvalidate("rss_feeds", [qk.rss.all]);
  useRealtimeInvalidate("rss_items", [qk.rss.all]);
}

export const useFeeds = () => useQuery({ queryKey: qk.rss.feeds, queryFn: rssApi.feeds });

export const useArticles = ({ feed, filter, q }: ArticleQuery) =>
  useInfiniteQuery({
    queryKey: qk.rss.items(feed ?? "all", filter, q),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => rssApi.items({ feed, filter, q, cursor: pageParam }),
    getNextPageParam: (last) => last.next ?? undefined,
  });

/** The full text of one article (the list only carries summaries). */
export const useArticle = (id: string | null) =>
  useQuery({ queryKey: qk.rss.item(id ?? ""), queryFn: () => rssApi.item(id!), enabled: !!id });

/** Fetches new articles on a timer while the Reader is open; the server skips feeds fetched a moment ago. */
export function useAutoRefresh() {
  const qc = useQueryClient();
  return useQuery({
    queryKey: qk.rss.refresh,
    queryFn: async () => {
      const result = await rssApi.refresh();
      await qc.invalidateQueries({ queryKey: qk.rss.all });
      return result;
    },
    refetchInterval: RSS.autoRefreshMs,
    refetchOnWindowFocus: false,
    staleTime: RSS.minRefetchMs,
    retry: false,
  });
}

/** Applies a change to an article everywhere it is cached, so a tap shows at once; the refetch after it corrects any drift. */
function patchCached(qc: ReturnType<typeof useQueryClient>, id: string, patch: Partial<RssItem>) {
  qc.setQueriesData<InfiniteData<Page>>({ queryKey: qk.rss.lists }, (data) =>
    data && { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })) },
  );
  qc.setQueryData<RssItem>(qk.rss.item(id), (item) => item && { ...item, ...patch });
}

/** Every write. Each resolves to its result, or to `undefined` after telling `onError` why. */
export function useRssActions(onError: (message: string) => void) {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: qk.rss.all });
  const wrap =
    <A extends unknown[], R>(fn: (...args: A) => Promise<R>) =>
    async (...args: A): Promise<R | undefined> => {
      try {
        return await fn(...args);
      } catch (e) {
        onError(restMessage(e));
        await done();
        return undefined;
      }
    };
  const toggle = (key: "is_read" | "is_starred", send: (id: string, v: boolean) => Promise<null>) =>
    wrap(async (id: string, value: boolean) => {
      patchCached(qc, id, { [key]: value });
      await send(id, value);
      await done();
    });
  return {
    /** Unlike the others, an add reports its reason to the caller: the dialog stays open and shows it. */
    add: async (url: string): Promise<{ feed: RssFeed } | { error: string }> => {
      try {
        const feed = await rssApi.addFeed(url);
        await done();
        return { feed };
      } catch (e) {
        return { error: restMessage(e) };
      }
    },
    remove: wrap(async (id: string) => {
      await rssApi.removeFeed(id);
      await done();
    }),
    refresh: wrap(async (feedId?: string) => {
      const result = await rssApi.refresh(feedId);
      await done();
      return result;
    }),
    readAll: wrap(async (feedId?: string) => {
      await rssApi.readAll(feedId);
      await done();
    }),
    setRead: toggle("is_read", rssApi.setRead),
    setStarred: toggle("is_starred", rssApi.setStarred),
  };
}
export type RssActions = ReturnType<typeof useRssActions>;
