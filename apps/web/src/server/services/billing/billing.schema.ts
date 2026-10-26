import { z } from "zod";
import { BYO_PROVIDERS } from "@untitled/logic/billing";

export const planIdInput = z.object({ planId: z.enum(["subscription", "payg", "byo"]) });

const providerIds = BYO_PROVIDERS.map((p) => p.id) as [string, ...string[]];

export const byoKeyInput = z.object({
  provider: z.enum(providerIds),
  model: z.string().trim().min(1, "Enter a model name.").max(100, "That model name is too long."),
  apiKey: z
    .string()
    .trim()
    .min(8, "That key looks too short.")
    .max(400, "That key is too long.")
    .regex(/^\S+$/, "A key has no spaces."),
});

/** What an admin may change on a plan. Prices are in the smallest currency unit (paise); features are short lines shown on the pricing page. */
export const planPatchInput = z.object({
  name: z.string().trim().min(1, "A plan needs a name.").max(60).optional(),
  tagline: z.string().trim().max(200).optional(),
  price_cents: z.number().int().min(0).max(10_000_000).optional(),
  currency: z.string().trim().length(3, "Use a three-letter currency code.").toLowerCase().optional(),
  interval: z.enum(["month", "year", "none"]).optional(),
  included_tokens: z.number().int().min(0).max(1_000_000_000_000).optional(),
  token_price_cents_per_million: z.number().int().min(0).max(100_000_000).optional(),
  features: z.array(z.string().trim().min(1).max(120)).max(12).optional(),
  active: z.boolean().optional(),
  sort: z.number().int().min(0).max(100).optional(),
});
export type PlanPatchInput = z.infer<typeof planPatchInput>;
