"use client";
import { useRef } from "react";
import { useMotion } from "./motion";

/** Counts up to `to` when scrolled into view. */
export function Count({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useMotion(ref, ({ g, root, calm }) => {
    if (calm) return;
    const o = { v: 0 };
    root.textContent = `0${suffix}`;
    g.to(o, {
      v: to,
      duration: 1.6,
      ease: "power3.out",
      onUpdate: () => {
        root.textContent = `${Math.round(o.v)}${suffix}`;
      },
      scrollTrigger: { trigger: root, start: "top 90%", once: true },
    });
  });
  return (
    <span ref={ref}>
      {to}
      {suffix}
    </span>
  );
}
