import { addDays } from "./dates";
import { plainEntryText } from "./entryCard";

/**
 * Helpers for the cards a chat reply can ask the app to show (see ShowItem in @untitled/validation/chat-actions): which tasks a scope
 * means, what a card says, and where its Open button goes. Pure, so the web and the app agree.
 */
export const SHOW_LIMITS = {
  /** Items listed in one card group; the Open button reaches the rest. */
  items: 5,
  /** How far ahead "upcoming" looks, in days. */
  upcomingDays: 14,
  /** Characters of an entry or note a card previews. */
  preview: 160,
} as const;

export type ShowTask = { id: string; title: string; due_date: string | null; done: boolean; cancelled?: boolean; archived?: boolean };
export type TaskScope = "today" | "overdue" | "upcoming" | "open";

/** The open to-dos a scope means, soonest first (undated last), at most `limit`; `total` is how many matched before cutting. */
export function tasksInScope<T extends ShowTask>(tasks: T[], scope: TaskScope, today: string, limit: number = SHOW_LIMITS.items) {
  const horizon = addDays(today, SHOW_LIMITS.upcomingDays);
  const open = tasks.filter((t) => !t.done && !t.cancelled && !t.archived);
  const picked = open.filter((t) => {
    if (scope === "open") return true;
    if (!t.due_date) return false;
    if (scope === "today") return t.due_date === today;
    if (scope === "overdue") return t.due_date < today;
    return t.due_date > today && t.due_date <= horizon;
  });
  picked.sort((a, b) => (a.due_date ?? "9999-12-31").localeCompare(b.due_date ?? "9999-12-31") || a.title.localeCompare(b.title));
  return { items: picked.slice(0, limit), total: picked.length };
}

export type ShowNote = { id: string; title: string; body: string; updated_at: string };

/** Notes whose title or text contains every word of the query (any case); no query means the latest notes. Newest first. */
export function notesMatching<T extends ShowNote>(notes: T[], query: string | undefined, limit: number = SHOW_LIMITS.items) {
  const words = (query ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  const matched = notes.filter((n) => {
    const hay = `${n.title}\n${n.body}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
  matched.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  return { items: matched.slice(0, limit), total: matched.length };
}

/** A short plain-text preview of Markdown for a card. */
export function previewOf(markdown: string, max: number = SHOW_LIMITS.preview): string {
  const flat = plainEntryText(markdown).replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

export const TASK_SCOPE_LABEL: Record<TaskScope, string> = {
  today: "To-dos for today",
  overdue: "Overdue to-dos",
  upcoming: "Upcoming to-dos",
  open: "Open to-dos",
};
