"use client";
import { useEffect, useRef } from "react";

/**
 * Right-click actions for things on a page (a task, a note, a chat, a journal entry).
 * An element opts in with `ctxProps(kind, id, state)`; the site-wide context menu reads those attributes and offers the actions
 * for that kind; choosing one broadcasts an event that the feature owning the element handles with `useCtxActions`. The menu never
 * touches feature code or data itself, so each page keeps its own confirmations, optimistic updates and error handling.
 */
export type CtxKind = "task" | "note" | "chat" | "entry";
export type CtxDetail = { kind: CtxKind; id: string; action: string };

export const CTX_EVENT = "up:ctx-action";

export const runCtxAction = (d: CtxDetail) => window.dispatchEvent(new CustomEvent<CtxDetail>(CTX_EVENT, { detail: d }));

/** Spread onto the element: `<li {...ctxProps("task", t.id, { done: t.done })}>`. `state` decides which labels the menu shows. */
export const ctxProps = (kind: CtxKind, id: string, state?: Record<string, boolean>) => ({
  "data-ctx": kind,
  "data-ctx-id": id,
  ...(state ? { "data-ctx-state": JSON.stringify(state) } : {}),
});

/** Handle the actions chosen from the context menu for one kind. The latest handler is always used. */
export function useCtxActions(kind: CtxKind, handler: (id: string, action: string) => void) {
  const latest = useRef(handler);
  latest.current = handler;
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<CtxDetail>).detail;
      if (d.kind === kind) latest.current(d.id, d.action);
    };
    window.addEventListener(CTX_EVENT, on);
    return () => window.removeEventListener(CTX_EVENT, on);
  }, [kind]);
}
