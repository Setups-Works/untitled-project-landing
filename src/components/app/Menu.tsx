"use client";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * A button that opens a small popover. Closes on outside click or Escape.
 * `up` opens it above the button; `fixed` positions it against the viewport so it isn't clipped by a scrolling parent.
 */
export default function Menu({ label, trigger, children, align = "right", className = "", up = false, fixed = false }: {
  label: string; trigger: ReactNode; children: (close: () => void) => ReactNode; align?: "left" | "right"; className?: string; up?: boolean; fixed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<CSSProperties | undefined>();
  const box = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const scroll = () => fixed && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    window.addEventListener("resize", scroll);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); window.removeEventListener("resize", scroll); };
  }, [open, fixed]);

  function toggle() {
    if (!open && fixed && btn.current) {
      const r = btn.current.getBoundingClientRect();
      // Open on whichever side has more room, and never taller than that room (the app bar takes the top ~80px).
      const below = window.innerHeight - r.bottom - 14;
      const above = r.top - 84;
      const flip = below < 340 && above > below;
      const room = Math.max(160, Math.min(460, (flip ? above : below) - 6));
      setPos({
        position: "fixed", left: "auto", maxHeight: room,
        right: Math.max(8, window.innerWidth - r.right),
        ...(flip ? { bottom: window.innerHeight - r.top + 6, top: "auto" } : { top: r.bottom + 6 }),
      });
    }
    setOpen(!open);
  }

  return (
    <div className={`ap-pop ${className}`} ref={box} data-open={open}>
      <button type="button" ref={btn} className="ap-pop-btn" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={toggle}>{trigger}</button>
      {open && <div className="ap-pop-box" data-align={align} data-up={up} data-fixed={fixed} style={pos} role="menu">{children(() => setOpen(false))}</div>}
    </div>
  );
}
