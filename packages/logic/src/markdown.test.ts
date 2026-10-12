import { describe, expect, it } from "vitest";
import { itemTarget, parseInline, parseMarkdown } from "./markdown";

describe("markdown", () => {
  it("reads headings, lists, checklists, quotes and rules", () => {
    const b = parseMarkdown("# Title\n- one\n- two\n- [x] done\n- [ ] todo\n> quoted\n---\nplain");
    expect(b.map((x) => x.type)).toEqual(["heading", "list", "list", "quote", "hr", "p"]);
    expect(b[1]).toMatchObject({ type: "list", check: false, items: [{ text: "one" }, { text: "two" }] });
    expect(b[2]).toMatchObject({ type: "list", check: true, items: [{ done: true }, { done: false }] });
  });

  it("reads tables with alignment and pads short rows", () => {
    const b = parseMarkdown("| A | B |\n|:---|---:|\n| 1 |");
    expect(b[0]).toEqual({ type: "table", headers: ["A", "B"], aligns: ["left", "right"], rows: [["1", ""]] });
  });

  it("keeps code blocks verbatim", () => {
    expect(parseMarkdown("```ts\nconst a = 1;\n```")[0]).toEqual({ type: "code", lang: "ts", source: "const a = 1;" });
  });

  it("splits inline bold, code and safe links, and only accepts in-app item links", () => {
    expect(parseInline("a **b** `c` [d](https://x.dev)").map((i) => i.type)).toEqual(["text", "strong", "text", "code", "text", "link"]);
    const item = parseInline('[Buy](/dashboard/todo?task=abc "To-do · Buy")')[0];
    expect(item).toMatchObject({ type: "item", href: "/dashboard/todo?task=abc", tip: "To-do · Buy" });
    expect(parseInline("[x](/etc/passwd)")[0]?.type).toBe("text");
    expect(itemTarget("/dashboard/notes?note=n1")).toEqual({ kind: "note", id: "n1" });
    expect(itemTarget("/elsewhere")).toBeNull();
  });
});
