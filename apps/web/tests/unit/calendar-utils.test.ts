import { describe, expect, it } from "vitest";
import type { CalendarEventItem } from "../../src/features/calendar/types";
import {
  draftToRow,
  eventDays,
  eventToDraft,
  groupEventsByDay,
  groupTasksByDay,
  layoutDay,
  monthCells,
  newDraft,
  shiftDate,
  titleFor,
  toneOf,
  weekDays,
} from "../../src/features/calendar/utils";
import type { Task } from "../../src/lib/workspace";

const ev = (id: string, start: string, end: string, extra: Partial<CalendarEventItem> = {}): CalendarEventItem => ({
  id,
  external_id: null,
  calendar_id: "primary",
  title: id,
  description: "",
  location: "",
  start_at: new Date(start).toISOString(),
  end_at: new Date(end).toISOString(),
  all_day: false,
  color: "blue",
  created_at: "",
  updated_at: "",
  ...extra,
});

describe("calendar utils", () => {
  it("falls back to blue for an unknown colour", () => {
    expect(toneOf("violet")).toBe("violet");
    expect(toneOf("hotpink")).toBe("blue");
  });

  it("lists every day a multi-day event touches, and stops at midnight", () => {
    expect(eventDays(ev("a", "2026-10-10T09:00:00", "2026-10-12T10:00:00"))).toEqual(["2026-10-10", "2026-10-11", "2026-10-12"]);
    expect(eventDays(ev("b", "2026-10-10T22:00:00", "2026-10-11T00:00:00"))).toEqual(["2026-10-10"]);
  });

  it("groups events by day with all-day first, then by start time", () => {
    const m = groupEventsByDay([
      ev("late", "2026-10-10T15:00:00", "2026-10-10T16:00:00"),
      ev("early", "2026-10-10T08:00:00", "2026-10-10T09:00:00"),
      ev("all", "2026-10-10T00:00:00", "2026-10-10T23:59:59", { all_day: true }),
    ]);
    expect(m.get("2026-10-10")?.map((e) => e.id)).toEqual(["all", "early", "late"]);
  });

  it("leaves cancelled, archived and undated tasks off the calendar", () => {
    const t = (id: string, o: Partial<Task>) => ({ id, due_date: "2026-10-10", cancelled: false, archived: false, ...o }) as Task;
    const m = groupTasksByDay([t("ok", {}), t("x", { cancelled: true }), t("y", { archived: true }), t("z", { due_date: null })]);
    expect(m.get("2026-10-10")?.map((x) => x.id)).toEqual(["ok"]);
  });

  it("puts overlapping events side by side and lets later ones reuse the full width", () => {
    const placed = layoutDay(
      [
        ev("a", "2026-10-10T09:00:00", "2026-10-10T11:00:00"),
        ev("b", "2026-10-10T10:00:00", "2026-10-10T11:30:00"),
        ev("c", "2026-10-10T13:00:00", "2026-10-10T14:00:00"),
      ],
      "2026-10-10",
    );
    const by = Object.fromEntries(placed.map((p) => [p.ev.id, p]));
    expect([by.a.col, by.b.col, by.a.cols, by.b.cols]).toEqual([0, 1, 2, 2]);
    expect([by.c.col, by.c.cols]).toEqual([0, 1]);
  });

  it("round-trips a draft through the stored row", () => {
    const d = { ...newDraft("2026-10-10", "09:30"), title: "  Standup ", color: "mint" };
    const row = draftToRow(d);
    expect(row.title).toBe("Standup");
    const back = eventToDraft({ ...ev("x", "2026-10-10T09:30:00", "2026-10-10T10:30:00"), ...row, id: "x" } as CalendarEventItem);
    expect([back.start_date, back.start_time, back.end_time, back.color]).toEqual(["2026-10-10", "09:30", "10:30", "mint"]);
  });

  it("rolls a late-evening new event's end into the next day", () => {
    const d = newDraft("2026-10-10", "23:30");
    expect([d.end_date, d.end_time]).toEqual(["2026-10-11", "00:30"]);
  });

  it("builds a 6-week month grid and a week starting on the chosen day", () => {
    const cells = monthCells(new Date(2026, 9, 10), "mon");
    expect(cells).toHaveLength(42);
    expect(cells[0].getDay()).toBe(1);
    expect(weekDays(new Date(2026, 9, 10), "sun")[0].getDay()).toBe(0);
  });

  it("steps by the right amount per view and titles the period", () => {
    const d = new Date(2026, 9, 31);
    expect(shiftDate(d, "month", 1).getMonth()).toBe(10); // Oct 31 → Nov, not Dec 1
    expect(shiftDate(d, "week", -1).getDate()).toBe(24);
    expect(titleFor(new Date(2026, 9, 10), "month", "mon")).toMatch(/October 2026/);
    expect(titleFor(new Date(2026, 9, 10), "week", "mon")).toMatch(/Oct 5 – 11, 2026/);
  });
});
