import type { Attachment } from "@untitled/types";
import { MAX_UPLOAD_BYTES, safeName } from "@untitled/logic";

import type { PendingFile } from "@/features/chat/files";
import { FILES_BUCKET } from "@/features/attachments/useSignedUrls";
import { mobileEnv } from "@/config/env";
import { authClient } from "@/lib/auth-client";
import { createUploadId } from "@/lib/uploadId";

/** Upload a journal attachment into the same private owner/entry folder used by the web journal. */
export async function uploadJournalFile(userId: string, entryId: string, file: PendingFile): Promise<Attachment> {
  const path = `${userId}/journal/${entryId}/${createUploadId()}-${safeName(file.name)}`;
  const body = await (await fetch(file.uri)).blob();
  if (body.size > MAX_UPLOAD_BYTES) throw new Error("Files can be up to 10 MB.");
  const cookie = await authClient?.getCookie();
  const res = await fetch(`${mobileEnv.apiBaseUrl}/api/v1/storage/o/${FILES_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`, {
    method: "PUT",
    headers: { "content-type": file.type, ...(cookie ? { Cookie: cookie } : {}) },
    credentials: "omit",
    body,
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error ?? `Couldn’t upload ${file.name}.`);
  }
  return { path, name: file.name, type: file.type, size: file.size || body.size };
}

export { MAX_UPLOAD_BYTES };
