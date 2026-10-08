import { z } from "zod";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
/** A short label a journal draft uses to point at a to-do or note draft from the same reply (see `[[text|ref]]` below). */
const ref = z
  .string()
  .regex(/^[a-z0-9]{1,12}$/)
  .optional();

export const chatActionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("note"), title: z.string().trim().min(1).max(200), body: z.string().max(10_000), ref }),
  z.object({ kind: z.literal("journal"), body: z.string().min(1).max(10_000), entry_date: date }),
  z.object({
    kind: z.literal("task"),
    title: z.string().trim().min(1).max(300),
    description: z.string().max(5000),
    due_date: date.nullable(),
    /** How a repeating to-do repeats ("monthly", or "nth:2:wed" for the 2nd Wednesday of every month); absent for a one-off. */
    recurrence: z
      .string()
      .regex(/^(daily|weekdays|weekly|monthly|yearly|nth:[1-4]:(sun|mon|tue|wed|thu|fri|sat))$/)
      .nullish(),
    ref,
  }),
]);

export type ChatAction = z.infer<typeof chatActionSchema>;

/** What a draft turned into once the user confirmed it. */
export type CreatedItem = { kind: ChatAction["kind"]; path: string; id?: string };

/* ---------- links from a journal entry to the to-dos and notes made from the same message ---------- */

// In a journal draft the assistant marks the words that belong to another draft as `[[words|ref]]`.
const REF_MARK = /\[\[([^\]|\n]{1,200})\|([a-z0-9]{1,12})\]\]/g;

/** The journal text with the markers removed (what a draft card shows before anything is saved). */
export const stripRefs = (body: string) => body.replace(REF_MARK, "$1");

/** One line for a hover card: what the linked to-do or note is. No quotes or brackets, so it is safe inside a Markdown link title. */
export function describeItem(a: ChatAction): string {
  const clean = (s: string, max: number) =>
    s
      .replace(/[\r\n]+/g, " ")
      .replace(/["[\]()]/g, "")
      .trim()
      .slice(0, max);
  if (a.kind === "task") {
    const due = a.due_date
      ? ` · due ${new Date(`${a.due_date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`
      : "";
    return `To-do · ${clean(a.title, 120)}${due}`;
  }
  if (a.kind === "note") return `Note · ${clean(a.title, 80)}${a.body.trim() ? ` · ${clean(a.body, 100)}` : ""}`;
  return "Journal entry";
}

/**
 * Turns the markers into real links to the items that exist now (`[words](/dashboard/todo?task=… "hover text")`).
 * A marker whose item has not been created yet becomes plain words, and is linked later if the item is created afterwards.
 */
export function resolveRefs(body: string, items: Map<string, { path: string; tip: string }>): string {
  return body.replace(REF_MARK, (_all, text: string, r: string) => {
    const it = items.get(r);
    return it ? `[${text.replace(/[[\]]/g, "")}](${it.path} "${it.tip}")` : text;
  });
}

/** One draft proposed by the assistant, in order, and whether it has been created yet. */
export type ChatProposal = { index: number; action: ChatAction; created: CreatedItem | null };

const MAX_PROPOSALS = 6;
// A draft is `<create-item>{…}</create-item>`; after the user confirms it, the block becomes `<created-item>{kind,path,action}</created-item>`.
const BLOCK = /<(create-item|created-item)>\s*([\s\S]*?)\s*<\/\1>/g;

const createdSchema = z.object({
  kind: z.enum(["note", "journal", "task"]),
  path: z.string().max(500),
  id: z.string().max(60).optional(),
  action: chatActionSchema,
});

function readBlock(tag: string, json: string): { action: ChatAction; created: CreatedItem | null } | null {
  try {
    const raw: unknown = JSON.parse(json);
    if (tag === "create-item") {
      const r = chatActionSchema.safeParse(raw);
      return r.success ? { action: r.data, created: null } : null;
    }
    const r = createdSchema.safeParse(raw);
    return r.success ? { action: r.data.action, created: { kind: r.data.kind, path: r.data.path, id: r.data.id } } : null;
  } catch {
    return null; // invalid model output stays inert
  }
}

/**
 * Splits an assistant message into the text to show and the drafts it proposes (up to six, in order).
 * Invalid or surplus blocks are dropped, and the internal protocol is never shown as text. Only drafts the assistant itself
 * wrote are honoured here; a block inside the user's own messages is never parsed (see chat.ts), so pasted text can't create items.
 */
export function parseChatActions(text: string): { body: string; proposals: ChatProposal[] } {
  const proposals: ChatProposal[] = [];
  let body = text.replace(BLOCK, (_all, tag: string, json: string) => {
    const b = readBlock(tag, json);
    if (b && proposals.length < MAX_PROPOSALS) proposals.push({ index: proposals.length, ...b });
    return "";
  });
  // A reply cut off in the middle of a block must not leak raw markup.
  const open = body.search(/<create-item>|<created-item>/);
  if (open >= 0) body = body.slice(0, open);
  return { body: body.replace(/\n{3,}/g, "\n\n").trimEnd(), proposals };
}

/** Back-compat helper: the first draft that has not been created yet. */
export function parseChatAction(text: string): { body: string; action: ChatAction | null } {
  const { body, proposals } = parseChatActions(text);
  return { body, action: proposals.find((p) => !p.created)?.action ?? null };
}

/** Rewrites a message so that the `index`-th draft is marked as created (keeping every other draft as it was). */
export function markCreated(text: string, index: number, created: CreatedItem, action: ChatAction): string {
  let seen = -1;
  return text.replace(BLOCK, (all, tag: string, json: string) => {
    if (!readBlock(tag, json)) return all;
    seen++;
    return seen === index ? `<created-item>${JSON.stringify({ ...created, action })}</created-item>` : all;
  });
}

export function itemPath(kind: ChatAction["kind"], id: string, entryDate?: string) {
  if (kind === "note") return `/dashboard/notes?note=${encodeURIComponent(id)}`;
  if (kind === "task") return `/dashboard/todo?task=${encodeURIComponent(id)}`;
  return `/dashboard/journal?d=${encodeURIComponent(entryDate ?? "")}`;
}
