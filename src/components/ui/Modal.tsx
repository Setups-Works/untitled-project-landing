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
  glass = false,
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  top?: boolean;
  /** Liquid-glass look: a frosted, translucent panel that blooms in with a springy animation (used by search). */
  glass?: boolean;
}) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={`tm-back ${glass ? "animate-glass-fade bg-[#f5f4eb]/60 backdrop-blur-[10px] motion-reduce:animate-none [html[data-motion=reduce]_&]:animate-none" : ""}`}
          data-top={top}
        >
          <Dialog.Content
            className={`tm ${
              glass
                ? "animate-glass-in rounded-[30px] bg-linear-to-b from-white/85 to-white/60 backdrop-blur-3xl backdrop-saturate-200 shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_0_0_1px_rgba(255,255,255,0.75),inset_0_-1px_2px_rgba(27,28,20,0.05),0_40px_90px_-24px_rgba(27,28,20,0.5)] motion-reduce:animate-none [html[data-motion=reduce]_&]:animate-none"
                : ""
            }`}
            data-size={size}
            aria-describedby={undefined}
          >
            <Dialog.Title className="sr-only">{label}</Dialog.Title>
            {children}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
