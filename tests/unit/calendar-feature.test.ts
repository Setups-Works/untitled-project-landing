import { describe, expect, it } from "vitest";
import { CALENDAR_TONES } from "../../src/features/calendar/types";
import { isoDate, addDays, dayLabel } from "../../src/lib/dates";
import { weekdayLabels } from "../../src/lib/prefs";

describe("Calendar Feature", () => {
  it("defines all design system color tones", () => {
    expect(CALENDAR_TONES).toContain("blue");
    expect(CALENDAR_TONES).toContain("violet");
    expect(CALENDAR_TONES).toContain("green");
    expect(CALENDAR_TONES).toContain("amber");
    expect(CALENDAR_TONES).toContain("clay");
    expect(CALENDAR_TONES).toContain("mint");
    expect(CALENDAR_TONES).toContain("gold");
    expect(CALENDAR_TONES).toContain("sand");
    expect(CALENDAR_TONES.length).toBe(8);
  });

  describe("Week start preferences", () => {
    it("returns Monday as the first day for mon week start", () => {
      const labels = weekdayLabels("short", "mon");
      expect(labels.length).toBe(7);
      // First label in en-US is Mon
      expect(labels[0]).toMatch(/Mon/i);
    });

    it("returns Sunday as the first day for sun week start", () => {
      const labels = weekdayLabels("short", "sun");
      expect(labels.length).toBe(7);
      expect(labels[0]).toMatch(/Sun/i);
    });
  });

  describe("Date ranges and event mapping", () => {
    it("computes ISO dates correctly across month boundaries", () => {
      expect(isoDate(new Date(2026, 9, 10))).toBe("2026-10-10");
      expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    });

    it("labels dates accurately relative to today", () => {
      const today = "2026-10-10";
      expect(dayLabel("2026-10-10", today)).toBe("Today");
      expect(dayLabel("2026-10-11", today)).toBe("Tomorrow");
    });
  });
});
