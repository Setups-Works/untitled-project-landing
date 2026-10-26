import { describe, expect, it } from "vitest";
import { addMonth, addMonths, estimateTokens, formatMoney, formatTokens, priceLine, tokenCostCents } from "./billing";

describe("billing helpers", () => {
  it("formats money", () => {
    expect(formatMoney(0)).toBe("Free");
    expect(formatMoney(74900)).toBe("₹749");
    expect(formatMoney(74950)).toBe("₹749.50");
    expect(formatMoney(150000)).toBe("₹1,500");
    expect(formatMoney(900, "usd")).toBe("$9");
  });

  it("formats token counts", () => {
    expect(formatTokens(1_000_000)).toBe("1M");
    expect(formatTokens(1_500_000)).toBe("1.5M");
    expect(formatTokens(250_000)).toBe("250K");
    expect(formatTokens(1200)).toBe("1,200");
  });

  it("describes what each plan costs", () => {
    const base = { currency: "inr", interval: "none" as const, token_price_cents_per_million: 0, price_cents: 0 };
    expect(priceLine({ ...base, id: "subscription", price_cents: 74900, interval: "month" })).toBe("₹749 / month");
    expect(priceLine({ ...base, id: "payg", token_price_cents_per_million: 15000 })).toBe("₹150 per 1M tokens");
    expect(priceLine({ ...base, id: "byo" })).toBe("Free");
  });

  it("rounds a usage cost up", () => {
    expect(tokenCostCents(1_000_000, 200)).toBe(200);
    expect(tokenCostCents(1, 200)).toBe(1);
    expect(tokenCostCents(0, 200)).toBe(0);
  });

  it("estimates tokens from characters", () => {
    expect(estimateTokens(0)).toBe(0);
    expect(estimateTokens(9)).toBe(3);
  });

  it("adds a month and clamps to the end of a short month", () => {
    expect(addMonth(new Date("2026-10-26T10:00:00Z")).toISOString()).toBe("2026-11-26T10:00:00.000Z");
    expect(addMonth(new Date("2026-01-31T00:00:00Z")).toISOString()).toBe("2026-02-28T00:00:00.000Z");
    expect(addMonth(new Date("2026-12-15T00:00:00Z")).toISOString()).toBe("2027-01-15T00:00:00.000Z");
    expect(addMonths(new Date("2026-10-26T00:00:00Z"), 12).toISOString()).toBe("2027-10-26T00:00:00.000Z");
  });
});
