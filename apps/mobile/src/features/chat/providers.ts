import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import type { AiProvider } from "./types";
import { api } from "@/lib/api";

/** "No AI" always works: messages are saved to the chat and no reply is generated (same entry the web adds). */
export const NO_AI: AiProvider = {
  id: "none",
  label: "No AI",
  note: "Messages are saved to the chat. No replies are generated.",
  runtime: "server",
  available: true,
};

const KEY = "up_ai_provider"; // the same key name the web keeps in localStorage

/**
 * The AI choices for the composer and the one selected. Providers come from the server (/api/v1/ai/status): what is installed
 * and configured. The choice is remembered on this device; with none saved, the first configured server-side provider is used.
 */
export function useAiProviders() {
  const q = useQuery({
    queryKey: ["ai-providers"],
    staleTime: 5 * 60_000,
    retry: 3, // the list decides what the picker offers; ride out a one-off failed request
    queryFn: async () => (await api.get<{ providers: AiProvider[] }>("/api/v1/ai/status")).providers,
  });
  const providers = useMemo<AiProvider[]>(() => [NO_AI, ...(q.data ?? [])], [q.data]);
  const [chosen, setChosen] = useState<string | null>(null);

  useEffect(() => {
    void AsyncStorage.getItem(KEY)
      .then(setChosen)
      .catch(() => undefined);
  }, []);

  const provider = useMemo(() => {
    // A saved choice only counts while that provider is still available.
    const saved = providers.find((p) => p.id === chosen && p.available);
    if (saved) return saved.id;
    if (chosen === NO_AI.id) return NO_AI.id;
    return providers.find((p) => p.available && p.runtime === "server" && p.id !== NO_AI.id)?.id ?? NO_AI.id;
  }, [providers, chosen]);

  const select = (id: string) => {
    setChosen(id);
    void AsyncStorage.setItem(KEY, id).catch(() => undefined);
  };

  return { providers, provider, select, loading: q.isPending };
}
