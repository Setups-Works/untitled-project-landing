"use client";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type SectionTab = { href: string; t: string; icon: IconDefinition };

/** Index of the tab whose box is under a horizontal position (clamped to the nearest end when outside the pill). */
function tabUnder(nav: HTMLElement | null, x: number) {
  const links = Array.from(nav?.querySelectorAll("a") ?? []);
  if (!links.length) return 0;
  const hit = links.findIndex((a) => {
    const r = a.getBoundingClientRect();
    return x >= r.left && x <= r.right;
  });
  if (hit >= 0) return hit;
  return x < links[0].getBoundingClientRect().left ? 0 : links.length - 1;
}

const SPRING = "ease-[cubic-bezier(0.34,1.45,0.5,1)]";

/**
 * The section switcher, drawn as liquid glass: a frosted pill with a glass "lens" over the current section.
 * The lens springs to the next section with a little squash-and-stretch, and you can pick it up and drag it across the pill —
 * it swells, follows your finger or mouse, and snaps (and opens the page) when you let go. A plain click still works.
 */
export default function SectionTabs({ tabs, current, onGo }: { tabs: SectionTab[]; current: number; onGo: (href: string) => void }) {
  const nav = useRef<HTMLElement>(null);
  const lens = useRef<HTMLSpanElement>(null);
  const jelly = useRef<HTMLSpanElement>(null);
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  const dragged = useRef(false);
  const placed = useRef(false);
  const [preview, setPreview] = useState<number | null>(null);
  const [holding, setHolding] = useState(false);
  const shown = preview ?? current;

  /** Moves the lens over tab `i`; with `followX` it tracks the pointer instead (clamped to the pill). */
  const place = useCallback((i: number, followX?: number) => {
    const n = nav.current;
    const l = lens.current;
    const links = n?.querySelectorAll<HTMLAnchorElement>("a");
    const a = links?.[i];
    if (!n || !l || !links || !a) return;
    let x = a.offsetLeft;
    if (followX !== undefined) {
      const last = links[links.length - 1];
      const min = links[0].offsetLeft;
      const max = last.offsetLeft + last.offsetWidth - a.offsetWidth;
      x = Math.min(max, Math.max(min, followX - n.getBoundingClientRect().left + n.scrollLeft - a.offsetWidth / 2));
      l.style.transition = "transform 60ms linear, width 0.3s, height 0.3s"; // sticks to the finger
    } else l.style.transition = "";
    l.style.width = `${a.offsetWidth}px`;
    l.style.height = `${a.offsetHeight}px`;
    l.style.top = `${a.offsetTop}px`;
    l.style.transform = `translateX(${x}px)`;
  }, []);

  // Slide to the shown section. The very first placement (page load) happens without animation.
  useLayoutEffect(() => {
    if (drag.current?.moved) return;
    const l = lens.current;
    if (!placed.current && l) {
      l.style.transition = "none";
      place(shown);
      l.style.transition = "none";
      requestAnimationFrame(() => (l.style.transition = ""));
      placed.current = true;
      return;
    }
    place(shown);
    // Squash and stretch as it travels.
    jelly.current?.animate(
      [
        { transform: "scale(1, 1)" },
        { transform: "scale(1.2, 0.9)", offset: 0.35 },
        { transform: "scale(0.97, 1.04)", offset: 0.7 },
        { transform: "scale(1, 1)" },
      ],
      { duration: 560, easing: "ease-out" },
    );
  }, [shown, place]);

  // Keep the lens on its tab when the pill changes size (window resize, fonts loading, labels hiding on small screens).
  useEffect(() => {
    const n = nav.current;
    if (!n) return;
    const fit = () => {
      const l = lens.current;
      if (!l) return;
      l.style.transition = "none";
      place(shown);
      requestAnimationFrame(() => (l.style.transition = ""));
    };
    const ro = new ResizeObserver(fit);
    ro.observe(n);
    void document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [shown, place]);

  return (
    <nav
      ref={nav}
      aria-label="Workspace"
      className="ap-tabs relative touch-none bg-white/60 backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.85),inset_0_1px_3px_rgba(27,28,20,0.06),0_10px_30px_-14px_rgba(27,28,20,0.3)]"
      onPointerDown={(e) => {
        if (e.button === 0) drag.current = { x: e.clientX, moved: false };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        if (!d.moved && Math.abs(e.clientX - d.x) > 8) {
          d.moved = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          setHolding(true);
        }
        if (d.moved) {
          const i = tabUnder(nav.current, e.clientX);
          setPreview(i);
          place(i, e.clientX);
        }
      }}
      onPointerUp={() => {
        const d = drag.current;
        drag.current = null;
        setHolding(false);
        if (d?.moved) {
          // The click that follows a drag must not also navigate to whatever is under the pointer.
          dragged.current = true;
          setTimeout(() => (dragged.current = false), 0);
          if (preview !== null && preview !== current) onGo(tabs[preview].href);
          place(preview ?? current); // let go: spring into place
        }
        setPreview(null);
      }}
      onPointerCancel={() => {
        drag.current = null;
        setHolding(false);
        setPreview(null);
        place(current);
      }}
    >
      {/* The glass lens. Its position and size are set from the tab under it (see place()). */}
      <span
        ref={lens}
        aria-hidden
        className={`pointer-events-none absolute top-0 left-0 z-0 rounded-full transition-[transform,width,height,top] duration-[550ms] ${SPRING} motion-reduce:transition-none [html[data-motion=reduce]_&]:transition-none`}
      >
        <span
          ref={jelly}
          className={`relative block size-full rounded-full bg-linear-to-b from-white/95 via-white/70 to-white/50 backdrop-blur-md backdrop-saturate-200 transition-[scale,box-shadow] duration-300 ${SPRING} ${
            holding
              ? "shadow-[inset_0_1px_0_#fff,inset_0_0_0_1px_rgba(255,255,255,0.9),inset_0_-2px_6px_rgba(31,93,73,0.12),0_14px_30px_-8px_rgba(27,28,20,0.45),0_3px_8px_rgba(27,28,20,0.16)]"
              : "shadow-[inset_0_1px_0_#fff,inset_0_0_0_1px_rgba(255,255,255,0.75),inset_0_-1px_2px_rgba(27,28,20,0.07),0_6px_18px_-8px_rgba(27,28,20,0.4),0_1px_3px_rgba(27,28,20,0.14)]"
          }`}
          style={{ scale: holding ? "1.14 1.22" : "1" }}
        >
          {/* specular highlight along the top edge */}
          <span className="absolute inset-x-[14%] top-[6%] h-[34%] rounded-full bg-linear-to-b from-white/90 to-transparent" />
          {/* faint green tint along the bottom edge, picking up the site accent */}
          <span className="absolute inset-x-[10%] bottom-[5%] h-[28%] rounded-full bg-linear-to-t from-[#1f5d49]/10 to-transparent" />
        </span>
      </span>

      {tabs.map((t, i) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={i === shown ? "page" : undefined}
          onClick={(e) => dragged.current && e.preventDefault()}
          draggable={false}
          className="relative z-10 transition-colors hover:bg-transparent hover:text-fg aria-[current=page]:bg-transparent aria-[current=page]:font-semibold aria-[current=page]:text-fg"
        >
          <FA icon={t.icon} /> <span>{t.t}</span>
        </Link>
      ))}
    </nav>
  );
}
