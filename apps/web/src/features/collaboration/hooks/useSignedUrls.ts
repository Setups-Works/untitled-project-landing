"use client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "../../../lib/api/client";
import { qk } from "../../../lib/query/keys";

/** How long a signed link lives, and how long we reuse one before asking for a fresh set (a little under, so none expires on screen). */
const TTL_SECONDS = 3600;
const REUSE_MS = (TTL_SECONDS - 300) * 1000;
const BUCKET = "note-files";

/**
 * Expiring links for files attached to entries, as a path → URL map. One request covers every file on screen, and it is cached by
 * the set of paths, so scrolling and edits don't ask again. Files of other authors work because the server checks journal membership.
 */
export function useSignedUrls(paths: string[]) {
  const sb = useMemo(api, []);
  const key = [...new Set(paths)].sort();
  const q = useQuery({
    queryKey: qk.signedUrls(BUCKET, key),
    enabled: key.length > 0,
    staleTime: REUSE_MS,
    queryFn: async () => {
      const { data } = await sb.storage.from(BUCKET).createSignedUrls(key, TTL_SECONDS);
      return Object.fromEntries((data ?? []).filter((d) => d.path && d.signedUrl).map((d) => [d.path as string, d.signedUrl as string]));
    },
  });
  return q.data ?? {};
}

/** Uploads one file into storage and returns its attachment record. Throws when storage refuses it. */
export async function uploadAttachment(path: string, file: File) {
  const type = file.type || "application/octet-stream";
  const { error } = await api().storage.from(BUCKET).upload(path, file, { contentType: type });
  if (error) throw new Error(`Couldn’t upload ${file.name}.`);
  return { path, name: file.name, type, size: file.size };
}
