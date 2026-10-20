import { MAX_UPLOAD_BYTES } from "@untitled/logic";
import type { Attachment } from "@untitled/types";
import { useState } from "react";

import { pickFiles, type PendingFile } from "@/features/chat/files";
import { errorMessage } from "@/lib/api";

/**
 * The files of an entry being edited: the ones it already has (each can be removed), and new ones picked to add. Nothing is changed on
 * the server until `finalize` runs on Save, so cancelling loses nothing. `upload` stores one new file and returns its record.
 */
export function useAttachmentEdit(original: Attachment[]) {
  const [kept, setKept] = useState(original);
  const [added, setAdded] = useState<PendingFile[]>([]);
  const [error, setError] = useState("");

  const changed = added.length > 0 || kept.length !== original.length;

  async function pick(type?: string) {
    try {
      const { files, tooBig } = await pickFiles(type);
      setError(tooBig ? `Files can be up to ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.` : "");
      if (files.length) setAdded((cur) => [...cur, ...files]);
    } catch (e) {
      setError(errorMessage(e, "Couldn’t open your files."));
    }
  }

  /** The attachments after saving: what was kept plus the newly uploaded files. */
  async function finalize(upload: (file: PendingFile) => Promise<Attachment>) {
    const uploaded = await Promise.all(added.map(upload));
    return [...kept, ...uploaded];
  }

  return {
    kept,
    added,
    error,
    changed,
    pick,
    removeKept: (path: string) => setKept((cur) => cur.filter((a) => a.path !== path)),
    removeAdded: (i: number) => setAdded((cur) => cur.filter((_, j) => j !== i)),
    finalize,
  };
}
