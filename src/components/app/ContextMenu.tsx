"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowLeft,
  faArrowRight,
  faArrowRotateRight,
  faArrowUpRightFromSquare,
  faBookOpen,
  faCommentDots,
  faCopy,
  faHouse,
  faLink,
  faListCheck,
  faMagnifyingGlass,
  faNoteSticky,
  faPenToSquare,
  faRightToBracket,
  faTag,
  faCalendarDay,
  faCalendarPlus,
  faCircleCheck,
  faClone,
  faEnvelopeOpen,
  faPen,
  faRotateLeft,
  faThumbtack,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { api } from "../../lib/api/client";
import { openSearch } from "./UniversalSearch";
import { runCtxAction, type CtxKind } from "../../lib/context-actions";

type Entry = { label: string; icon: IconDefinition; run: () => void; danger?: boolean } | "sep" | { heading: string };

/** What can be done to a thing under the cursor. `s` is the state the page attached to it, which picks the right labels. */
const ITEM_ACTIONS: Record<
  CtxKind,
  { heading: string; items: (s: Record<string, boolean>) => [action: string, label: string, icon: IconDefinition, danger?: boolean][] }
> = {
  task: {
    heading: "To-do",
    items: (s) => [
      ["open", "Edit task", faPen],
      ["toggle", s.done ? "Mark as not done" : "Mark as done", s.done ? faRotateLeft : faCircleCheck],
      ["today", "Due today", faCalendarDay],
      ["tomorrow", "Due tomorrow", faCalendarPlus],
      ["delete", "Delete task", faTrash, true],
    ],
  },
  note: {
    heading: "Note",
    items: (s) => [
      ["open", "Open note", faPenToSquare],
      ["pin", s.pinned ? "Unpin note" : "Pin note", faThumbtack],
      ["duplicate", "Duplicate", faClone],
      ["delete", "Delete note", faTrash, true],
    ],
  },
  chat: {
    heading: "Chat",
    items: (s) => [
      ["open", "Open chat", faCommentDots],
      ["pin", s.pinned ? "Unpin chat" : "Pin chat", faThumbtack],
      ["rename", "Rename", faPen],
      ["read", s.unread ? "Mark as read" : "Mark as unread", faEnvelopeOpen],
      ["delete", "Delete chat", faTrash, true],
    ],
  },
  entry: {
    heading: "Journal entry",
    items: () => [
      ["edit", "Edit entry", faPen],
      ["delete", "Delete entry", faTrash, true],
    ],
  },
};
type Open = { x: number; y: number; entries: Entry[] };

// Places where the browser's own menu is useful (spell check, paste, dictionary) and must stay.
const NATIVE = 'input, textarea, select, [contenteditable="true"], [data-native-menu]';

const isAction = (e: Entry): e is Extract<Entry, { run: () => void }> => typeof e === "object" && "run" in e;

/**
 * Replaces the browser's right-click menu on every page with one that offers what the site can do: create things, jump between
 * sections, act on selected text or a link. Text fields keep the native menu (spell check, paste), and holding Shift always
 * brings the native menu back.
 */
export default function ContextMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [menu, setMenu] = useState<Open | null>(null);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const sb = useRef(api());

  const close = useCallback(() => setMenu(null), []);

  const build = useCallback(
    (target: HTMLElement): Entry[] => {
      const inApp = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
      const go = (path: string) => () => router.push(path);
      const out: Entry[] = [];

      // The most specific thing under the cursor comes first: a task, note, chat or journal entry.
      const thing = target.closest<HTMLElement>("[data-ctx]");
      const kind = thing?.dataset.ctx as CtxKind | undefined;
      const id = thing?.dataset.ctxId;
      if (inApp && kind && id && ITEM_ACTIONS[kind]) {
        let state: Record<string, boolean> = {};
        try {
          state = JSON.parse(thing?.dataset.ctxState ?? "{}") as Record<string, boolean>;
        } catch {
          /* no state: default labels */
        }
        const def = ITEM_ACTIONS[kind];
        out.push({ heading: def.heading });
        for (const [action, label, icon, danger] of def.items(state))
          out.push({ label, icon, danger, run: () => runCtxAction({ kind, id, action }) });
        out.push("sep");
      }

      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (link) {
        const url = new URL(link.href, window.location.href);
        const same = url.origin === window.location.origin;
        out.push(
          {
            label: "Open link",
            icon: faArrowUpRightFromSquare,
            run: () => (same ? router.push(url.pathname + url.search + url.hash) : window.open(url.href, "_blank", "noopener,noreferrer")),
          },
          { label: "Copy link address", icon: faLink, run: () => void navigator.clipboard?.writeText(url.href) },
          "sep",
        );
      }

      const text = window.getSelection()?.toString().trim() ?? "";
      if (text) {
        out.push({ label: "Copy", icon: faCopy, run: () => void navigator.clipboard?.writeText(text) });
        if (inApp) {
          out.push(
            { label: "Search the workspace", icon: faMagnifyingGlass, run: openSearch },
            {
              label: "Save selection as a note",
              icon: faNoteSticky,
              run: async () => {
                const first = text.split("\n")[0].slice(0, 60);
                const { data } = await sb.current
                  .from("notes")
                  .insert({ title: first, body: text.slice(0, 100000) })
                  .select("id")
                  .single();
                if (data?.id) router.push(`/dashboard/notes?note=${data.id as string}`);
              },
            },
            {
              label: "Add selection as a to-do",
              icon: faListCheck,
              run: async () => {
                const title = text.replace(/\s+/g, " ").slice(0, 300);
                const { data } = await sb.current.from("tasks").insert({ title }).select("id").single();
                if (data?.id) router.push(`/dashboard/todo?task=${data.id as string}`);
              },
            },
          );
        }
        out.push("sep");
      }

      if (inApp) {
        out.push(
          { heading: "Create" },
          { label: "New to-do", icon: faListCheck, run: go("/dashboard/todo?add=1") },
          { label: "New note", icon: faPenToSquare, run: go("/dashboard/notes?new=1") },
          { label: "Write in journal", icon: faBookOpen, run: go("/dashboard/journal") },
          { label: "New chat", icon: faCommentDots, run: go("/dashboard/chat") },
          { label: "Search", icon: faMagnifyingGlass, run: openSearch },
          "sep",
          { heading: "Go to" },
          { label: "Home", icon: faHouse, run: go("/dashboard") },
          { label: "Journal", icon: faBookOpen, run: go("/dashboard/journal") },
          { label: "Chat", icon: faCommentDots, run: go("/dashboard/chat") },
          { label: "Notes", icon: faPenToSquare, run: go("/dashboard/notes") },
          { label: "To-do", icon: faListCheck, run: go("/dashboard/todo") },
        );
      } else {
        out.push(
          { heading: "Explore" },
          { label: "Home", icon: faHouse, run: go("/") },
          { label: "How it works", icon: faBookOpen, run: go("/how-it-works") },
          { label: "Pricing", icon: faTag, run: go("/pricing") },
          { label: "Open the app", icon: faRightToBracket, run: go("/dashboard") },
        );
      }
      out.push(
        "sep",
        { label: "Back", icon: faArrowLeft, run: () => window.history.back() },
        { label: "Forward", icon: faArrowRight, run: () => window.history.forward() },
        { label: "Reload", icon: faArrowRotateRight, run: () => window.location.reload() },
      );
      return out;
    },
    [pathname, router],
  );

  useEffect(() => {
    const onMenu = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t || e.shiftKey || t.closest(NATIVE)) return;
      e.preventDefault();
      setActive(-1);
      setMenu({ x: e.clientX, y: e.clientY, entries: build(t) });
    };
    document.addEventListener("contextmenu", onMenu);
    return () => document.removeEventListener("contextmenu", onMenu);
  }, [build]);

  // Close on anything that makes the position stale.
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: Event) => {
      if (!box.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("blur", close);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("blur", close);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [menu, close]);

  useEffect(() => close(), [pathname, close]);

  // Keep the menu fully on screen, flipping to the other side of the cursor when it would overflow.
  useEffect(() => {
    const el = box.current;
    if (!menu || !el) return;
    const { width, height } = el.getBoundingClientRect();
    const pad = 8;
    const left = menu.x + width + pad > window.innerWidth ? Math.max(pad, menu.x - width) : menu.x;
    const top = menu.y + height + pad > window.innerHeight ? Math.max(pad, window.innerHeight - height - pad) : menu.y;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.visibility = "visible";
    el.focus({ preventScroll: true });
  }, [menu]);

  if (!menu) return null;
  const actions = menu.entries.filter(isAction);
  const choose = (a: Extract<Entry, { run: () => void }>) => {
    close();
    a.run();
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return close();
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const d = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + d + actions.length) % actions.length);
    } else if (e.key === "Enter" && actions[active]) {
      e.preventDefault();
      choose(actions[active]);
    }
  };

  let n = -1;
  return (
    <div
      ref={box}
      role="menu"
      aria-label="Page actions"
      tabIndex={-1}
      data-no-swipe
      className="mn fixed z-[300] outline-none"
      style={{ left: menu.x, top: menu.y, visibility: "hidden", maxHeight: "calc(100dvh - 16px)" }}
      onKeyDown={onKey}
      onContextMenu={(e) => e.preventDefault()}
    >
      {menu.entries.map((e, i) => {
        if (e === "sep") return <div key={i} className="mn-sep" role="separator" />;
        if ("heading" in e)
          return (
            <div key={i} className="mn-label" role="presentation">
              {e.heading}
            </div>
          );
        n += 1;
        const idx = n;
        return (
          <button
            key={i}
            type="button"
            role="menuitem"
            className="mn-item w-full text-left"
            data-highlighted={idx === active ? "" : undefined}
            data-danger={e.danger}
            onMouseEnter={() => setActive(idx)}
            onClick={() => choose(e)}
          >
            <span>
              <FA icon={e.icon} /> {e.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
