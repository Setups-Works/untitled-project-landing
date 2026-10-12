import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ItemResponse, JournalEntry, ListResponse } from "@untitled/types";

import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

export function useJournal() {
  return useQuery({
    queryKey: qk.journal,
    queryFn: async () => (await api.get<ListResponse<JournalEntry>>("/api/v1/journal?limit=500")).data,
  });
}

export function useJournalDay(date: string) {
  return useQuery({
    queryKey: [...qk.journal, "day", date],
    queryFn: async () => (await api.get<ListResponse<JournalEntry>>(`/api/v1/journal?entry_date=${date}&limit=500`)).data,
  });
}

export function useJournalEntry(id: string | undefined) {
  const enabled = !!id && id !== "new";
  return useQuery({
    queryKey: [...qk.journal, id],
    enabled,
    queryFn: async () => (await api.get<ItemResponse<JournalEntry>>(`/api/v1/journal/${id}`)).data,
  });
}

export function useJournalActions() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: qk.journal });
  const create = useMutation({
    mutationFn: (e: { entry_date: string; body: string; kind?: "text" | "voice" }) =>
      api.post<ItemResponse<JournalEntry>>("/api/v1/journal", e),
    onSettled: refresh,
  });
  const update = useMutation({
    mutationFn: ({ id, body, attachments }: { id: string; body?: string; attachments?: JournalEntry["attachments"] }) =>
      api.patch<ItemResponse<JournalEntry>>(`/api/v1/journal/${id}`, { body, attachments }),
    onSettled: refresh,
  });
  const remove = useMutation({ mutationFn: (id: string) => api.delete<{ ok: true }>(`/api/v1/journal/${id}`), onSettled: refresh });
  return { create, update, remove };
}
