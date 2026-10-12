"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useEffect, type RefObject } from "react";

let ready = false;
/** Registers the GSAP plugins once, in the browser only. */
export function initGsap() {
  if (!ready && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    ready = true;
  }
  return gsap;
}

export type MotionCtx = {
  g: typeof gsap;
  root: HTMLElement;
  /** True when the visitor asked for less motion (OS setting or the app's "Reduce motion"): show content, skip the choreography. */
  calm: boolean;
};

/**
 * Runs `setup` with GSAP scoped to `ref` and cleans every tween and ScrollTrigger up afterwards. It re-runs when the OS
 * reduced-motion setting changes. In calm mode `setup` should only make sure content is visible.
 */
export function useMotion(ref: RefObject<HTMLElement | null>, setup: (c: MotionCtx) => void | (() => void), deps: unknown[] = []) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const g = initGsap();
    const mm = g.matchMedia();
    mm.add(
      { ok: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" },
      (ctx) => {
        const calm = Boolean(ctx.conditions?.reduce) || document.documentElement.dataset.motion === "reduce";
        return setup({ g, root, calm });
      },
      root,
    );
    return () => mm.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Elements start hidden (`opacity-0 data-reveal`) so there is no flash before the animation; calm mode just shows them. */
export const showNow = (g: typeof gsap, targets: gsap.TweenTarget) => g.set(targets, { autoAlpha: 1, clearProps: "transform" });

/** Waits for web fonts so SplitText measures the real line breaks. */
export const fontsReady = () => (typeof document !== "undefined" && document.fonts ? document.fonts.ready : Promise.resolve());
