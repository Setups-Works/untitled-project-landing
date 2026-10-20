import type { SharedJournalEntry } from "@untitled/types";
import { useState } from "react";

import { useCollaborationActions } from "../queries";
import { uploadSharedJournalFile } from "../files";
import { EntryEditor } from "@/components/ui/EntryEditor";
import { KeptAttachments } from "@/components/ui/KeptAttachments";
import { useAttachmentEdit } from "@/features/journal/useAttachmentEdit";
import { errorMessage } from "@/lib/api";
import { dayLabel, timeOf } from "@/lib/dates";

/** Changing an entry you wrote in a shared journal, in the app's one writing page: its text and files (each can be removed or added to). */
export function EntryEditSheet({
  journalId,
  userId,
  entry,
  onClose,
}: {
  journalId: string;
  userId: string;
  entry: SharedJournalEntry;
  onClose: () => void;
}) {
  const act = useCollaborationActions();
  const edit = useAttachmentEdit(entry.attachments);
  const [body, setBody] = useState(entry.body);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const hasContent = body.trim().length > 0 || edit.kept.length > 0 || edit.added.length > 0;

  async function save() {
    setSaving(true);
    setError("");
    try {
      const attachments = edit.changed ? await edit.finalize((file) => uploadSharedJournalFile(userId, journalId, file)) : undefined;
      await act.editEntry.mutateAsync({ id: journalId, entryId: entry.id, body: body.trim(), attachments });
      onClose();
    } catch (e) {
      setError(errorMessage(e, "Couldn’t save that change."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <EntryEditor
      visible
      label={`Editing · ${dayLabel(entry.entry_date)} · ${timeOf(entry.created_at)}`}
      inputLabel="Edit entry"
      draft={body}
      onDraft={setBody}
      options={edit.kept.length ? <KeptAttachments attachments={edit.kept} onRemove={edit.removeKept} /> : undefined}
      files={edit.added}
      onRemoveFile={edit.removeAdded}
      onPickImages={() => void edit.pick("image/*")}
      onPickFiles={() => void edit.pick()}
      canSave={(body !== entry.body || edit.changed) && hasContent && !saving}
      saving={saving}
      error={error || edit.error}
      onSave={() => void save()}
      onClose={onClose}
    />
  );
}
