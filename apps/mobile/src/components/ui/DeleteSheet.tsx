import type { ReactNode } from "react";

import { AppText } from "./AppText";
import { Banner } from "./Banner";
import { Button } from "./Button";
import { Sheet } from "./Sheet";
import { Palette } from "@/constants/theme";

/**
 * The one dialog every delete in the app asks with (it began as the notes' "Delete this note?"): a sheet with what will happen, a red
 * confirm button and Cancel. `useConfirm().ask({ danger: true })` renders this, so any screen that asks before deleting looks the same.
 */
export function DeleteSheet({
  visible,
  title,
  message,
  confirmLabel = "Delete",
  loading,
  error,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      {typeof message === "string" ? (
        <AppText variant="body" color={Palette.fgMuted}>
          {message}
        </AppText>
      ) : (
        message
      )}
      {error ? <Banner kind="error">{error}</Banner> : null}
      <Button title={confirmLabel} kind="danger" icon="trash" loading={loading} onPress={onConfirm} />
      <Button title="Cancel" kind="secondary" onPress={onClose} />
    </Sheet>
  );
}
