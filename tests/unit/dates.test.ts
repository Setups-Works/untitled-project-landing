import { describe, expect, it } from "vitest";
import { addDays, ago, dayLabel, daysBetween, greeting, isoDate } from "../../src/lib/dates";

describe("isoDate", () => {
  it("formats local dates with zero padding", () => {
    expect(isoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(isoDate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("addDays", () => {
  it.each([
    ["2026-10-07", 1, "2026-10-08"],
    ["2026-10-31", 1, "2026-11-01"],
    ["2026-12-31", 1, "2027-01-01"],
    ["2026-03-01", -1, "2026-02-28"],
    ["2028-02-28", 1, "2028-02-29"], // leap year
    ["2026-10-07", 0, "2026-10-07"],
    ["2026-10-07", 30, "2026-11-06"],
  ])("%s %+d days → %s", (from, n, to) => expect(addDays(from, n)).toBe(to));
});

describe("daysBetween", () => {
  it.each([
    ["2026-10-07", "2026-10-07", 0],
    ["2026-10-07", "2026-10-10", 3],
    ["2026-10-10", "2026-10-07", -3],
    ["2026-02-28", "2026-03-01", 1],
    ["2026-01-01", "2027-01-01", 365],
  ])("%s → %s = %d", (a, b, n) => expect(daysBetween(a, b)).toBe(n));
});

describe("greeting", () => {
  it.each([
    [2, "Good night"],
    [4, "Good night"],
    [5, "Good morning"],
    [11, "Good morning"],
    [12, "Good afternoon"],
    [17, "Good afternoon"],
    [18, "Good evening"],
    [23, "Good evening"],
  ])("at %d:00 → %s", (hour, text) => expect(greeting(new Date(2026, 9, 7, hour))).toBe(text));
});

describe("dayLabel", () => {
  it("calls today and tomorrow by name", () => {
    expect(dayLabel("2026-10-07", "2026-10-07")).toBe("Today");
    expect(dayLabel("2026-10-08", "2026-10-07")).toBe("Tomorrow");
  });
  it("falls back to a short date for other days", () => {
    expect(dayLabel("2026-10-20", "2026-10-07")).toMatch(/Oct/);
    expect(dayLabel("2026-10-20", "2026-10-07")).toMatch(/20/);
  });
});

describe("ago", () => {
  const at = (secondsAgo: number) => new Date(Date.now() - secondsAgo * 1000).toISOString();
  it.each([
    [10, "just now"],
    [5 * 60, "5m ago"],
    [3 * 3600, "3h ago"],
    [2 * 86400, "2d ago"],
  ])("%d seconds ago → %s", (s, label) => expect(ago(at(s))).toBe(label));
  it("uses a calendar date after a week", () => expect(ago(at(30 * 86400))).toMatch(/[A-Z][a-z]{2} \d+/));
});
