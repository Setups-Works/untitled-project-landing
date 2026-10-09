"use client";
import { useEffect, useRef } from "react";
import styles from "./GiftCard.module.css";
import { downloadGiftCard } from "./giftCardImage";

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const pct = (v: number) => `${Number((v * 100).toFixed(3))}%`;

/**
 * A welcome gift: an iridescent foil card with the logo on top and the member's name engraved on it.
 * The foil colour and glare follow the pointer and the page scroll (technique from dqnamo.com's Iridescent Foil).
 * With reduced motion (OS setting or the in-app "Reduce motion") the card stays still.
 */
/** The resolved font stack for a CSS variable (a canvas cannot read `var(--x)` itself). */
function fontStack(variable: string, fallback: string) {
  const probe = document.createElement("span");
  probe.style.fontFamily = `var(${variable})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).fontFamily;
  probe.remove();
  return resolved || fallback;
}

/** Saves the card as a PNG, using the page's own serif and mono fonts so it matches what is on screen. */
export function saveGiftCard(name: string) {
  return downloadGiftCard(name, { serif: fontStack("--serif", "Georgia, serif"), mono: fontStack("--mono", "monospace") });
}

export default function GiftCard({ name }: { name: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = ref.current;
    if (!card) return;
    const still =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduce";
    if (still) return;

    let frame: number | null = null;
    let x = 0.5;
    let y = 0.5;
    const apply = () => {
      frame = null;
      const rect = card.getBoundingClientRect();
      const scroll = clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height || 1), 0, 1);
      const s = card.style;
      s.setProperty("--foil-shift", pct(scroll * 0.82 + (x - 0.5) * 0.18));
      s.setProperty("--foil-y-shift", pct(scroll * 0.28 + (y - 0.5) * 0.12));
      s.setProperty("--glare-x", pct(x));
      s.setProperty("--glare-y", pct(y));
      s.setProperty("--pointer-x", pct(x));
      s.setProperty("--pointer-y", pct(y));
      s.setProperty("--shine-angle", `${(105 + scroll * 80 + (x - 0.5) * 28).toFixed(2)}deg`);
      s.setProperty("--shine-opacity", (0.56 + Math.abs(x - 0.5) * 0.24 + scroll * 0.12).toFixed(3));
      s.setProperty("--tilt-x", `${((0.5 - y) * 10).toFixed(2)}deg`);
      s.setProperty("--tilt-y", `${((x - 0.5) * 12).toFixed(2)}deg`);
    };
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(apply);
    };
    const move = (e: PointerEvent) => {
      const r = card.getBoundingClientRect();
      x = r.width ? clamp((e.clientX - r.left) / r.width, 0.08, 0.92) : 0.5;
      y = r.height ? clamp((e.clientY - r.top) / r.height, 0.08, 0.92) : 0.5;
      schedule();
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className={styles.card} role="img" aria-label={`Welcome gift card for ${name}`}>
      <span aria-hidden className={styles.foil} />
      <span aria-hidden className={styles.film} />
      <span aria-hidden className={styles.pearl} />
      <div className={styles.content} aria-hidden>
        <div className={styles.brand}>
          <span className={styles.dot} />
          untitled project
          <span className={styles.tag}>Welcome gift</span>
        </div>
        <p className={styles.name}>{name}</p>
        <div className={styles.foot}>Your workspace, your way</div>
      </div>
      <span aria-hidden className={styles.shine} />
      <span aria-hidden className={styles.glare} />
    </div>
  );
}
