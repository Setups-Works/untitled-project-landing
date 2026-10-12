import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ItemResponse, ListResponse, Note, Tone } from "@untitled/types";

import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

export function useNotes() {
  return useQuery({
    queryKey: qk.notes,
    queryFn: async () => {
      const { data } = await api.get<ListResponse<Note>>("/api/v1/notes?limit=500");
      // Match the web's default manual order while keeping pinned notes at the top.
      return [...data].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.sort_order - a.sort_order);
    },
  });
}

export function useNote(id: string | undefined) {
  const enabled = !!id && id !== "new";
  return useQuery({
    queryKey: [...qk.notes, id],
    enabled,
    queryFn: async () => (await api.get<ItemResponse<Note>>(`/api/v1/notes/${id}`)).data,
  });
}

export type NoteInput = { title: string; body: string; pinned?: boolean; color?: Tone | null; category?: string; attachments?: Note["attachments"]; sort_order?: number };

export function useNoteActions() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: qk.notes });
  const create = useMutation({ mutationFn: (n: NoteInput) => api.post<ItemResponse<Note>>("/api/v1/notes", n), onSettled: refresh });
  const update = useMutation({
    mutationFn: ({ id, ...changes }: Partial<NoteInput> & { id: string }) => api.patch<ItemResponse<Note>>(`/api/v1/notes/${id}`, changes),
    onSettled: refresh,
  });
  const remove = useMutation({ mutationFn: (id: string) => api.delete<{ ok: true }>(`/api/v1/notes/${id}`), onSettled: refresh });
  return { create, update, remove };
}
