"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Generic centred dialog (bottom sheet on phones). Escape or a click outside closes it. */
export default function Modal({ label, onClose, children, size = "md", top = false }: {
  label: string; onClose: () => void; children: ReactNode; size?: "sm" | "md" | "lg"; top?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!panel.current?.contains(document.activeElement)) panel.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector(".cd-back")) { e.stopPropagation(); onClose(); }
    };
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("keydown", key, true);
      document.body.style.overflow = prevOverflow;
      prev?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div className="tm-back" data-top={top} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="tm" data-size={size} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} ref={panel}>{children}</div>
    </div>,
    document.body,
  );
}
