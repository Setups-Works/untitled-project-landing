import { describe, expect, it } from "vitest";
import { addDays, monthGrid } from "./dates";
import { applyOpts, DEFAULT_OPTS, inView, nextDue, nthRuleFor, recurrenceLabel, upcomingDates } from "./tasks";
import type { Task } from "@untitled/types";

const task = (over: Partial<Task>): Task => ({
  id: "1",
  title: "t",
  description: "",
  priority: 4,
  list_id: null,
  due_date: null,
  done: false,
  done_at: null,
  cancelled: false,
  archived: false,
  recurrence: null,
  created_at: "2026-01-01T00:00:00Z",
  ...over,
});

describe("repeat rules", () => {
  it("finds the next occurrence", () => {
    expect(nextDue("2026-10-12", "daily", "2026-10-12")).toBe("2026-10-13");
    expect(nextDue("2026-10-09", "weekdays", "2026-10-09")).toBe("2026-10-12"); // Friday -> Monday
    expect(nextDue("2026-01-31", "monthly", "2026-01-31")).toBe("2026-02-28");
    expect(nextDue("2026-10-14", "nth:2:wed", "2026-10-14")).toBe("2026-11-11");
  });
  it("describes and lists them", () => {
    expect(nthRuleFor("2026-10-14")).toBe("nth:2:wed");
    expect(recurrenceLabel("nth:2:wed")).toBe("Every month on the 2nd Wednesday");
    expect(upcomingDates("2026-10-12", "weekly", "2026-10-30")).toEqual(["2026-10-19", "2026-10-26"]);
  });
});

describe("views", () => {
  const today = "2026-10-12";
  it("puts tasks in the right smart view", () => {
    expect(inView(task({ due_date: "2026-10-10" }), "today", today, false)).toBe(true);
    expect(inView(task({ due_date: "2026-10-13" }), "upcoming", today, false)).toBe(true);
    expect(inView(task({ list_id: "x" }), "inbox", today, false)).toBe(false);
    expect(inView(task({ done: true }), "completed", today, false)).toBe(true);
    expect(inView(task({ archived: true }), "inbox", today, false)).toBe(false);
  });
  it("sorts by date then priority filter", () => {
    const a = task({ id: "a", due_date: "2026-10-14", priority: 1 });
    const b = task({ id: "b", due_date: "2026-10-13", priority: 2 });
    expect(applyOpts([a, b], DEFAULT_OPTS).map((t) => t.id)).toEqual(["b", "a"]);
    expect(applyOpts([a, b], { ...DEFAULT_OPTS, priority: 1 }).map((t) => t.id)).toEqual(["a"]);
  });
});

describe("dates", () => {
  it("adds days and builds a 6-week grid", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    const g = monthGrid(2026, 9, 0);
    expect(g).toHaveLength(42);
    expect(g).toContain("2026-10-12");
  });
});
