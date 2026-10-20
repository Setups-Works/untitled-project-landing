import { describe, expect, it } from "vitest";
import { buildWidgetSnapshot, journalStreak, widgetText } from "./widgets";

const today = "2026-10-21";
const time = (iso: string) => iso.slice(11, 16);

describe("widget snapshot", () => {
  it("counts the writing streak, and keeps it alive until the day is over", () => {
    expect(journalStreak(["2026-10-21", "2026-10-20", "2026-10-19", "2026-10-17"], today)).toBe(3);
    expect(journalStreak(["2026-10-20", "2026-10-19"], today)).toBe(2); // nothing yet today: yesterday still counts
    expect(journalStreak(["2026-10-18"], today)).toBe(0);
    expect(journalStreak([], today)).toBe(0);
  });

  it("cuts text to one tidy line", () => {
    expect(widgetText("# Day\n\n**Went** far,\nfast")).toBe("Day Went far, fast");
    expect(widgetText("x".repeat(50), 10)).toHaveLength(10);
    expect(widgetText("x".repeat(50), 10).endsWith("…")).toBe(true);
  });

  it("lists overdue then today's open tasks and ignores done, cancelled, archived and undated ones", () => {
    const s = buildWidgetSnapshot({
      today,
      now: "2026-10-21T08:00:00Z",
      tasks: [
        { id: "a", title: "today", due_date: today, done: false },
        { id: "b", title: "late", due_date: "2026-10-19", done: false },
        { id: "c", title: "done", due_date: today, done: true },
        { id: "d", title: "later", due_date: "2026-10-30", done: false },
        { id: "e", title: "undated", due_date: null, done: false },
        { id: "f", title: "cancelled", due_date: today, done: false, cancelled: true },
      ],
      entries: [],
      health: null,
      time,
    });
    expect(s.tasks.items.map((t) => [t.id, t.overdue])).toEqual([
      ["b", true],
      ["a", false],
    ]);
    expect(s.tasks).toMatchObject({ open: 4, dueToday: 1, overdue: 1 });
  });

  it("takes the newest entry of today and formats health figures", () => {
    const s = buildWidgetSnapshot({
      today,
      now: "n",
      tasks: [],
      entries: [
        { entry_date: today, body: "first", created_at: "2026-10-21T07:00:00Z" },
        { entry_date: today, body: "second **one**", created_at: "2026-10-21T09:30:00Z" },
      ],
      health: { steps: 5000, distance_m: 3500, active_kcal: 210, sleep_minutes: 450 },
      time,
    });
    expect(s.journal).toMatchObject({ entriesToday: 2, latest: { time: "09:30", text: "second one" } });
    expect(s.health).toMatchObject({ steps: 5000, stepsRatio: 0.5, distance: "3.5 km", activeKcal: 210, sleep: "7h 30m" });
  });
});
