import "server-only";
import type { BillingPlan, PlanId } from "@untitled/types";
import { withOwner, withUser } from "../db/pool";

/**
 * Data access for plans, a person's plan, metered AI use and their own-key row. Reads of a person's own data run as that person
 * (row-level security scopes them). Writes run as the owner on purpose: people can't write these tables themselves, so every change
 * goes through the billing service, which has already checked it. The key table is owner-only both ways.
 */

const PLAN_COLS = `id, name, tagline, price_cents, currency, interval, included_tokens::float8 as included_tokens,
  token_price_cents_per_million, features, active, sort`;

export type UserBillingRow = {
  user_id: string;
  plan_id: PlanId;
  status: "active" | "canceled";
  period_start: string;
  period_end: string | null;
  cancel_at_period_end: boolean;
  started_at: string;
  canceled_at: string | null;
};

export const listPlans = (opts: { activeOnly: boolean }) =>
  withOwner(
    async (c) =>
      (await c.query<BillingPlan>(`select ${PLAN_COLS} from public.billing_plans ${opts.activeOnly ? "where active" : ""} order by sort, id`)).rows,
  );

export const getPlan = (id: string) =>
  withOwner(async (c) => (await c.query<BillingPlan>(`select ${PLAN_COLS} from public.billing_plans where id = $1`, [id])).rows[0] ?? null);

export type PlanPatch = Partial<Pick<BillingPlan, "name" | "tagline" | "price_cents" | "currency" | "interval" | "included_tokens" | "token_price_cents_per_million" | "features" | "active" | "sort">>;

const PATCHABLE = new Set(["name", "tagline", "price_cents", "currency", "interval", "included_tokens", "token_price_cents_per_million", "features", "active", "sort"]);

export const updatePlan = (id: string, patch: PlanPatch) =>
  withOwner(async (c) => {
    // Column names come from this list, never from the caller.
    const entries = Object.entries(patch).filter(([k, v]) => v !== undefined && PATCHABLE.has(k));
    if (!entries.length) return getPlan(id);
    const sets = entries.map(([k], i) => `${k} = $${i + 2}`);
    const res = await c.query<BillingPlan>(
      `update public.billing_plans set ${sets.join(", ")}, updated_at = now() where id = $1 returning ${PLAN_COLS}`,
      [id, ...entries.map(([, v]) => v)],
    );
    return res.rows[0] ?? null;
  });

export const getUserBilling = (userId: string) =>
  withUser(userId, async (c) => (await c.query<UserBillingRow>("select * from public.user_billing where user_id = $1", [userId])).rows[0] ?? null);

type BillingWrite = Pick<UserBillingRow, "plan_id" | "status" | "period_start" | "period_end" | "cancel_at_period_end" | "canceled_at">;

export const saveUserBilling = (userId: string, b: BillingWrite) =>
  withOwner(async (c) => {
    await c.query(
      `insert into public.user_billing (user_id, plan_id, status, period_start, period_end, cancel_at_period_end, canceled_at)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (user_id) do update set plan_id = excluded.plan_id, status = excluded.status, period_start = excluded.period_start,
         period_end = excluded.period_end, cancel_at_period_end = excluded.cancel_at_period_end, canceled_at = excluded.canceled_at,
         started_at = case when public.user_billing.plan_id = excluded.plan_id and public.user_billing.status = 'active'
                           then public.user_billing.started_at else now() end,
         updated_at = now()`,
      [userId, b.plan_id, b.status, b.period_start, b.period_end, b.cancel_at_period_end, b.canceled_at],
    );
  });

export const clearUserBilling = (userId: string) =>
  withOwner(async (c) => void (await c.query("delete from public.user_billing where user_id = $1", [userId])));

export const addUsage = (userId: string, planId: PlanId | null, provider: string, inputTokens: number, outputTokens: number) =>
  withOwner(
    async (c) =>
      void (await c.query("insert into public.ai_usage (user_id, plan_id, provider, input_tokens, output_tokens) values ($1, $2, $3, $4, $5)", [
        userId,
        planId,
        provider.slice(0, 40),
        Math.max(0, Math.floor(inputTokens)),
        Math.max(0, Math.floor(outputTokens)),
      ])),
  );

/** Tokens a person has used since `since`. */
export const tokensSince = (userId: string, since: string) =>
  withUser(
    userId,
    async (c) =>
      Number(
        (await c.query<{ n: string | null }>("select coalesce(sum(input_tokens + output_tokens), 0)::text as n from public.ai_usage where user_id = $1 and created_at >= $2", [userId, since])).rows[0]!.n,
      ),
  );

export type KeyRow = { provider: string; model: string; key_cipher: string; key_hint: string };

export const getAiKey = (userId: string) =>
  withOwner(async (c) => (await c.query<KeyRow>("select provider, model, key_cipher, key_hint from public.user_ai_keys where user_id = $1", [userId])).rows[0] ?? null);

export const saveAiKey = (userId: string, k: KeyRow) =>
  withOwner(
    async (c) =>
      void (await c.query(
        `insert into public.user_ai_keys (user_id, provider, model, key_cipher, key_hint) values ($1, $2, $3, $4, $5)
         on conflict (user_id) do update set provider = excluded.provider, model = excluded.model, key_cipher = excluded.key_cipher,
           key_hint = excluded.key_hint, updated_at = now()`,
        [userId, k.provider, k.model, k.key_cipher, k.key_hint],
      )),
  );

export const deleteAiKey = (userId: string) => withOwner(async (c) => void (await c.query("delete from public.user_ai_keys where user_id = $1", [userId])));

/** Admin views. Counts and token totals only, never anything a person wrote. */
export type SubscriberRow = {
  user_id: string;
  email: string;
  name: string;
  plan_id: PlanId;
  status: "active" | "canceled";
  period_end: string | null;
  cancel_at_period_end: boolean;
  tokens_30d: number;
};

export const listSubscribers = () =>
  withOwner(
    async (c) =>
      (await c.query<SubscriberRow>(
        `select b.user_id, u.email, u.name, b.plan_id, b.status, b.period_end, b.cancel_at_period_end,
                coalesce((select sum(a.input_tokens + a.output_tokens) from public.ai_usage a
                          where a.user_id = b.user_id and a.created_at >= now() - interval '30 days'), 0)::float8 as tokens_30d
         from public.user_billing b join auth.users u on u.id = b.user_id
         order by b.updated_at desc limit 500`,
      )).rows,
  );

export type PlanTotals = { plan_id: string; people: number; active: number };

export const planTotals = () =>
  withOwner(
    async (c) =>
      (await c.query<PlanTotals>(
        `select plan_id, count(*)::int as people, count(*) filter (where status = 'active')::int as active from public.user_billing group by plan_id`,
      )).rows,
  );

export const usageTotal30d = () =>
  withOwner(
    async (c) =>
      Number(
        (await c.query<{ n: string }>("select coalesce(sum(input_tokens + output_tokens), 0)::text as n from public.ai_usage where created_at >= now() - interval '30 days'")).rows[0]!.n,
      ),
  );
