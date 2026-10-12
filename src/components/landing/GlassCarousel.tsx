"use client";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import gsap from "gsap";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { WRAP } from "./Kit";

export type Slide = { key: string; label: string; className?: string; node: ReactNode };

const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduce";

/**
 * A horizontal scroll-snap carousel in liquid glass. It runs edge to edge but lines up with the page column, and works every way
 * a carousel should: drag or swipe, mouse wheel / trackpad, arrow buttons, dots, and ← → on the keyboard. The slide nearest the
 * left edge is the active one; the others sit slightly smaller and softer, which GSAP eases as you scroll.
 * Dragging starts only on empty glass, so the buttons and tiles inside a slide stay clickable.
 */
export function GlassCarousel({ label, slides }: { label: string; slides: Slide[] }) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [active, setActive] = useState(0);
  const last = slides.length - 1;

  const cards = () => [...(track.current?.children ?? [])] as HTMLElement[];
  const inset = () => parseFloat(getComputedStyle(track.current as HTMLElement).paddingLeft) || 0;

  /** Which slide is first in view, and how far each one is from that spot (drives the focus effect). */
  const sync = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const left = el.scrollLeft + inset();
    let best = 0;
    let bestD = Infinity;
    cards().forEach((c, k) => {
      const d = Math.abs(c.offsetLeft - left);
      if (d < bestD) {
        bestD = d;
        best = k;
      }
      if (!calm()) {
        const t = Math.min(1, d / (c.offsetWidth * 1.4));
        gsap.set(c, { scale: 1 - 0.06 * t, opacity: 1 - 0.35 * t });
      }
    });
    setActive(best);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [sync]);

  const goTo = (k: number) => {
    const el = track.current;
    const target = cards()[Math.max(0, Math.min(last, k))];
    if (el && target) el.scrollTo({ left: target.offsetLeft - inset(), behavior: calm() ? "auto" : "smooth" });
  };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || (e.target as HTMLElement).closest("button,a,input,[role=checkbox]")) return;
    const el = track.current as HTMLDivElement;
    drag.current = { x: e.clientX, left: el.scrollLeft, moved: false };
    el.style.scrollSnapType = "none";
    el.style.scrollBehavior = "auto";
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) d.moved = true;
    (track.current as HTMLDivElement).scrollLeft = d.left - dx;
  };
  const up = () => {
    const el = track.current as HTMLDivElement;
    if (!drag.current) return;
    drag.current = null;
    el.style.scrollSnapType = "";
    el.style.scrollBehavior = "";
    goTo(active);
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") (e.preventDefault(), goTo(active + 1));
    if (e.key === "ArrowLeft") (e.preventDefault(), goTo(active - 1));
  };

  const arrow =
    "liquid-pill grid size-12 place-items-center rounded-full text-[15px] text-fg transition-[transform,opacity] duration-300 hover:-translate-y-0.5 active:scale-90 disabled:pointer-events-none disabled:opacity-35";
  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2">
      <div
        ref={track}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={0}
        onScroll={sync}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        onPointerCancel={up}
        onKeyDown={key}
        data-cursor="Drag"
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pt-2 pb-8 pl-[calc(max(0px,(100vw-var(--container))/2)+var(--gutter))] pr-[calc(max(0px,(100vw-var(--container))/2)+var(--gutter))] [scroll-padding-left:calc(max(0px,(100vw-var(--container))/2)+var(--gutter))] [mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)] [scrollbar-width:none] select-none max-sm:[mask-image:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((s, k) => (
          <div
            key={s.key}
            role="group"
            aria-roledescription="slide"
            aria-label={`${k + 1} of ${slides.length}: ${s.label}`}
            className={`shrink-0 snap-start will-change-transform ${s.className ?? "w-[min(86vw,400px)]"}`}
          >
            {s.node}
          </div>
        ))}
      </div>

      <div className={`${WRAP} flex items-center justify-between gap-6`}>
        <div className="flex items-center gap-2" role="tablist" aria-label={`${label}: choose a slide`}>
          {slides.map((s, k) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={k === active}
              aria-label={s.label}
              onClick={() => goTo(k)}
              className={`h-2 rounded-full transition-[width,background-color] duration-500 ease-site ${k === active ? "w-8 bg-fg" : "w-2 bg-fg/20 hover:bg-fg/40"}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          <span className="mr-1 hidden text-[13px] text-fg-subtle tabular-nums sm:inline" aria-live="polite">
            {active + 1} / {slides.length}
          </span>
          <button type="button" aria-label="Previous slide" disabled={active === 0} onClick={() => goTo(active - 1)} className={arrow}>
            <FA icon={faChevronLeft} />
          </button>
          <button type="button" aria-label="Next slide" disabled={active === last} onClick={() => goTo(active + 1)} className={arrow}>
            <FA icon={faChevronRight} />
          </button>
        </div>
      </div>
    </div>
  );
}
