"use client";
import { setJournalEntryShared } from "@untitled/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { http, restMessage } from "../../../lib/api/rest";
import { qk } from "../../../lib/query/keys";

/** Turning an entry's public link on or off. Resolves to the new token (null = off), or `undefined` after telling `onError` why it failed. */
export function useEntryShare(onError: (message: string) => void) {
  const qc = useQueryClient();
  return useCallback(
    async (entryId: string, shared: boolean) => {
      try {
        const token = await setJournalEntryShared(http, entryId, shared);
        await qc.invalidateQueries({ queryKey: qk.journal.all });
        return token;
      } catch (e) {
        onError(restMessage(e, "Couldn’t change sharing."));
        return undefined;
      }
    },
    [qc, onError],
  );
}
