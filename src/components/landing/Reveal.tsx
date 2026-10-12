"use client";
import { useRef, type ReactNode } from "react";
import { showNow, useMotion } from "./motion";

/**
 * Fades and rises into place when scrolled into view (GSAP ScrollTrigger). With `stagger`, the children marked `data-r`
 * come in one after another instead. Content is hidden until then (`opacity-0`); the page's <noscript> rule and reduced-motion
 * mode both show it immediately.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  y = 34,
  stagger,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  stagger?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useMotion(ref, ({ g, root, calm }) => {
    const targets = stagger ? root.querySelectorAll("[data-r]") : root;
    if (calm) return void showNow(g, targets);
    g.fromTo(
      targets,
      { y, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 1,
        delay: delay / 1000,
        ease: "power3.out",
        stagger: stagger ?? 0,
        scrollTrigger: { trigger: root, start: "top 90%", once: true },
      },
    );
  });
  // With `stagger` the wrapper stays visible and the `data-r` children carry the hidden state.
  return (
    <div ref={ref} data-reveal={stagger ? undefined : ""} className={`${stagger ? "" : "opacity-0"} ${className}`}>
      {children}
    </div>
  );
}

/** Marks a child of `<Reveal stagger>`. */
export function R({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  return (
    <Tag data-r data-reveal className={`opacity-0 ${className}`}>
      {children}
    </Tag>
  );
}
