"use client";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cleanOrder, moveItem } from "@untitled/logic/homeLayout";

/** The Home cards by column, in their default order. A person's own order is saved in this browser. */
export const HOME_COLUMNS = {
  main: ["invites", "today", "journal", "notes", "chats", "insights"],
  side: ["schedule", "reader", "health"],
} as const;

export type HomeColumn = keyof typeof HOME_COLUMNS;
type Layout = Record<HomeColumn, string[]>;

const KEY = "up_home_layout";
const COLUMNS = Object.keys(HOME_COLUMNS) as HomeColumn[];

function read(): Layout {
  let saved: Partial<Record<HomeColumn, unknown>> = {};
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as unknown;
    if (raw && typeof raw === "object") saved = raw as typeof saved;
  } catch {
    /* storage unavailable or damaged: use the default order */
  }
  return { main: cleanOrder(saved.main, HOME_COLUMNS.main), side: cleanOrder(saved.side, HOME_COLUMNS.side) };
}

/**
 * Drag-to-reorder for the Home cards. A card moves when the pointer passes the middle of its neighbour (so a tall card can't make
 * two cards swap back and forth), and the arrow keys do the same from the handle so it works without a pointer. Cards stay in
 * their column; each column keeps its own order.
 */
export function useHomeLayout() {
  const [layout, setLayout] = useState<Layout>(read);
  const [dragging, setDragging] = useState<string | null>(null);
  const latest = useRef(layout);
  const refocus = useRef<string | null>(null);

  useEffect(() => {
    if (!refocus.current) return;
    document.querySelector<HTMLElement>(`[data-drag-handle="${refocus.current}"]`)?.focus();
    refocus.current = null;
  });

  const place = useCallback((col: HomeColumn, id: string, overId: string) => {
    const ids = latest.current[col];
    const next = { ...latest.current, [col]: moveItem(ids, ids.indexOf(id), ids.indexOf(overId)) };
    latest.current = next;
    setLayout(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const columnOf = (id: string): HomeColumn => COLUMNS.find((c) => layout[c].includes(id)) ?? "main";
  const cardsIn = (col: HomeColumn) => [...document.querySelectorAll<HTMLElement>(`[data-home-col="${col}"] > [data-drag-id]`)];

  /** Props for a card's drag handle. */
  const handleProps = (id: string) => {
    const col = columnOf(id);
    return {
      "data-drag-handle": id,
      onPointerDown: (e: PointerEvent<HTMLElement>) => {
        if (e.button !== 0) return;
        e.preventDefault();
        setDragging(id);
        const move = (ev: globalThis.PointerEvent) => {
          const cards = cardsIn(col);
          const from = cards.findIndex((c) => c.dataset.dragId === id);
          const over = cards.findIndex((c) => {
            const r = c.getBoundingClientRect();
            return ev.clientY >= r.top && ev.clientY <= r.bottom;
          });
          if (from < 0 || over < 0 || over === from) return;
          const r = cards[over].getBoundingClientRect();
          const past = over > from ? ev.clientY > r.top + r.height / 2 : ev.clientY < r.top + r.height / 2;
          if (past) place(col, id, cards[over].dataset.dragId ?? id);
        };
        const end = () => {
          setDragging(null);
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", end);
          window.removeEventListener("pointercancel", end);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", end);
        window.addEventListener("pointercancel", end);
      },
      onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
        e.preventDefault();
        const cards = cardsIn(col);
        const from = cards.findIndex((c) => c.dataset.dragId === id);
        const target = cards[from + (e.key === "ArrowUp" ? -1 : 1)];
        if (!target?.dataset.dragId) return;
        refocus.current = id;
        place(col, id, target.dataset.dragId);
      },
    };
  };

  return { layout, dragging, handleProps };
}
