import { SHARED_JOURNAL as LIMIT } from "@untitled/logic";
import { z } from "zod";

/** Usernames follow the account settings rule; a leading @ is allowed when typing one. */
export const usernameInput = z
  .string()
  .trim()
  .transform((v) => v.replace(/^@/, "").toLowerCase())
  .pipe(
    z
      .string()
      .regex(
        new RegExp(`^[a-z0-9_.]{${LIMIT.usernameMin},${LIMIT.usernameMax}}$`),
        `Enter a username with ${LIMIT.usernameMin}–${LIMIT.usernameMax} letters, numbers, dots or underscores.`,
      ),
  );

export const inviteRole = z.enum(["editor", "viewer"]);
const attachment = z.object({
  path: z.string().max(400),
  name: z.string().max(200),
  type: z.string().max(120),
  size: z.number().int().min(0),
});
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-10-20.");

export const journalName = z.object({ name: z.string().trim().min(1, "Give the journal a name.").max(LIMIT.nameMax) });
export const inviteBody = z.object({ username: usernameInput, role: inviteRole });
export const roleBody = z.object({ role: inviteRole });
export const respondBody = z.object({ action: z.enum(["accept", "decline"]) });
export const entryCreate = z.object({
  entry_date: date,
  body: z.string().max(LIMIT.bodyMax).default(""),
  kind: z.enum(["text", "voice"]).default("text"),
  attachments: z.array(attachment).max(LIMIT.attachmentsMax).default([]),
});
export const entryUpdate = z.object({
  body: z.string().max(LIMIT.bodyMax).optional(),
  attachments: z.array(attachment).max(LIMIT.attachmentsMax).optional(),
});
/** `?cursor=<oldest date loaded>&limit=<n>` for a journal's feed. */
export const feedQuery = z.object({
  cursor: date.optional(),
  limit: z.coerce.number().int().min(1).max(LIMIT.pageMax).default(LIMIT.pageSize),
});
export type FeedQuery = z.infer<typeof feedQuery>;
