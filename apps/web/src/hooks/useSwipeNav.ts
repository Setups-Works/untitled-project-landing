"use client";
import { useEffect, useRef } from "react";

/** Places where a sideways finger movement means something else (typing, scrubbing audio, scrolling a board, a popup). */
const BLOCKED = 'input, textarea, select, [contenteditable="true"], [role="slider"], canvas, audio, video, [data-no-swipe], [role="menu"]';
const MIN_DISTANCE = 70; // px sideways
const MAX_TIME = 700; // ms

/** Is `el`, or something around it, a container that scrolls sideways (e.g. the journal day strip or a board)? */
function scrollsSideways(el: Element | null) {
  for (let n: Element | null = el; n && n !== document.body; n = n.parentElement) {
    if (n.scrollWidth > n.clientWidth + 2 && /(auto|scroll)/.test(getComputedStyle(n).overflowX)) return true;
  }
  return false;
}

/**
 * Swipe sideways to move between the app's sections on a touch screen: swipe left for the next section, right for the
 * previous one. It ignores swipes that start on inputs, audio scrubbers, sideways-scrolling areas or while a dialog is open,
 * so it never fights with typing, scrolling or dragging inside a page.
 *
 *   useSwipeNav(index, TABS.length, (to) => router.push(TABS[to].href));
 */
export function useSwipeNav(index: number, count: number, go: (to: number) => void) {
  const state = useRef({ index, count, go });
  state.current = { index, count, go };

  useEffect(() => {
    let start: { x: number; y: number; t: number } | null = null;

    const onStart = (e: TouchEvent) => {
      const t = e.target instanceof Element ? e.target : null;
      const blocked =
        e.touches.length !== 1 ||
        !t ||
        t.closest(BLOCKED) ||
        scrollsSideways(t) ||
        document.querySelector('[role="dialog"], [role="alertdialog"]');
      start = blocked ? null : { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
    };

    const onEnd = (e: TouchEvent) => {
      if (!start) return;
      const dx = e.changedTouches[0].clientX - start.x;
      const dy = e.changedTouches[0].clientY - start.y;
      const quick = Date.now() - start.t < MAX_TIME;
      start = null;
      if (!quick || Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.8) return;
      const { index: i, count: n, go: move } = state.current;
      if (i < 0) return; // not on one of the sections
      const to = dx < 0 ? i + 1 : i - 1;
      if (to >= 0 && to < n) move(to);
    };

    const cancel = () => (start = null);
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    document.addEventListener("touchcancel", cancel, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", cancel);
    };
  }, []);
}
