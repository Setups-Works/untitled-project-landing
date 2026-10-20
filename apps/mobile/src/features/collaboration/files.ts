import { journalFilePath, safeName } from "@untitled/logic";
import type { Attachment } from "@untitled/types";

import type { PendingFile } from "@/features/chat/files";
import { putFile } from "@/features/journal/files";
import { createUploadId } from "@/lib/uploadId";

/** Uploads a file for an entry of a shared journal, into the author's own folder of that journal (the only place the server accepts). */
export function uploadSharedJournalFile(userId: string, journalId: string, file: PendingFile): Promise<Attachment> {
  return putFile(journalFilePath(userId, journalId, createUploadId(), safeName(file.name)), file);
}
