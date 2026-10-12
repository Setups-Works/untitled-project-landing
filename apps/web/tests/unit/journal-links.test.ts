import { describe, expect, it } from "vitest";
import { describeItem, markCreated, parseChatActions, resolveRefs, stripRefs } from "../../src/lib/chat-actions";

const body = "I went to see her. I need to [[buy a rose for her|t1]] and she said to [[purchase a watch later|n1]].";

describe("journal link markers", () => {
  it("stripRefs leaves the plain words", () => {
    expect(stripRefs(body)).toBe("I went to see her. I need to buy a rose for her and she said to purchase a watch later.");
    expect(stripRefs("no markers here")).toBe("no markers here");
  });

  it("resolveRefs links the items that exist and leaves the rest as plain words", () => {
    const out = resolveRefs(body, new Map([["t1", { path: "/dashboard/todo?task=abc", tip: "To-do · Buy a rose · due 7 Aug 2026" }]]));
    expect(out).toContain('[buy a rose for her](/dashboard/todo?task=abc "To-do · Buy a rose · due 7 Aug 2026")');
    expect(out).toContain("and she said to purchase a watch later."); // note not created yet: plain words
    expect(out).not.toContain("[[");
  });

  it("a link made by resolveRefs only ever points at the item's own in-app path", () => {
    const items = new Map([["t1", { path: "/dashboard/todo?task=a", tip: "To-do" }]]);
    // Brackets are stripped from the words, so they cannot open a second link target.
    expect(resolveRefs("[[evil[x(javascript:alert(1))|t1]]", items)).toBe('[evilx(javascript:alert(1))](/dashboard/todo?task=a "To-do")');
    // Markers that are not well formed stay inert text, and the renderer only turns in-app and http(s) targets into links.
    expect(resolveRefs("[[evil](javascript:alert(1)) x|t1]]", items)).toBe("[[evil](javascript:alert(1)) x|t1]]");
  });

  it("ignores markers with a malformed ref", () => {
    expect(resolveRefs("[[words|BAD REF]]", new Map())).toBe("[[words|BAD REF]]");
  });
});

describe("describeItem (hover text)", () => {
  it("describes a to-do with its due date and a note with an excerpt", () => {
    expect(describeItem({ kind: "task", title: "Buy a rose", description: "", due_date: "2026-08-07" })).toBe(
      "To-do · Buy a rose · due 7 Aug 2026",
    );
    expect(describeItem({ kind: "task", title: "Call", description: "", due_date: null })).toBe("To-do · Call");
    expect(describeItem({ kind: "note", title: "Watch", body: "Buy her\na watch" })).toBe("Note · Watch · Buy her a watch");
  });
  it('removes characters that would break a Markdown link title ("), [ ] ( )', () => {
    const tip = describeItem({ kind: "task", title: 'Say "hi" [now] (soon)', description: "", due_date: null });
    expect(tip).not.toMatch(/["[\]()]/);
  });
});

describe("refs in drafts", () => {
  it("keeps a valid ref and drops drafts with a bad one", () => {
    const ok = `<create-item>{"kind":"task","ref":"t1","title":"x","description":"","due_date":null}</create-item>`;
    const bad = `<create-item>{"kind":"task","ref":"not valid!","title":"x","description":"","due_date":null}</create-item>`;
    expect(parseChatActions(ok).proposals[0].action).toMatchObject({ ref: "t1" });
    expect(parseChatActions(bad).proposals).toHaveLength(0);
  });

  it("remembers the id of a created item", () => {
    const draft = { kind: "note" as const, title: "n", body: "", ref: "n1" };
    const text = markCreated(
      `<create-item>${JSON.stringify(draft)}</create-item>`,
      0,
      { kind: "note", path: "/dashboard/notes?note=1", id: "1" },
      draft,
    );
    expect(parseChatActions(text).proposals[0].created).toEqual({ kind: "note", path: "/dashboard/notes?note=1", id: "1" });
  });
});
