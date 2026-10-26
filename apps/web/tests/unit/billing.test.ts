import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { byoKeyInput, planIdInput, planPatchInput } from "../../src/server/services/billing/billing.schema";
import { openKey, sealKey } from "../../src/server/services/billing/keyVault";

describe("billing input", () => {
  it("accepts only the three plans", () => {
    expect(planIdInput.safeParse({ planId: "payg" }).success).toBe(true);
    expect(planIdInput.safeParse({ planId: "pro" }).success).toBe(false);
  });

  it("accepts a key only for a listed provider, and refuses spaces and short keys", () => {
    const ok = { provider: "openai", model: "gpt-4o-mini", apiKey: "sk-test-1234567890" };
    expect(byoKeyInput.safeParse(ok).success).toBe(true);
    expect(byoKeyInput.safeParse({ ...ok, provider: "https://evil.example" }).success).toBe(false);
    expect(byoKeyInput.safeParse({ ...ok, apiKey: "short" }).success).toBe(false);
    expect(byoKeyInput.safeParse({ ...ok, apiKey: "has a space inside" }).success).toBe(false);
  });

  it("keeps plan edits in range and drops unknown fields", () => {
    expect(planPatchInput.safeParse({ price_cents: -1 }).success).toBe(false);
    expect(planPatchInput.safeParse({ currency: "dollars" }).success).toBe(false);
    expect(planPatchInput.safeParse({ features: Array.from({ length: 13 }, () => "x") }).success).toBe(false);
    const parsed = planPatchInput.parse({ name: "  Plus ", currency: "USD", id: "byo", price_cents: 900 });
    expect(parsed).toEqual({ name: "Plus", currency: "usd", price_cents: 900 });
  });
});

describe("key vault", () => {
  const previous = process.env.BETTER_AUTH_SECRET;
  beforeEach(() => {
    process.env.BETTER_AUTH_SECRET = "test-secret-for-the-vault-0123456789";
  });
  afterEach(() => {
    if (previous === undefined) delete process.env.BETTER_AUTH_SECRET;
    else process.env.BETTER_AUTH_SECRET = previous;
  });

  it("round-trips a key and never stores it in the clear", () => {
    const sealed = sealKey("sk-live-abcdef", "user-1");
    expect(sealed).not.toContain("sk-live");
    expect(openKey(sealed, "user-1")).toBe("sk-live-abcdef");
  });

  it("will not open a key for another person or after tampering", () => {
    const sealed = sealKey("sk-live-abcdef", "user-1");
    expect(openKey(sealed, "user-2")).toBeNull();
    const raw = Buffer.from(sealed, "base64");
    raw[raw.length - 1] ^= 1;
    expect(openKey(raw.toString("base64"), "user-1")).toBeNull();
  });

  it("makes a different sealed value each time", () => {
    expect(sealKey("same", "u")).not.toBe(sealKey("same", "u"));
  });
});
