import type { Attachment, SharedJournalInviteRole } from "@untitled/types";
import type { EntryInput } from "@untitled/api-client";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { sharedJournalsApi } from "./api";
import { qk } from "@/lib/queryKeys";

/** Data layer for shared journals on TanStack Query. Screens use these hooks only. */
export const useSharedJournals = () => useQuery({ queryKey: [...qk.sharedJournals, "list"], queryFn: sharedJournalsApi.list });
export const useMyInvites = () => useQuery({ queryKey: [...qk.sharedJournals, "invites"], queryFn: sharedJournalsApi.myInvites });
export const useSharedJournal = (id: string) =>
  useQuery({ queryKey: [...qk.sharedJournals, "detail", id], queryFn: () => sharedJournalsApi.get(id) });

/** A journal's feed, newest day first; `fetchNextPage` continues from the oldest day loaded. */
export function useJournalEntries(id: string) {
  return useInfiniteQuery({
    queryKey: [...qk.sharedJournals, "entries", id],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => sharedJournalsApi.entries(id, pageParam),
    getNextPageParam: (last) => (last.more ? last.entries[last.entries.length - 1]?.entry_date : undefined),
  });
}

/** Every write. Each one refreshes all shared-journal queries when it settles; the server decides what each role may do. */
export function useCollaborationActions() {
  const qc = useQueryClient();
  const settled = { onSettled: () => qc.invalidateQueries({ queryKey: qk.sharedJournals }) };
  return {
    create: useMutation({ mutationFn: (name: string) => sharedJournalsApi.create(name), ...settled }),
    rename: useMutation({ mutationFn: (v: { id: string; name: string }) => sharedJournalsApi.rename(v.id, v.name), ...settled }),
    remove: useMutation({ mutationFn: (id: string) => sharedJournalsApi.remove(id), ...settled }),
    invite: useMutation({
      mutationFn: (v: { id: string; username: string; role: SharedJournalInviteRole }) =>
        sharedJournalsApi.invite(v.id, v.username, v.role),
      ...settled,
    }),
    cancelInvite: useMutation({
      mutationFn: (v: { id: string; inviteId: string }) => sharedJournalsApi.cancelInvite(v.id, v.inviteId),
      ...settled,
    }),
    respond: useMutation({
      mutationFn: (v: { inviteId: string; action: "accept" | "decline" }) => sharedJournalsApi.respond(v.inviteId, v.action),
      ...settled,
    }),
    setRole: useMutation({
      mutationFn: (v: { id: string; userId: string; role: SharedJournalInviteRole }) => sharedJournalsApi.setRole(v.id, v.userId, v.role),
      ...settled,
    }),
    removeMember: useMutation({
      mutationFn: (v: { id: string; userId: string }) => sharedJournalsApi.removeMember(v.id, v.userId),
      ...settled,
    }),
    addEntry: useMutation({ mutationFn: (v: { id: string; entry: EntryInput }) => sharedJournalsApi.addEntry(v.id, v.entry), ...settled }),
    editEntry: useMutation({
      mutationFn: (v: { id: string; entryId: string; body?: string; attachments?: Attachment[] }) =>
        sharedJournalsApi.editEntry(v.id, v.entryId, { body: v.body, attachments: v.attachments }),
      ...settled,
    }),
    removeEntry: useMutation({
      mutationFn: (v: { id: string; entryId: string }) => sharedJournalsApi.removeEntry(v.id, v.entryId),
      ...settled,
    }),
  };
}
