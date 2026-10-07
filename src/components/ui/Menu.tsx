"use client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useState, type ReactNode } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

/**
 * Dropdown menu on Radix DropdownMenu. What you get for free: arrow-key navigation, Home/End, type-ahead,
 * Escape to close, focus returned to the button, collision-aware placement, and a portal to <body> so a menu is never
 * clipped by a scrolling parent (no more `position: fixed` workarounds).
 *
 *   <Menu label="More options" trigger={<FA icon={faEllipsis} />}>
 *     <MenuItem onSelect={rename}>Rename</MenuItem>
 *     <MenuSeparator />
 *     <MenuItem danger onSelect={remove}>Delete</MenuItem>
 *   </Menu>
 *
 * Items close the menu when chosen. Pass `keepOpen` to keep it open (colour swatches, multi-select filters).
 */
export default function Menu({
  label,
  trigger,
  children,
  className = "",
  align = "end",
  side = "bottom",
  compact = false,
}: {
  label: string;
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  /** Smaller rows, for menus that float over dense lists (chat rows, folders). */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    // The wrapper keeps the existing per-menu styling hooks (className) and `data-open` for "stay visible while open".
    <div className={`ap-pop ${className}`} data-open={open}>
      <DropdownMenu.Root open={open} onOpenChange={setOpen}>
        <DropdownMenu.Trigger asChild>
          <button type="button" className="ap-pop-btn" aria-label={label}>
            {trigger}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="mn" data-compact={compact} side={side} align={align} sideOffset={8} collisionPadding={10}>
            {children}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}

type ItemProps = {
  children: ReactNode;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
  keepOpen?: boolean;
  className?: string;
  "aria-label"?: string;
};

const choose = (onSelect?: () => void, keepOpen?: boolean) => (e: Event) => {
  if (keepOpen) e.preventDefault();
  onSelect?.();
};

export function MenuItem({ children, onSelect, danger, disabled, keepOpen, className = "", ...rest }: ItemProps) {
  return (
    <DropdownMenu.Item
      className={`mn-item ${className}`}
      data-danger={danger}
      disabled={disabled}
      onSelect={choose(onSelect, keepOpen)}
      {...rest}
    >
      {children}
    </DropdownMenu.Item>
  );
}

/** A toggle row (for multi-select filters). Stays open so several can be toggled. */
export function MenuCheckItem({
  children,
  checked,
  onSelect,
  className = "",
  ...rest
}: Omit<ItemProps, "keepOpen" | "danger"> & { checked: boolean }) {
  return (
    <DropdownMenu.CheckboxItem className={`mn-item ${className}`} checked={checked} onSelect={choose(onSelect, true)} {...rest}>
      <span>{children}</span>
      {checked && <FA icon={faCheck} />}
    </DropdownMenu.CheckboxItem>
  );
}

/** One-of-many choices (sort order, category, provider). */
export function MenuRadioGroup({
  value,
  onValueChange,
  children,
}: {
  value: string;
  onValueChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <DropdownMenu.RadioGroup value={value} onValueChange={onValueChange}>
      {children}
    </DropdownMenu.RadioGroup>
  );
}

export function MenuRadioItem({
  value,
  children,
  disabled,
  className = "",
}: {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <DropdownMenu.RadioItem className={`mn-item ${className}`} value={value} disabled={disabled}>
      {children}
      <DropdownMenu.ItemIndicator>
        <FA icon={faCheck} />
      </DropdownMenu.ItemIndicator>
    </DropdownMenu.RadioItem>
  );
}

export const MenuLabel = ({ children }: { children: ReactNode }) => (
  <DropdownMenu.Label className="mn-label">{children}</DropdownMenu.Label>
);
export const MenuSeparator = () => <DropdownMenu.Separator className="mn-sep" />;
