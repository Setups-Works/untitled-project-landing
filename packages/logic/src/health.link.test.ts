import { describe, expect, it } from "vitest";
import { dayRange, healthLink, rangeForDay } from "./health";

describe("health link", () => {
  const today = "2026-10-21";
  it("opens the day in the address, today for today, and today for anything unusable", () => {
    expect(rangeForDay("2026-10-19", today)).toBe(dayRange("2026-10-19"));
    expect(rangeForDay(today, today)).toBe("today");
    expect(rangeForDay("2026-11-01", today)).toBe("today"); // the future can't be picked
    expect(rangeForDay("soon", today)).toBe("today");
    expect(rangeForDay(null, today)).toBe("today");
  });

  it("builds the in-app link", () => {
    expect(healthLink()).toBe("/dashboard/health");
    expect(healthLink("2026-10-21")).toBe("/dashboard/health?d=2026-10-21");
  });
});
