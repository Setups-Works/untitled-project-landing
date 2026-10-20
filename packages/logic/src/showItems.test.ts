import { describe, expect, it } from "vitest";
import { notesMatching, previewOf, tasksInScope } from "./showItems";

const today = "2026-10-21";
const task = (id: string, due: string | null, over: object = {}) => ({ id, title: id, due_date: due, done: false, ...over });

describe("show items", () => {
  const tasks = [
    task("late", "2026-10-19"),
    task("now", today),
    task("soon", "2026-10-25"),
    task("far", "2026-12-01"),
    task("someday", null),
    task("done", today, { done: true }),
    task("gone", today, { cancelled: true }),
  ];

  it.each([
    ["today", ["now"]],
    ["overdue", ["late"]],
    ["upcoming", ["soon"]],
    ["open", ["late", "now", "soon", "far", "someday"]],
  ] as const)("picks the %s to-dos, soonest first", (scope, want) => {
    expect(tasksInScope(tasks, scope, today, 10).items.map((t) => t.id)).toEqual(want);
  });

  it("cuts the list but reports how many matched", () => {
    const r = tasksInScope(tasks, "open", today, 2);
    expect(r.items).toHaveLength(2);
    expect(r.total).toBe(5);
  });

  it("finds notes by every word in the title or text, newest first", () => {
    const notes = [
      { id: "a", title: "Trip plan", body: "flights and hotel", updated_at: "2026-10-01" },
      { id: "b", title: "Groceries", body: "hotel soap", updated_at: "2026-10-10" },
      { id: "c", title: "Ideas", body: "nothing", updated_at: "2026-10-20" },
    ];
    expect(notesMatching(notes, "hotel", 10).items.map((n) => n.id)).toEqual(["b", "a"]);
    expect(notesMatching(notes, "HOTEL flights", 10).items.map((n) => n.id)).toEqual(["a"]);
    expect(notesMatching(notes, undefined, 2).items.map((n) => n.id)).toEqual(["c", "b"]);
  });

  it("previews Markdown as plain text", () => {
    expect(previewOf("# Day\n\n**Went** far")).toBe("Day Went far");
    expect(previewOf("x".repeat(50), 10).endsWith("…")).toBe(true);
  });
});
