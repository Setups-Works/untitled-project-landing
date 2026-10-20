import type { Attachment } from "@untitled/types";

import { FilePreviewList } from "./FilePreviewList";
import { useSignedUrls } from "@/features/attachments/useSignedUrls";
import type { PendingFile } from "@/features/chat/files";

/**
 * The files an entry or note already has, shown while editing it with the same cards as files you are about to add (a thumbnail,
 * a player for voice notes, name and size) and a remove button on each. Removing only drops it from the list; it is deleted when
 * the person saves.
 */
export function KeptAttachments({ attachments, onRemove }: { attachments: Attachment[]; onRemove: (path: string) => void }) {
  const urls = useSignedUrls(attachments);
  // A card needs a link to show or play the file, so a file appears as soon as its link arrives.
  const ready = attachments.filter((a) => urls.data?.[a.path]);
  const files: PendingFile[] = ready.map((a) => ({ uri: urls.data![a.path]!, name: a.name, type: a.type, size: a.size }));
  return <FilePreviewList label="Attached files" files={files} onRemove={(i) => onRemove(ready[i]!.path)} />;
}
