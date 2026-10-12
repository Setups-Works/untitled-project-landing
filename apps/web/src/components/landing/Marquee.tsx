"use client";
import { useRef, type ReactNode } from "react";
import { useMotion } from "./motion";

/**
 * An endless horizontal ticker. It speeds up with the scroll velocity and eases back, and pauses while hovered. `children` is
 * rendered twice so the loop is seamless; the copy is hidden from assistive tech.
 */
export function Marquee({ children, speed = 60, className = "" }: { children: ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useMotion(ref, ({ g, root, calm }) => {
    const track = root.querySelector<HTMLElement>("[data-track]");
    if (!track || calm) return;
    const half = () => track.scrollWidth / 2;
    const tween = g.to(track, { x: () => -half(), duration: () => half() / speed, ease: "none", repeat: -1, invalidateOnRefresh: true });
    const st = speedWithScroll(g, tween);
    const pause = () => g.to(tween, { timeScale: 0, duration: 0.5, overwrite: true });
    const play = () => g.to(tween, { timeScale: 1, duration: 0.5, overwrite: true });
    root.addEventListener("pointerenter", pause);
    root.addEventListener("pointerleave", play);
    return () => {
      st();
      root.removeEventListener("pointerenter", pause);
      root.removeEventListener("pointerleave", play);
    };
  });
  return (
    <div
      ref={ref}
      className={`overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] ${className}`}
    >
      <div data-track className="flex w-max gap-3">
        <div className="flex shrink-0 gap-3">{children}</div>
        <div className="flex shrink-0 gap-3" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Scroll velocity nudges the ticker's speed. Returns a cleanup. */
function speedWithScroll(g: typeof import("gsap").default, tween: gsap.core.Tween) {
  let last = window.scrollY;
  let raf = 0;
  const tick = () => {
    const now = window.scrollY;
    const v = Math.abs(now - last);
    last = now;
    if (v > 1) g.to(tween, { timeScale: 1 + Math.min(v / 8, 5), duration: 0.2, overwrite: true });
    else if (tween.timeScale() > 1) g.to(tween, { timeScale: 1, duration: 0.8, overwrite: true });
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
