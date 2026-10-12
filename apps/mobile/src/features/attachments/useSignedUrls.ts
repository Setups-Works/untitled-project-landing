import { useQuery } from "@tanstack/react-query";
import type { Attachment } from "@untitled/types";

import { mobileEnv } from "@/config/env";
import { api } from "@/lib/api";

/** The storage bucket the web uses for note, journal and chat files. */
export const FILES_BUCKET = "note-files";
const TTL = 3600;

type Signed = { path: string; signedUrl: string | null; error: string | null };

/**
 * Expiring links for the user's own files (POST /api/v1/storage/sign, the same call the web makes). The server returns a
 * path on the web app's origin with a signature, which is enough to load the file without a cookie, so it can feed a native image.
 */
export function useSignedUrls(attachments: Attachment[]) {
  const paths = attachments.map((a) => a.path);
  return useQuery({
    queryKey: ["signed-urls", paths],
    enabled: paths.length > 0,
    staleTime: (TTL - 300) * 1000,
    queryFn: async () => {
      const { data } = await api.post<{ data: Signed[] }>("/api/v1/storage/sign", { bucket: FILES_BUCKET, paths, ttl: TTL });
      const urls: Record<string, string> = {};
      for (const s of data) if (s.signedUrl) urls[s.path] = `${mobileEnv.apiBaseUrl}${s.signedUrl}`;
      return urls;
    },
  });
}
