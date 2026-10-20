import type { JournalEntry } from "@untitled/types";
import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";

import { uploadJournalFile } from "./files";
import { useJournalActions } from "./queries";
import { useAttachmentEdit } from "./useAttachmentEdit";
import { AppText } from "@/components/ui/AppText";
import { useConfirm } from "@/components/ui/Confirm";
import { EntryEditor } from "@/components/ui/EntryEditor";
import { Icon } from "@/components/ui/Icon";
import { KeptAttachments } from "@/components/ui/KeptAttachments";
import { Sheet } from "@/components/ui/Sheet";
import { Palette } from "@/constants/theme";
import { errorMessage } from "@/lib/api";
import { dayLabel, timeOf } from "@/lib/dates";
import { useAppState } from "@/providers/AppState";

/**
 * Changing a journal entry in the app's one writing page: its text, and its files, each of which can be removed or added to. Mount it
 * only while editing, so it starts from the latest saved entry. `embedded` draws it inside a route that is already a sheet.
 */
export function EntryEditSheet({
  entry,
  embedded,
  onClose,
  onSaved,
  onDeleted,
}: {
  entry: JournalEntry;
  embedded?: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const { user } = useAppState();
  const { update, remove } = useJournalActions();
  const { ask, dialog } = useConfirm();
  const edit = useAttachmentEdit(entry.attachments);
  const [body, setBody] = useState(entry.body);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);

  const hasContent = body.trim().length > 0 || edit.kept.length > 0 || edit.added.length > 0;

  async function save() {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      const attachments = edit.changed ? await edit.finalize((file) => uploadJournalFile(user.id, entry.id, file)) : undefined;
      await update.mutateAsync({ id: entry.id, body: body.trim(), attachments });
      onSaved();
    } catch (e) {
      setError(errorMessage(e, "Couldn’t save that change."));
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry() {
    setMoreOpen(false);
    const yes = await ask({
      title: "Delete this entry?",
      body: "The entry and its attachments will be permanently deleted.",
      confirmLabel: "Delete entry",
      danger: true,
    });
    if (yes) remove.mutate(entry.id, { onSuccess: onDeleted, onError: (e) => setError(errorMessage(e, "Couldn’t delete that entry.")) });
  }

  return (
    <EntryEditor
      embedded={embedded}
      visible
      label={`Editing · ${dayLabel(entry.entry_date)} · ${timeOf(entry.created_at)}`}
      inputLabel="Journal entry"
      draft={body}
      onDraft={setBody}
      options={edit.kept.length ? <KeptAttachments attachments={edit.kept} onRemove={edit.removeKept} /> : undefined}
      files={edit.added}
      onRemoveFile={edit.removeAdded}
      onPickImages={() => void edit.pick("image/*")}
      onPickFiles={() => void edit.pick()}
      onMore={() => setMoreOpen(true)}
      canSave={(body !== entry.body || edit.changed) && hasContent && !saving}
      saving={saving}
      error={error || edit.error}
      onSave={() => void save()}
      onClose={onClose}
    >
      <Sheet visible={moreOpen} onClose={() => setMoreOpen(false)} title="Entry actions">
        <Pressable accessibilityRole="button" style={styles.row} onPress={() => void deleteEntry()}>
          <AppText variant="body" color={Palette.clayFg}>
            Delete entry
          </AppText>
          <Icon name="trash" size={15} color={Palette.clayFg} />
        </Pressable>
      </Sheet>
      {dialog}
    </EntryEditor>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
});
