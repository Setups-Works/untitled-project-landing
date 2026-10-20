"use client";
import { createSharedJournalsApi, type EntryInput } from "@untitled/api-client";
import type { Attachment, SharedJournalInviteRole } from "@untitled/types";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useRealtimeInvalidate } from "../../../hooks/useRealtimeInvalidate";
import { http, restMessage } from "../../../lib/api/rest";
import { qk } from "../../../lib/query/keys";

/**
 * Data layer for shared journals, on TanStack Query. The API calls are written once in packages/api-client and shared with the
 * app; components use these hooks only. Other people's changes arrive through realtime and refresh whatever is on screen.
 */
const sharedJournalsApi = createSharedJournalsApi(http);

/** Keeps every shared-journal query fresh when anything in a journal the person can see changes (their own writes included). */
export function useCollaborationRealtime() {
  const keys = [qk.sharedJournals.all];
  useRealtimeInvalidate("shared_journals", keys);
  useRealtimeInvalidate("shared_journal_members", keys);
  useRealtimeInvalidate("shared_journal_invites", keys);
  useRealtimeInvalidate("shared_journal_entries", keys);
}

export const useSharedJournals = () => useQuery({ queryKey: qk.sharedJournals.list, queryFn: sharedJournalsApi.list });
export const useMyInvites = () => useQuery({ queryKey: qk.sharedJournals.invites, queryFn: sharedJournalsApi.myInvites });
export const useSharedJournal = (id: string) =>
  useQuery({ queryKey: qk.sharedJournals.detail(id), queryFn: () => sharedJournalsApi.get(id) });

/** A journal's feed, newest day first; `fetchNextPage` continues from the oldest day loaded. */
export function useJournalEntries(id: string) {
  return useInfiniteQuery({
    queryKey: qk.sharedJournals.entries(id),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => sharedJournalsApi.entries(id, pageParam),
    getNextPageParam: (last) => (last.more ? last.entries[last.entries.length - 1]?.entry_date : undefined),
  });
}

/**
 * Every write. Nothing is applied optimistically: these are rare, shared actions whose outcome depends on permissions, so the
 * screen waits for the server and then refreshes. Each action resolves to its result, or to `undefined` after telling `onError` why.
 */
export function useCollaborationActions(onError: (message: string) => void) {
  const qc = useQueryClient();
  return useMemo(() => {
    const act =
      <A extends unknown[], R>(fn: (...args: A) => Promise<R>) =>
      async (...args: A): Promise<R | undefined> => {
        try {
          const result = await fn(...args);
          await qc.invalidateQueries({ queryKey: qk.sharedJournals.all });
          return result;
        } catch (e) {
          onError(restMessage(e));
          return undefined;
        }
      };
    return {
      create: act((name: string) => sharedJournalsApi.create(name)),
      rename: act((id: string, name: string) => sharedJournalsApi.rename(id, name)),
      remove: act((id: string) => sharedJournalsApi.remove(id)),
      invite: act((id: string, username: string, role: SharedJournalInviteRole) => sharedJournalsApi.invite(id, username, role)),
      cancelInvite: act((id: string, inviteId: string) => sharedJournalsApi.cancelInvite(id, inviteId)),
      respond: act((inviteId: string, action: "accept" | "decline") => sharedJournalsApi.respond(inviteId, action)),
      setRole: act((id: string, userId: string, role: SharedJournalInviteRole) => sharedJournalsApi.setRole(id, userId, role)),
      removeMember: act((id: string, userId: string) => sharedJournalsApi.removeMember(id, userId)),
      addEntry: act((id: string, entry: EntryInput) => sharedJournalsApi.addEntry(id, entry)),
      editEntry: act((id: string, entryId: string, patch: { body?: string; attachments?: Attachment[] }) =>
        sharedJournalsApi.editEntry(id, entryId, patch),
      ),
      removeEntry: act((id: string, entryId: string) => sharedJournalsApi.removeEntry(id, entryId)),
    };
  }, [qc, onError]);
}
