"use client";
import { useRef } from "react";
import { useMotion } from "./motion";

/** A thin line across the top that fills as the page is read. */
export default function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useMotion(ref, ({ g, root, calm }) => {
    if (calm) return;
    g.fromTo(root, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.25 } });
  });
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[90] h-[3px] w-full origin-left scale-x-0 bg-green-fg/80"
    />
  );
}
