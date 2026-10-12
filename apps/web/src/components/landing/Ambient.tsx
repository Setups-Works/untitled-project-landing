"use client";
import { useRef } from "react";
import { useMotion } from "./motion";

/**
 * The colour behind the glass. Liquid glass only reads as glass when there is something to blur, so the marketing pages get a
 * fixed layer of soft, slowly drifting colour orbs (the product's own tints) over the cream canvas, which also slide at different
 * speeds as you scroll so the glass seems to pass over them. Warm tints (amber, clay) are kept strong enough that the page still
 * reads as cream, not grey. Purely decorative.
 */
export default function Ambient() {
  const ref = useRef<HTMLDivElement>(null);
  useMotion(ref, ({ g, root, calm }) => {
    if (calm) return;
    root.querySelectorAll<HTMLElement>("[data-depth]").forEach((el) => {
      g.to(el, {
        y: () => -Number(el.dataset.depth) * (document.documentElement.scrollHeight - window.innerHeight),
        ease: "none",
        scrollTrigger: { start: 0, end: "max", scrub: 1.2, invalidateOnRefresh: true },
      });
    });
  });
  const orb = "block rounded-full will-change-transform motion-reduce:animate-none [html[data-motion=reduce]_&]:animate-none";
  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div data-depth="0.06" className="absolute -top-[22vh] -left-[14vw]">
        <span className={`${orb} size-[64vmax] animate-drift-a bg-(--orb-1)/[0.14] blur-[120px]`} />
      </div>
      <div data-depth="0.1" className="absolute top-[4vh] -right-[18vw]">
        <span className={`${orb} size-[56vmax] animate-drift-b bg-(--orb-2)/[0.13] blur-[120px]`} />
      </div>
      <div data-depth="0.14" className="absolute top-[46vh] -left-[10vw]">
        <span className={`${orb} size-[48vmax] animate-drift-c bg-(--orb-3)/[0.2] blur-[120px]`} />
      </div>
      <div data-depth="0.08" className="absolute -bottom-[24vh] left-[30vw]">
        <span className={`${orb} size-[52vmax] animate-drift-a bg-(--orb-4)/[0.12] blur-[120px]`} />
      </div>
      <div data-depth="0.12" className="absolute -right-[10vw] -bottom-[16vh]">
        <span className={`${orb} size-[40vmax] animate-drift-b bg-(--orb-5)/[0.18] blur-[110px]`} />
      </div>
    </div>
  );
}
