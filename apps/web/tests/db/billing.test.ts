import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool, withUser } from "../../src/server/db/pool";
import { ConflictError, ForbiddenError } from "../../src/server/errors";
import {
  adminSetUserPlan,
  adminUpdatePlan,
  aiAccessFor,
  cancelPlan,
  choosePlan,
  getMyBilling,
  resumePlan,
  saveByoKey,
} from "../../src/server/services/billing/billing.service";

/**
 * Plans, metering and the own-key plan against the real PostgreSQL with Row-Level Security.
 * Run with `corepack pnpm test:db` (needs `docker compose up -d` and `corepack pnpm db:migrate`).
 */
const run = Date.now().toString(36);
const user = { a: "", b: "" };
let original: { included_tokens: number } | undefined;

beforeAll(async () => {
  process.env.BETTER_AUTH_SECRET ??= "test-secret-for-the-vault-0123456789";
  for (const tag of ["a", "b"] as const) {
    const { rows } = await pool().query<{ id: string }>("insert into auth.users (name, email) values ($1, $2) returning id", [
      `bill ${tag}`,
      `bill-${tag}-${run}@example.test`,
    ]);
    user[tag] = rows[0].id;
  }
  original = (await pool().query<{ included_tokens: number }>("select included_tokens::int from public.billing_plans where id = 'subscription'")).rows[0];
});

afterAll(async () => {
  await pool().query("update public.billing_plans set included_tokens = $1 where id = 'subscription'", [original?.included_tokens ?? 1_000_000]);
  await pool().query("delete from auth.users where email like $1", [`bill-%-${run}@example.test`]);
  await pool().end();
});

describe("plans", () => {
  it("starts with no plan and AI as before", async () => {
    const b = await getMyBilling(user.a);
    expect(b).toMatchObject({ plan: null, status: "none", payments_connected: false });
    expect(b.plans.map((p) => p.id)).toEqual(["subscription", "payg", "byo"]);
    expect((await aiAccessFor(user.a)).mode).toBe("server");
  });

  it("chooses a subscription with a period, and refuses choosing it twice", async () => {
    const b = await choosePlan(user.a, "subscription");
    expect(b.plan?.id).toBe("subscription");
    expect(b.period_end).not.toBeNull();
    await expect(choosePlan(user.a, "subscription")).rejects.toBeInstanceOf(ConflictError);
  });

  it("cancels a subscription at the end of its period and can resume it", async () => {
    const cancelled = await cancelPlan(user.a);
    expect(cancelled.cancel_at_period_end).toBe(true);
    expect(cancelled.plan?.id).toBe("subscription");
    await expect(cancelPlan(user.a)).rejects.toBeInstanceOf(ConflictError);
    expect((await resumePlan(user.a)).cancel_at_period_end).toBe(false);
  });

  it("lapses a cancelled subscription once its period has ended", async () => {
    await cancelPlan(user.a);
    await pool().query("update public.user_billing set period_end = now() - interval '1 day' where user_id = $1", [user.a]);
    const b = await getMyBilling(user.a);
    expect(b).toMatchObject({ plan: null, status: "canceled" });
  });

  it("renews a subscription whose period ended without a cancellation", async () => {
    await choosePlan(user.a, "subscription");
    await pool().query("update public.user_billing set period_end = now() - interval '2 days' where user_id = $1", [user.a]);
    const b = await getMyBilling(user.a);
    expect(b.plan?.id).toBe("subscription");
    expect(new Date(b.period_end!).getTime()).toBeGreaterThan(Date.now());
  });

  it("stops pay as you go at once when cancelled", async () => {
    await choosePlan(user.a, "payg");
    expect((await cancelPlan(user.a)).status).toBe("canceled");
  });
});

describe("AI access and metering", () => {
  it("counts tokens on pay as you go and prices them from the plan's rate", async () => {
    await choosePlan(user.b, "payg");
    const access = await aiAccessFor(user.b);
    expect(access.mode).toBe("server");
    await access.record({ inputTokens: 400_000, outputTokens: 600_000 }, "groq");
    const b = await getMyBilling(user.b);
    expect(b.tokens_used).toBe(1_000_000);
    expect(b.cost_cents).toBe(b.plan!.token_price_cents_per_million);
  });

  it("stops a subscription at its allowance", async () => {
    await adminUpdatePlan("subscription", { included_tokens: 1000 });
    await choosePlan(user.b, "subscription");
    await (await aiAccessFor(user.b)).record({ inputTokens: 600, outputTokens: 600 }, "groq");
    await expect(aiAccessFor(user.b)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("needs a key on the own-key plan, then uses it without counting anything", async () => {
    await choosePlan(user.b, "byo");
    await expect(aiAccessFor(user.b)).rejects.toBeInstanceOf(ForbiddenError);
    await saveByoKey(user.b, { provider: "openai", model: "gpt-4o-mini", apiKey: "sk-test-1234567890" });
    const access = await aiAccessFor(user.b);
    expect(access).toMatchObject({ mode: "byo", byo: { apiKey: "sk-test-1234567890", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" } });
    const before = (await getMyBilling(user.b)).tokens_used;
    await access.record({ inputTokens: 500, outputTokens: 500 }, "custom");
    expect((await getMyBilling(user.b)).tokens_used).toBe(before);
    const stored = (await pool().query<{ key_cipher: string; key_hint: string }>("select key_cipher, key_hint from public.user_ai_keys where user_id = $1", [user.b])).rows[0];
    expect(stored.key_cipher).not.toContain("sk-test");
    expect(stored.key_hint).toBe("7890");
    expect(JSON.stringify(await getMyBilling(user.b))).not.toContain("sk-test");
  });

  it("only lets a key be saved on the own-key plan", async () => {
    await choosePlan(user.a, "payg");
    await expect(saveByoKey(user.a, { provider: "openai", model: "m", apiKey: "sk-test-1234567890" })).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("row-level security", () => {
  it("lets people read only their own plan and usage", async () => {
    const mine = await withUser(user.b, (c) => c.query("select user_id from public.user_billing"));
    expect(mine.rows.map((r) => r.user_id)).toEqual([user.b]);
    const usage = await withUser(user.a, (c) => c.query("select 1 from public.ai_usage where user_id = $1", [user.b]));
    expect(usage.rowCount).toBe(0);
  });

  it("does not let people write their own plan, usage or plan prices", async () => {
    await expect(withUser(user.a, (c) => c.query("update public.user_billing set plan_id = 'byo' where user_id = $1", [user.a]))).rejects.toThrow();
    await expect(withUser(user.a, (c) => c.query("insert into public.ai_usage (user_id) values ($1)", [user.a]))).rejects.toThrow();
    await expect(withUser(user.a, (c) => c.query("update public.billing_plans set price_cents = 0"))).rejects.toThrow();
  });

  it("keeps the saved keys away from every signed-in user, including their owner", async () => {
    await expect(withUser(user.b, (c) => c.query("select key_cipher from public.user_ai_keys"))).rejects.toThrow();
  });

  it("lets an admin put someone on a plan and take them off", async () => {
    await adminSetUserPlan(user.a, "byo");
    expect((await getMyBilling(user.a)).plan?.id).toBe("byo");
    await adminSetUserPlan(user.a, null);
    expect((await getMyBilling(user.a)).status).toBe("none");
  });
});
