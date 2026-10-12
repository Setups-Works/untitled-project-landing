import type { Attachment } from "@untitled/types";
import { MAX_UPLOAD_BYTES, safeName } from "@untitled/logic";
import * as DocumentPicker from "expo-document-picker";

import { FILES_BUCKET } from "@/features/attachments/useSignedUrls";
import { mobileEnv } from "@/config/env";
import { authClient } from "@/lib/auth-client";

/** A file chosen on this device and not uploaded yet. */
export type PendingFile = { uri: string; name: string; type: string; size: number };

/** Opens the system file picker. Files over the 10 MB limit are skipped and counted so the caller can say so. */
export async function pickFiles(): Promise<{ files: PendingFile[]; tooBig: number }> {
  const res = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true, type: "*/*" });
  if (res.canceled) return { files: [], tooBig: 0 };
  const all = res.assets.map((a) => ({ uri: a.uri, name: a.name, type: a.mimeType || "application/octet-stream", size: a.size ?? 0 }));
  const files = all.filter((f) => f.size <= MAX_UPLOAD_BYTES);
  return { files, tooBig: all.length - files.length };
}

/** Uploads one file into the user's own folder of the files bucket (PUT /api/v1/storage/o/…), like the web does. */
export async function uploadChatFile(userId: string, chatId: string, file: PendingFile): Promise<Attachment> {
  const path = `${userId}/chat/${chatId}/${globalThis.crypto.randomUUID()}-${safeName(file.name)}`;
  const body = await (await fetch(file.uri)).blob();
  const cookie = await authClient?.getCookie();
  const res = await fetch(`${mobileEnv.apiBaseUrl}/api/v1/storage/o/${FILES_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`, {
    method: "PUT",
    headers: { "content-type": file.type, ...(cookie ? { Cookie: cookie } : {}) },
    credentials: "omit",
    body,
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error ?? `Couldn’t upload ${file.name}.`);
  }
  return { path, name: file.name, type: file.type, size: file.size || body.size };
}
