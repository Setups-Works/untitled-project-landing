import { describe, expect, it } from "vitest";
import { itemPath, markCreated, parseChatAction, parseChatActions } from "../../src/lib/chat-actions";

const journal = { kind: "journal", body: "I met her.", entry_date: "2026-08-07" };
const task = { kind: "task", title: "Buy a rose", description: "", due_date: "2026-08-07" };
const note = { kind: "note", title: "Buy a watch", body: "For her, later." };
const block = (o: unknown) => `<create-item>${JSON.stringify(o)}</create-item>`;
const reply = `Here is what I prepared. These are drafts for review.\n\n${block(journal)}\n${block(task)}\n${block(note)}`;

describe("parseChatActions", () => {
  it("returns the visible text and every draft, in order", () => {
    const r = parseChatActions(reply);
    expect(r.body).toBe("Here is what I prepared. These are drafts for review.");
    expect(r.proposals.map((p) => p.action.kind)).toEqual(["journal", "task", "note"]);
    expect(r.proposals.map((p) => p.index)).toEqual([0, 1, 2]);
    expect(r.proposals.every((p) => p.created === null)).toBe(true);
  });

  it("returns plain text untouched, with no drafts", () => {
    expect(parseChatActions("Just an answer.")).toEqual({ body: "Just an answer.", proposals: [] });
  });

  it("drops invalid JSON and invalid drafts without showing the markup", () => {
    const r = parseChatActions(
      `Text\n<create-item>{not json}</create-item>\n${block({ kind: "task", title: "", description: "", due_date: null })}\n${block({ kind: "note", title: "ok", body: "" })}`,
    );
    expect(r.proposals).toHaveLength(1);
    expect(r.proposals[0].action).toMatchObject({ kind: "note", title: "ok" });
    expect(r.body).toBe("Text");
  });

  it("rejects malformed dates and unknown kinds", () => {
    expect(parseChatActions(block({ kind: "task", title: "x", description: "", due_date: "tomorrow" })).proposals).toHaveLength(0);
    expect(parseChatActions(block({ kind: "email", to: "a@b.co" })).proposals).toHaveLength(0);
  });

  it("keeps at most six drafts", () => {
    const many = Array.from({ length: 9 }, (_, i) => block({ kind: "note", title: `n${i}`, body: "" })).join("\n");
    expect(parseChatActions(many).proposals).toHaveLength(6);
  });

  it("hides a draft that was cut off mid-block", () => {
    const r = parseChatActions(`Done.\n${block(note)}\n<create-item>{"kind":"task","ti`);
    expect(r.body).toBe("Done.");
    expect(r.proposals).toHaveLength(1);
  });
});

describe("markCreated", () => {
  it("marks one draft as created and leaves the others pending", () => {
    const text = markCreated(reply, 1, { kind: "task", path: "/dashboard/todo?task=abc" }, task as never);
    const r = parseChatActions(text);
    expect(r.proposals.map((p) => Boolean(p.created))).toEqual([false, true, false]);
    expect(r.proposals[1].created).toEqual({ kind: "task", path: "/dashboard/todo?task=abc" });
    expect(r.proposals[1].action).toMatchObject({ title: "Buy a rose" });
    expect(r.body).toBe("Here is what I prepared. These are drafts for review.");
  });

  it("keeps working after every draft has been created", () => {
    let text = reply;
    for (const [i, p] of parseChatActions(reply).proposals.entries())
      text = markCreated(text, i, { kind: p.action.kind, path: `/p/${i}` }, p.action);
    const r = parseChatActions(text);
    expect(r.proposals.every((p) => p.created)).toBe(true);
    expect(parseChatAction(text).action).toBeNull();
  });

  it("is a no-op for an index that does not exist", () => {
    expect(markCreated(reply, 7, { kind: "note", path: "/x" }, note as never)).toBe(reply);
  });
});

describe("parseChatAction (first pending draft)", () => {
  it("returns the first draft that is not created yet", () => {
    const text = markCreated(reply, 0, { kind: "journal", path: "/j" }, journal as never);
    expect(parseChatAction(text).action).toMatchObject({ kind: "task" });
  });
});

describe("itemPath", () => {
  it("links to the saved item", () => {
    expect(itemPath("note", "a b")).toBe("/dashboard/notes?note=a%20b");
    expect(itemPath("task", "1")).toBe("/dashboard/todo?task=1");
    expect(itemPath("journal", "1", "2026-08-07")).toBe("/dashboard/journal?d=2026-08-07");
  });
});
