import { z } from "zod";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const chatActionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("note"), title: z.string().trim().min(1).max(200), body: z.string().max(10_000) }),
  z.object({ kind: z.literal("journal"), body: z.string().min(1).max(10_000), entry_date: date }),
  z.object({ kind: z.literal("task"), title: z.string().trim().min(1).max(300), description: z.string().max(5000), due_date: date.nullable() }),
]);

export type ChatAction = z.infer<typeof chatActionSchema>;

const ACTION_BLOCK = /\n?\s*<create-item>\s*([\s\S]*?)\s*<\/create-item>\s*$/;

/** Extract and validate the model's proposed action. The returned body is safe to render as ordinary chat text. */
export function parseChatAction(text: string): { body: string; action: ChatAction | null } {
  const match = ACTION_BLOCK.exec(text);
  if (!match) {
    const incomplete = text.lastIndexOf("<create-item>");
    return { body: incomplete < 0 ? text : text.slice(0, incomplete).trimEnd(), action: null };
  }
  let action: ChatAction | null = null;
  try {
    const parsed: unknown = JSON.parse(match[1]);
    const result = chatActionSchema.safeParse(parsed);
    if (result.success) action = result.data;
  } catch {
    // Invalid model output stays inert and the internal protocol is not shown to the user.
  }
  return { body: text.slice(0, match.index).trimEnd(), action };
}

export function itemPath(kind: ChatAction["kind"], id: string, entryDate?: string) {
  if (kind === "note") return `/dashboard/notes?note=${encodeURIComponent(id)}`;
  if (kind === "task") return `/dashboard/todo?task=${encodeURIComponent(id)}`;
  return `/dashboard/journal?d=${encodeURIComponent(entryDate ?? "")}`;
}
