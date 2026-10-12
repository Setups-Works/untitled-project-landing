"use client";
import { useRef, type ReactNode } from "react";
import { useMotion } from "./motion";

/** Moves its content against the scroll: `speed` is the distance in px it travels over the viewport (negative = the other way). */
export function Parallax({ children, speed = 60, className = "" }: { children: ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useMotion(ref, ({ g, root, calm }) => {
    if (calm) return;
    g.fromTo(
      root,
      { y: -speed / 2 },
      { y: speed / 2, ease: "none", scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: 0.6 } },
    );
  });
  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}
