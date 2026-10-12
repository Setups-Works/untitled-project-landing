"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * The interactive cursor: a small dot that sticks to the pointer and a soft glass ring that trails it. The ring swells over links
 * and buttons, and over anything marked `data-cursor="Label"` it grows into a labelled bubble ("Play", "Open"…). It sits on top of
 * the normal cursor (never replaces it), only exists for fine pointers, and is off in reduced-motion mode.
 */
export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const r = ring.current;
    const d = dot.current;
    const l = label.current;
    if (!r || !d || !l) return;
    const mm = gsap.matchMedia();
    mm.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      if (document.documentElement.dataset.motion === "reduce") return;
      gsap.set([r, d], { xPercent: -50, yPercent: -50, autoAlpha: 0 });
      const rx = gsap.quickTo(r, "x", { duration: 0.55, ease: "power3" });
      const ry = gsap.quickTo(r, "y", { duration: 0.55, ease: "power3" });
      const dx = gsap.quickTo(d, "x", { duration: 0.12, ease: "power3" });
      const dy = gsap.quickTo(d, "y", { duration: 0.12, ease: "power3" });
      let shown = false;
      const show = (on: boolean) => {
        if (on === shown) return;
        shown = on;
        gsap.to([r, d], { autoAlpha: on ? 1 : 0, duration: 0.25, overwrite: "auto" });
      };
      const state = (scale: number, text = "") => {
        l.textContent = text;
        gsap.to(r, { scale, duration: 0.45, ease: "back.out(1.6)", overwrite: "auto" });
        gsap.to(l, { autoAlpha: text ? 1 : 0, duration: 0.2 });
        gsap.to(d, { scale: text ? 0 : scale > 1 ? 0.4 : 1, duration: 0.25 });
      };
      const move = (e: PointerEvent) => {
        show(true);
        rx(e.clientX);
        ry(e.clientY);
        dx(e.clientX);
        dy(e.clientY);
      };
      const over = (e: PointerEvent) => {
        const t = e.target as Element | null;
        const tagged = t?.closest<HTMLElement>("[data-cursor]");
        if (tagged) return state(2.7, tagged.dataset.cursor);
        if (t?.closest("input,textarea,select,[contenteditable=true]")) return state(0.5);
        if (t?.closest("a,button,summary,[role=button],[role=tab]")) return state(1.9);
        state(1);
      };
      const down = () => gsap.to(r, { scale: "-=0.35", duration: 0.2, overwrite: "auto" });
      const up = (e: PointerEvent) => over(e);
      const leave = () => show(false);
      window.addEventListener("pointermove", move, { passive: true });
      window.addEventListener("pointerover", over, { passive: true });
      window.addEventListener("pointerdown", down);
      window.addEventListener("pointerup", up);
      document.documentElement.addEventListener("pointerleave", leave);
      return () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerover", over);
        window.removeEventListener("pointerdown", down);
        window.removeEventListener("pointerup", up);
        document.documentElement.removeEventListener("pointerleave", leave);
        gsap.set([r, d], { autoAlpha: 0 });
      };
    });
    return () => mm.revert();
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed top-0 left-0 z-[300] hidden [@media(pointer:fine)]:block">
      <div
        ref={ring}
        className="absolute grid size-11 place-items-center rounded-full border border-white bg-white/10 opacity-0 mix-blend-difference backdrop-blur-[1px]"
      >
        <span
          ref={label}
          // design-ok: scaled ~2.7x by the ring it sits in, so it renders at about 13px
          className="px-1 text-center text-[5px] font-semibold tracking-[0.04em] whitespace-nowrap text-white uppercase opacity-0"
        />
      </div>
      <div ref={dot} className="absolute size-1.5 rounded-full bg-white opacity-0 mix-blend-difference" />
    </div>
  );
}
