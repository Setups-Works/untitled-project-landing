import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { createRssApi } from "@untitled/api-client";
import { RSS } from "@untitled/logic";
import type { RssFilter, RssItem } from "@untitled/types";

import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

/** The same RSS client the web uses (packages/api-client); only the HTTP adapter differs. */
export const rssApi = createRssApi(api);

type Page = Awaited<ReturnType<typeof rssApi.items>>;
export type ArticleQuery = { feed?: string; filter: RssFilter; q: string };

export const useFeeds = () => useQuery({ queryKey: qk.rss.feeds, queryFn: rssApi.feeds });

export const useArticles = ({ feed, filter, q }: ArticleQuery) =>
  useInfiniteQuery({
    queryKey: qk.rss.items(feed ?? "all", filter, q),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => rssApi.items({ feed, filter, q, cursor: pageParam }),
    getNextPageParam: (last) => last.next ?? undefined,
  });

/** The full text of one article (the list only carries summaries). */
export const useArticle = (id: string) => useQuery({ queryKey: qk.rss.item(id), queryFn: () => rssApi.item(id) });

/** Fetches new articles while the Reader is open; the server skips feeds fetched a moment ago. */
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

export function useRssActions() {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: qk.rss.all });
  const add = useMutation({ mutationFn: rssApi.addFeed, onSuccess: done });
  const remove = useMutation({ mutationFn: rssApi.removeFeed, onSuccess: done });
  const refresh = useMutation({ mutationFn: (feedId?: string) => rssApi.refresh(feedId), onSuccess: done });
  const readAll = useMutation({ mutationFn: (feedId?: string) => rssApi.readAll(feedId), onSuccess: done });
  const setRead = useMutation({
    mutationFn: async (v: { id: string; value: boolean }) => rssApi.setRead(v.id, v.value),
    onMutate: (v) => patchCached(qc, v.id, { is_read: v.value }),
    onSettled: done,
  });
  const setStarred = useMutation({
    mutationFn: async (v: { id: string; value: boolean }) => rssApi.setStarred(v.id, v.value),
    onMutate: (v) => patchCached(qc, v.id, { is_starred: v.value }),
    onSettled: done,
  });
  return { add, remove, refresh, readAll, setRead, setStarred };
}
