import { QueryClient } from "@tanstack/react-query";

/**
 * Defaults for every query in the app.
 * - `staleTime` 30 s: switching tabs/pages shows cached data instantly and only refetches when it's older than that.
 * - `retry` once: transient network blips are retried, real errors surface quickly.
 * - Refetch on window focus / reconnect stays on (the library default) so data is fresh when you come back.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, gcTime: 5 * 60_000, retry: 1 },
      mutations: { retry: 0 },
    },
  });
}
