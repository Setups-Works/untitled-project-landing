import { describe, expect, it } from "vitest";
import { healthSyncInput } from "../../src/server/services/health/health.schema";

describe("health sync input", () => {
  it("stores an impossible reading as no data instead of rejecting the sync", () => {
    const parsed = healthSyncInput.parse({
      source: "health_connect",
      days: [{ day: "2026-10-17", steps: 4200, resting_hr: 0, hr_min: 12, hr_max: 140 }],
    });
    expect(parsed.days[0]).toMatchObject({ steps: 4200, resting_hr: null, hr_min: null, hr_max: 140 });
  });

  it("still rejects a malformed day", () => {
    expect(healthSyncInput.safeParse({ source: "healthkit", days: [{ day: "today" }] }).success).toBe(false);
  });
});
