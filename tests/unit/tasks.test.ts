import { describe, expect, it } from "vitest";
import { applyOpts, DEFAULT_OPTS, groupTasks, inView, isOpen, isOverdue, isView, nextDue } from "../../src/lib/tasks";
import type { Task, TaskList } from "../../src/lib/workspace";

const TODAY = "2026-10-07";
let n = 0;
const task = (over: Partial<Task> = {}): Task => ({
  id: `t${++n}`,
  title: `Task ${n}`,
  description: "",
  priority: 4,
  list_id: null,
  due_date: null,
  done: false,
  done_at: null,
  cancelled: false,
  archived: false,
  recurrence: null,
  created_at: `2026-10-0${(n % 9) + 1}T10:00:00Z`,
  ...over,
});

describe("nextDue (repeating tasks)", () => {
  it.each([
    ["daily", "2026-10-06", "2026-10-07", "2026-10-08"], // strictly after today, even if the task is overdue
    ["daily", "2026-10-07", "2026-10-07", "2026-10-08"],
    ["daily", "2026-10-20", "2026-10-07", "2026-10-21"], // a future task moves one step
    ["weekly", "2026-10-07", "2026-10-07", "2026-10-14"],
    ["weekly", "2026-09-01", "2026-10-07", "2026-10-13"], // catches up to the first future week
    ["monthly", "2026-01-31", "2026-01-31", "2026-02-28"], // short months clamp the day
    ["monthly", "2028-01-31", "2028-01-31", "2028-02-29"],
    ["yearly", "2028-02-29", "2028-02-29", "2029-02-28"],
    ["yearly", "2026-10-07", "2026-10-07", "2027-10-07"],
  ])("%s from %s (today %s) → %s", (rule, due, today, expected) => expect(nextDue(due, rule, today)).toBe(expected));

  it("skips weekends for weekdays", () => {
    // 2026-10-09 is a Friday → next weekday is Monday 2026-10-12.
    expect(nextDue("2026-10-09", "weekdays", "2026-10-09")).toBe("2026-10-12");
    expect(nextDue("2026-10-07", "weekdays", "2026-10-07")).toBe("2026-10-08");
  });

  it("returns the date unchanged for an unknown rule instead of looping forever", () => {
    expect(nextDue("2026-10-07", "fortnightly", "2026-10-07")).toBe("2026-10-07");
  });
});

describe("isOpen / isOverdue", () => {
  it("treats done, cancelled and archived tasks as closed", () => {
    expect(isOpen(task())).toBe(true);
    expect(isOpen(task({ done: true }))).toBe(false);
    expect(isOpen(task({ cancelled: true }))).toBe(false);
    expect(isOpen(task({ archived: true }))).toBe(false);
  });
  it("is overdue only when open and dated before today", () => {
    expect(isOverdue(task({ due_date: "2026-10-06" }), TODAY)).toBe(true);
    expect(isOverdue(task({ due_date: TODAY }), TODAY)).toBe(false);
    expect(isOverdue(task({ due_date: "2026-10-06", done: true }), TODAY)).toBe(false);
    expect(isOverdue(task(), TODAY)).toBe(false);
  });
});

describe("inView", () => {
  const list = "11111111-1111-4111-8111-111111111111";
  it("inbox: tasks without a list that are not done", () => {
    expect(inView(task(), "inbox", TODAY, false)).toBe(true);
    expect(inView(task({ list_id: list }), "inbox", TODAY, false)).toBe(false);
    expect(inView(task({ done: true }), "inbox", TODAY, false)).toBe(false);
    expect(inView(task({ done: true }), "inbox", TODAY, true)).toBe(true);
  });
  it("today: due today or earlier, hiding done tasks unless asked", () => {
    expect(inView(task({ due_date: TODAY }), "today", TODAY, false)).toBe(true);
    expect(inView(task({ due_date: "2026-10-01" }), "today", TODAY, false)).toBe(true);
    expect(inView(task({ due_date: "2026-10-08" }), "today", TODAY, false)).toBe(false);
    expect(inView(task({ due_date: TODAY, done: true }), "today", TODAY, false)).toBe(false);
    expect(inView(task({ due_date: TODAY, done: true }), "today", TODAY, true)).toBe(true);
    expect(inView(task(), "today", TODAY, false)).toBe(false);
  });
  it("upcoming: dated, not done", () => {
    expect(inView(task({ due_date: "2026-10-20" }), "upcoming", TODAY, false)).toBe(true);
    expect(inView(task({ due_date: "2026-10-20", done: true }), "upcoming", TODAY, false)).toBe(false);
  });
  it("archived and cancelled tasks only show in their own views", () => {
    expect(inView(task({ archived: true }), "archived", TODAY, false)).toBe(true);
    expect(inView(task({ archived: true }), "inbox", TODAY, true)).toBe(false);
    expect(inView(task({ cancelled: true }), "cancelled", TODAY, false)).toBe(true);
    expect(inView(task({ cancelled: true }), "today", TODAY, true)).toBe(false);
    expect(inView(task(), "archived", TODAY, false)).toBe(false);
  });
  it("list views match their list id", () => {
    expect(inView(task({ list_id: list }), `list:${list}`, TODAY, false)).toBe(true);
    expect(inView(task({ list_id: "other" }), `list:${list}`, TODAY, false)).toBe(false);
  });
  it("recurring and completed", () => {
    expect(inView(task({ recurrence: "daily" }), "recurring", TODAY, false)).toBe(true);
    expect(inView(task({ recurrence: "daily", done: true }), "recurring", TODAY, false)).toBe(false);
    expect(inView(task({ done: true }), "completed", TODAY, false)).toBe(true);
  });
});

describe("isView", () => {
  it("accepts the built-in views and well-formed list views only", () => {
    expect(isView("today")).toBe(true);
    expect(isView("list:11111111-1111-4111-8111-111111111111")).toBe(true);
    expect(isView("list:not-a-uuid")).toBe(false);
    expect(isView("nope")).toBe(false);
    expect(isView(null)).toBe(false);
  });
});

describe("applyOpts", () => {
  const a = task({ title: "b", priority: 2, due_date: "2026-10-09", created_at: "2026-10-01T00:00:00Z" });
  const b = task({ title: "a", priority: 1, due_date: "2026-10-08", created_at: "2026-10-02T00:00:00Z" });
  const c = task({ title: "c", priority: 4, due_date: null, created_at: "2026-10-03T00:00:00Z" });
  it("sorts by date with undated tasks last", () => {
    expect(applyOpts([a, b, c], DEFAULT_OPTS).map((t) => t.title)).toEqual(["a", "b", "c"]);
  });
  it("sorts by name and priority, and reverses", () => {
    expect(applyOpts([a, b, c], { ...DEFAULT_OPTS, sortBy: "name" }).map((t) => t.title)).toEqual(["a", "b", "c"]);
    expect(applyOpts([a, b, c], { ...DEFAULT_OPTS, sortBy: "priority" }).map((t) => t.priority)).toEqual([1, 2, 4]);
    expect(applyOpts([a, b, c], { ...DEFAULT_OPTS, sortBy: "name", dir: "desc" }).map((t) => t.title)).toEqual(["c", "b", "a"]);
  });
  it("filters by priority without mutating the input", () => {
    const input = [a, b, c];
    expect(applyOpts(input, { ...DEFAULT_OPTS, priority: 2 })).toEqual([a]);
    expect(input).toEqual([a, b, c]);
  });
});

describe("groupTasks", () => {
  const lists: TaskList[] = [{ id: "L1", name: "Work", color: "blue", created_at: "2026-10-01T00:00:00Z" }];
  it("returns one untitled group when not grouping", () => {
    const g = groupTasks([task(), task()], "none", lists, TODAY);
    expect(g).toHaveLength(1);
    expect(g[0].tasks).toHaveLength(2);
  });
  it("groups by date with overdue, today and later tones", () => {
    const g = groupTasks(
      [task({ due_date: "2026-10-01" }), task({ due_date: TODAY }), task({ due_date: "2026-10-30" }), task()],
      "date",
      lists,
      TODAY,
    );
    const tone = Object.fromEntries(g.map((x) => [x.key, x.tone]));
    expect(tone["2026-10-01"]).toBe("clay");
    expect(tone[TODAY]).toBe("amber");
    expect(tone["2026-10-30"]).toBe("mint");
    expect(tone.none).toBe("sand");
  });
  it("groups by list, with unlisted tasks in the Inbox", () => {
    const g = groupTasks([task({ list_id: "L1" }), task()], "list", lists, TODAY);
    expect(g.map((x) => x.title).sort()).toEqual(["Inbox", "Work"]);
  });
  it("groups by priority", () => {
    const g = groupTasks([task({ priority: 1 }), task({ priority: 1 }), task({ priority: 3 })], "priority", lists, TODAY);
    expect(g.find((x) => x.key === "p1")?.tasks).toHaveLength(2);
  });
});
