"use client";
import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

/**
 * Accessible dialog (centred, bottom sheet on phones) built on Radix Dialog.
 * Radix provides what a hand-rolled modal tends to miss: a real focus trap, focus restored to the trigger on close,
 * Escape handling that respects stacked dialogs, scroll locking, `aria-modal` and inert background content.
 *
 * Usage: render it only while open — `{open && <Modal label="Edit task" onClose={close}>…</Modal>}`.
 * `label` is announced by screen readers (it is the dialog's accessible name, not visible text).
 */
export default function Modal({
  label,
  onClose,
  children,
  size = "md",
  top = false,
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  top?: boolean;
}) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="tm-back" data-top={top}>
          <Dialog.Content className="tm" data-size={size} aria-describedby={undefined}>
            <Dialog.Title className="sr-only">{label}</Dialog.Title>
            {children}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
