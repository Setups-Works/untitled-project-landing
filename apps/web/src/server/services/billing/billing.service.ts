import "server-only";
import type { BillingPlan, MyBilling, PlanId } from "@untitled/types";
import { addMonths, byoProvider, tokenCostCents } from "@untitled/logic/billing";
import { isEnabled } from "../../../config/features";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../errors";
import * as repo from "../../repositories/billing.repository";
import type { UserBillingRow } from "../../repositories/billing.repository";
import { openKey, sealKey } from "./keyVault";
import type { PlanPatchInput } from "./billing.schema";

/**
 * Plans and billing rules. People choose, switch and cancel their own plan here; admins edit plans and assign plans through the
 * `admin*` functions (the admin panel checks the caller first). No payment provider is connected yet (`payments` is off), so a
 * change is recorded and applies at once and nobody is charged.
 *
 * Rules: no plan chosen = AI works as before and use is only counted; Subscription = AI up to the plan's token allowance each period;
 * Pay as you go = AI with every token counted and priced; Bring your own key = AI through the person's own key, never counted.
 * A subscription cancels at the end of its period; the other plans stop at once. Plans renew a month at a time, and a lapsed
 * period rolls forward the next time anything reads it.
 */

const now = () => new Date();
/** Only a subscription has billing periods: a month or a year long. The other plans run until they are cancelled. */
const periodEnd = (plan: Pick<BillingPlan, "id" | "interval">, from: Date) =>
  plan.id !== "subscription" || plan.interval === "none" ? null : addMonths(from, plan.interval === "year" ? 12 : 1);

/** The person's plan row with an ended period settled: a cancelled subscription lapses, anything else renews. */
async function settled(userId: string): Promise<UserBillingRow | null> {
  const row = await repo.getUserBilling(userId);
  if (!row || row.status !== "active" || !row.period_end || new Date(row.period_end) > now()) return row;
  const end = new Date(row.period_end);
  if (row.cancel_at_period_end) {
    const next = { ...row, status: "canceled" as const, canceled_at: end.toISOString(), cancel_at_period_end: false };
    await repo.saveUserBilling(userId, next);
    return next;
  }
  const plan = await repo.getPlan(row.plan_id);
  const step = plan?.interval === "year" ? 12 : 1;
  let start = end;
  let stop = addMonths(start, step);
  while (stop <= now()) {
    start = stop;
    stop = addMonths(start, step);
  }
  const next = { ...row, period_start: start.toISOString(), period_end: stop.toISOString() };
  await repo.saveUserBilling(userId, next);
  return next;
}

export const listPublicPlans = () => repo.listPlans({ activeOnly: true });

export async function getMyBilling(userId: string): Promise<MyBilling> {
  const [row, plans, key] = await Promise.all([settled(userId), repo.listPlans({ activeOnly: false }), repo.getAiKey(userId)]);
  const live = row?.status === "active" ? row : null;
  const plan = live ? (plans.find((p) => p.id === live.plan_id) ?? null) : null;
  const since = live?.period_start ?? new Date(Date.UTC(now().getUTCFullYear(), now().getUTCMonth(), 1)).toISOString();
  const tokens = await repo.tokensSince(userId, since);
  return {
    plans: plans.filter((p) => p.active),
    plan,
    status: row ? row.status : "none",
    period_start: live?.period_start ?? null,
    period_end: live?.period_end ?? null,
    cancel_at_period_end: live?.cancel_at_period_end ?? false,
    tokens_used: tokens,
    cost_cents: plan?.id === "payg" ? tokenCostCents(tokens, plan.token_price_cents_per_million) : 0,
    byo: { provider: key?.provider ?? null, model: key?.model ?? null, hint: key?.key_hint ?? null },
    payments_connected: isEnabled("payments"),
  };
}

async function activate(userId: string, planId: PlanId, opts: { requireActive: boolean }) {
  const plan = await repo.getPlan(planId);
  if (!plan || (opts.requireActive && !plan.active)) throw new ValidationError("That plan isn’t available.");
  const start = now();
  const end = periodEnd(plan, start);
  await repo.saveUserBilling(userId, {
    plan_id: plan.id,
    status: "active",
    period_start: start.toISOString(),
    period_end: end ? end.toISOString() : null,
    cancel_at_period_end: false,
    canceled_at: null,
  });
}

export async function choosePlan(userId: string, planId: PlanId): Promise<MyBilling> {
  const row = await settled(userId);
  if (row?.status === "active" && row.plan_id === planId) {
    if (!row.cancel_at_period_end) throw new ConflictError("You’re already on this plan.");
    await repo.saveUserBilling(userId, { ...row, cancel_at_period_end: false });
  } else await activate(userId, planId, { requireActive: true });
  return getMyBilling(userId);
}

/** A subscription runs to the end of the period you paid for; the other plans stop now. */
export async function cancelPlan(userId: string): Promise<MyBilling> {
  const row = await settled(userId);
  if (!row || row.status !== "active") throw new ConflictError("You don’t have a plan to cancel.");
  if (row.cancel_at_period_end) throw new ConflictError("This plan is already set to cancel.");
  if (row.period_end) await repo.saveUserBilling(userId, { ...row, cancel_at_period_end: true });
  else await repo.saveUserBilling(userId, { ...row, status: "canceled", canceled_at: now().toISOString() });
  return getMyBilling(userId);
}

export async function resumePlan(userId: string): Promise<MyBilling> {
  const row = await settled(userId);
  if (!row || row.status !== "active" || !row.cancel_at_period_end) throw new ConflictError("There’s nothing to resume.");
  await repo.saveUserBilling(userId, { ...row, cancel_at_period_end: false });
  return getMyBilling(userId);
}

export async function saveByoKey(userId: string, input: { provider: string; model: string; apiKey: string }): Promise<MyBilling> {
  const preset = byoProvider(input.provider);
  if (!preset) throw new ValidationError("Choose one of the listed providers.");
  const row = await settled(userId);
  if (row?.status !== "active" || row.plan_id !== "byo") throw new ConflictError("Choose the Bring your own key plan first.");
  await repo.saveAiKey(userId, {
    provider: preset.id,
    model: input.model,
    key_cipher: sealKey(input.apiKey, userId),
    key_hint: input.apiKey.slice(-4),
  });
  return getMyBilling(userId);
}

export async function removeByoKey(userId: string): Promise<MyBilling> {
  await repo.deleteAiKey(userId);
  return getMyBilling(userId);
}

export type AiAccess = {
  mode: "server" | "byo";
  planId: PlanId | null;
  /** For the own-key plan: the sealed key opened for this one request, the provider's fixed address and the chosen model. */
  byo?: { apiKey: string; baseUrl: string; model: string; provider: string };
  /** Counts the tokens an answer used (a no-op on the own-key plan). */
  record: (usage: { inputTokens: number; outputTokens: number }, provider: string) => Promise<void>;
};

/**
 * What a person's plan allows for one AI request. Throws a ServiceError with a friendly message when it doesn't allow it
 * (allowance used up, own key missing), so the AI services can stop before calling any provider.
 */
export async function aiAccessFor(userId: string): Promise<AiAccess> {
  const row = await settled(userId);
  const planId = row?.status === "active" ? row.plan_id : null;
  const count = (usage: { inputTokens: number; outputTokens: number }, provider: string) =>
    repo.addUsage(userId, planId, provider, usage.inputTokens, usage.outputTokens).catch(() => undefined);

  if (planId === "byo") {
    const key = await repo.getAiKey(userId);
    if (!key) throw new ForbiddenError("Add your API key in Settings → Plan and billing to use AI.");
    const apiKey = openKey(key.key_cipher, userId);
    const preset = byoProvider(key.provider);
    if (!apiKey || !preset) throw new ForbiddenError("Your saved API key couldn’t be used. Enter it again in Settings → Plan and billing.");
    return { mode: "byo", planId, byo: { apiKey, baseUrl: preset.baseUrl, model: key.model, provider: preset.id }, record: async () => undefined };
  }
  if (planId === "subscription" && row) {
    const plan = await repo.getPlan("subscription");
    if (plan && plan.included_tokens > 0 && (await repo.tokensSince(userId, row.period_start)) >= plan.included_tokens)
      throw new ForbiddenError("You’ve used this period’s AI allowance. Switch to pay as you go or bring your own key in Settings → Plan and billing.");
  }
  return { mode: "server", planId, record: count };
}

// ---- Admin. Callers (app/admin) check the admin first and write the audit entry. ----

export async function adminOverview() {
  const [plans, totals, subscribers, tokens30d] = await Promise.all([
    repo.listPlans({ activeOnly: false }),
    repo.planTotals(),
    repo.listSubscribers(),
    repo.usageTotal30d(),
  ]);
  return { plans, totals, subscribers, tokens30d };
}

export async function adminUpdatePlan(id: string, patch: PlanPatchInput) {
  const updated = await repo.updatePlan(id, patch);
  if (!updated) throw new NotFoundError("That plan doesn’t exist.");
  return updated;
}

/** Puts a person on a plan (or off every plan with null). Inactive plans can still be assigned by an admin. */
export async function adminSetUserPlan(userId: string, planId: PlanId | null) {
  if (planId === null) return repo.clearUserBilling(userId);
  await activate(userId, planId, { requireActive: false });
}
