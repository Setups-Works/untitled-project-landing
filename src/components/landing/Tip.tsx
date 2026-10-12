"use client";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";

type Pos = { x: number; y: number; below: boolean };

/**
 * A hover / focus tooltip. It wraps anything (including elements a server component hands it), shows a small smoked-glass bubble
 * with a springy GSAP pop, and while open wires the bubble to the first focusable thing inside with `aria-describedby`. The bubble
 * is portaled to <body> with fixed coordinates, so no overflow-hidden card or transformed ancestor can clip it, and it flips below
 * the element near the top of the screen.
 */
export function Tip({
  content,
  children,
  delay = 120,
  className = "inline-flex",
}: {
  content: ReactNode;
  children: ReactNode;
  delay?: number;
  /** Layout of the wrapper around the children; use `flex h-full w-full` to fill a grid cell. */
  className?: string;
}) {
  const id = useId();
  const anchor = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pos, setPos] = useState<Pos | null>(null);

  const open = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const r = anchor.current?.getBoundingClientRect();
      if (!r) return;
      const x = Math.min(Math.max(r.left + r.width / 2, 130), window.innerWidth - 130);
      setPos({ x, y: r.top > 90 ? r.top - 10 : r.bottom + 10, below: r.top <= 90 });
    }, delay);
  }, [delay]);
  const close = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setPos(null);
  }, []);

  useEffect(() => {
    if (!pos || !bubble.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduce") {
      gsap.set(bubble.current, { autoAlpha: 1 });
      return;
    }
    gsap.fromTo(
      bubble.current,
      { autoAlpha: 0, y: pos.below ? -8 : 8, scale: 0.9 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.42, ease: "back.out(1.8)" },
    );
  }, [pos]);
  // Describe the first focusable element inside, only while the tooltip is showing (so a screen reader hears it on focus).
  useEffect(() => {
    if (!pos) return;
    const target = anchor.current?.querySelector<HTMLElement>("a,button,input,select,textarea,[tabindex]:not([tabindex='-1'])");
    target?.setAttribute("aria-describedby", id);
    return () => target?.removeAttribute("aria-describedby");
  }, [pos, id]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", k);
    window.addEventListener("scroll", close, { passive: true });
    return () => {
      window.removeEventListener("keydown", k);
      window.removeEventListener("scroll", close);
    };
  }, [close]);

  return (
    <>
      <span ref={anchor} className={className} onPointerEnter={open} onPointerLeave={close} onFocus={open} onBlur={close}>
        {children}
      </span>
      {pos &&
        createPortal(
          <span
            ref={bubble}
            id={id}
            role="tooltip"
            style={{ left: pos.x, top: pos.y, transform: `translate(-50%, ${pos.below ? "0" : "-100%"})` }}
            className="liquid-dark pointer-events-none fixed z-[200] w-max max-w-[250px] rounded-r2 px-3 py-2 text-[12.5px] leading-snug opacity-0"
          >
            {content}
          </span>,
          document.body,
        )}
    </>
  );
}
