"use client";
import type { ComponentProps } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faGripVertical } from "@fortawesome/free-solid-svg-icons";

/** The grip on a Home card. `touch-none` keeps a finger drag from scrolling the page; arrow keys move the card too. */
export default function DragHandle({ label, ...rest }: { label: string } & ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label={`Move ${label}`}
      title="Drag to reorder, or press the up and down arrow keys"
      className="grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-pill text-[13px] text-fg-faint transition-colors hover:bg-surface-muted hover:text-fg active:cursor-grabbing"
      {...rest}
    >
      <FA icon={faGripVertical} />
    </button>
  );
}
