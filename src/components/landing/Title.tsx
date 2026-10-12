"use client";
import { SplitText } from "gsap/SplitText";
import { useRef, type ReactNode } from "react";
import { fontsReady, showNow, useMotion } from "./motion";

const SIZES = {
  display: "text-[clamp(40px,6.6vw,76px)] leading-[1.01] tracking-[-0.035em]",
  h2: "text-[clamp(31px,4.6vw,54px)] leading-[1.04] tracking-[-0.03em]",
  h3: "text-[clamp(22px,2.5vw,28px)] leading-[1.16] tracking-[-0.022em]",
} as const;

/**
 * The serif display heading with an italic green "quiet" tail. The words rise out of a mask line by line (GSAP SplitText) — on
 * load for `display`, on scroll for the rest. SplitText keeps the heading readable to screen readers.
 */
export function Title({
  children,
  quiet,
  as: Tag = "h2",
  size = "h2",
  dark = false,
  className = "",
  onLoad = false,
}: {
  children?: ReactNode;
  quiet?: string;
  as?: "h1" | "h2" | "h3";
  size?: keyof typeof SIZES;
  dark?: boolean;
  className?: string;
  /** Animate immediately instead of waiting to scroll into view (the hero heading). */
  onLoad?: boolean;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useMotion(ref, ({ g, root, calm }) => {
    if (calm) return void showNow(g, root);
    let split: SplitText | undefined;
    let dead = false;
    void fontsReady().then(() => {
      if (dead) return;
      split = new SplitText(root, { type: "lines,words", mask: "lines", linesClass: "title-line", wordsClass: "title-word" });
      g.set(root, { autoAlpha: 1 });
      g.from(split.words, {
        yPercent: 115,
        rotate: 4,
        duration: 1.1,
        ease: "power4.out",
        stagger: 0.045,
        scrollTrigger: onLoad ? undefined : { trigger: root, start: "top 88%", once: true },
      });
    });
    return () => {
      dead = true;
      split?.revert();
    };
  });
  return (
    <Tag ref={ref} data-reveal className={`font-serif font-normal text-balance opacity-0 ${SIZES[size]} ${className}`}>
      {children}
      {quiet && (
        <>
          {" "}
          <span className={`italic ${dark ? "text-on-dark/70" : "text-green-fg"}`}>{quiet}</span>
        </>
      )}
    </Tag>
  );
}
