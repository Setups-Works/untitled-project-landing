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

const emailInput = z.string().email("Enter a valid email address.").max(254);
const looksLikeEmail = (v: string) => /^[^@\s]+@[^@\s]+$/.test(v);

/** Who to invite: a username (as above) or an email address. Usernames can't contain "@", so the two never overlap. Resolves to the normalised text. */
export const inviteTarget = z
  .string()
  .trim()
  .superRefine((v, ctx) => {
    const r = looksLikeEmail(v) ? emailInput.safeParse(v) : usernameInput.safeParse(v);
    if (!r.success) for (const i of r.error.issues) ctx.addIssue({ code: "custom", message: i.message });
  })
  .transform((v) => (looksLikeEmail(v) ? v.toLowerCase() : usernameInput.parse(v)));

export const inviteRole = z.enum(["editor", "viewer"]);
const attachment = z.object({
  path: z.string().max(400),
  name: z.string().max(200),
  type: z.string().max(120),
  size: z.number().int().min(0),
});
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-10-20.");

export const journalName = z.object({ name: z.string().trim().min(1, "Give the journal a name.").max(LIMIT.nameMax) });
/** `username` holds a username or an email address (the field keeps its name so existing apps keep working). */
export const inviteBody = z.object({ username: inviteTarget, role: inviteRole });
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
