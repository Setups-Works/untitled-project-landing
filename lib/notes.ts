import type { Note } from "./workspace";
import { readPrefs } from "./prefs";

export const CATEGORIES = ["Others", "Ideas & Creativity", "Personal", "Work", "Learning", "Health"];

/** The site's tints. A note uses its chosen colour, or one picked from its id so the grid is always multi-coloured. */
export const TONES = ["violet", "blue", "green", "amber", "clay", "mint", "gold", "sand"] as const;
export const toneOf = (n: Pick<Note, "id" | "color">) => {
  if (n.color && (TONES as readonly string[]).includes(n.color)) return n.color;
  let h = 0;
  for (const c of n.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TONES[h % (TONES.length - 1)]; // skip plain sand for the automatic pick
};

export const NOTE_COLS = "id,title,body,updated_at,created_at,category,pinned,kind,sort_order,attachments,color";

export const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);
/** Every line in the text, blank ones included — what you see in the editor. An empty note has 0. */
export const lineCount = (s: string) => (s ? s.split("\n").length : 0);
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export const displayTitle = (n: Pick<Note, "title" | "body">) =>
  n.title.trim() ||
  n.body.split("\n").find((l) => l.trim())?.replace(/^[#>\-*\s]+(\[[ x]\]\s*)?/, "").slice(0, 80) ||
  "Untitled";

export function editedLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return readPrefs().timeFormat === "24h"
      ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })
      : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}) });
}

export const safeName = (n: string) => n.replace(/[^\w.\- ]+/g, "_").slice(0, 80) || "file";
