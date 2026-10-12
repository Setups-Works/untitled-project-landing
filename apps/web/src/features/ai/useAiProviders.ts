"use client";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NO_AI, type Provider } from "../../lib/ai";
import { qk } from "../../lib/query/keys";

const KEY = "up_ai_provider";

/**
 * The AI choices for the chat picker and the one currently selected.
 * Providers come from the server (what is installed and configured); the choice is remembered in this browser.
 * When the person has never chosen, the first configured server-side provider is used; if none is configured, "No AI".
 */
export function useAiProviders() {
  const q = useQuery({
    queryKey: qk.aiProviders,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const res = await fetch("/api/v1/ai/status", { credentials: "same-origin" });
      if (!res.ok) throw new Error("status failed");
      return ((await res.json()) as { providers: Provider[] }).providers;
    },
  });

  const providers = useMemo<Provider[]>(() => [NO_AI, ...(q.data ?? [])], [q.data]);
  const [chosen, setChosen] = useState<string | null>(null);
  useEffect(() => {
    try {
      setChosen(window.localStorage.getItem(KEY));
    } catch {
      /* storage unavailable: fall back to the default below */
    }
  }, []);

  // A saved choice only counts while that provider is still available.
  const provider = useMemo(() => {
    const saved = providers.find((p) => p.id === chosen && p.available);
    if (saved) return saved.id;
    if (chosen === NO_AI.id) return NO_AI.id;
    return providers.find((p) => p.available && p.runtime === "server")?.id ?? NO_AI.id;
  }, [providers, chosen]);

  const select = useCallback((id: string) => {
    setChosen(id);
    try {
      window.localStorage.setItem(KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  return { providers, provider, select, loading: q.isPending };
}
