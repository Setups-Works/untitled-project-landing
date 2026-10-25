import { z } from "zod";
import { RSS } from "@untitled/logic/rss";

export const addFeedInput = z.object({ url: z.string().trim().min(1, "Enter a feed or website address.").max(2048, "That address is too long.") });

export const itemPatchInput = z
  .object({ is_read: z.boolean().optional(), is_starred: z.boolean().optional() })
  .refine((v) => v.is_read !== undefined || v.is_starred !== undefined, "Nothing to change.");

export const readAllInput = z.object({ feed_id: z.string().uuid().optional() });

export const refreshInput = z.object({ feed_id: z.string().uuid().optional() });

export const itemsQuery = z.object({
  feed: z.string().uuid().optional(),
  filter: z.enum(["all", "unread", "starred"]).default("all"),
  q: z.string().trim().max(RSS.maxSearchLength).optional(),
  cursor: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(RSS.maxPageSize).default(RSS.pageSize),
});
