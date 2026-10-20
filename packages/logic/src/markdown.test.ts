import { describe, expect, it } from "vitest";
import { appLinkShortcuts, isLinkAddress, itemTarget, linkMarkdown, parseInline, parseMarkdown } from "./markdown";

describe("links for the editor", () => {
  it("accepts web links and the app's own pages and nothing else", () => {
    for (const ok of ["https://example.com/a?b=1", "http://x.dev", "/dashboard/health", "/dashboard/health?d=2026-10-21", "/dashboard/journal?d=2026-10-21"]) expect(isLinkAddress(ok)).toBe(true);
    for (const bad of ["", "example.com", "javascript:alert(1)", "/etc/passwd", "https://a b.com", "https://x.dev/(1)"]) expect(isLinkAddress(bad)).toBe(false);
  });

  it("builds the link text and keeps its syntax intact", () => {
    expect(linkMarkdown("my [site]", " https://x.dev ")).toBe("[my site](https://x.dev)");
    expect(linkMarkdown("", "https://x.dev")).toBe("[https://x.dev](https://x.dev)");
  });

  it("offers shortcuts that are valid addresses", () => {
    for (const s of appLinkShortcuts("2026-10-21")) expect(isLinkAddress(s.href)).toBe(true);
  });
});

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
    expect(parseInline("Sleep: *not recorded*")).toEqual([
      { type: "text", text: "Sleep: " },
      { type: "em", text: "not recorded" },
    ]);
    expect(parseInline("[Open in Health](/dashboard/health?d=2026-10-21) and [all](/dashboard/health)").map((i) => i.type)).toEqual(["item", "text", "item"]);
    expect(parseInline("5 * 3 * 2").map((i) => i.type)).toEqual(["text"]); // spaced asterisks are maths, not emphasis
    expect(parseInline("**bold** and *soft*").map((i) => i.type)).toEqual(["strong", "text", "em"]);
    const item = parseInline('[Buy](/dashboard/todo?task=abc "To-do · Buy")')[0];
    expect(item).toMatchObject({ type: "item", href: "/dashboard/todo?task=abc", tip: "To-do · Buy" });
    expect(parseInline("[x](/etc/passwd)")[0]?.type).toBe("text");
    expect(itemTarget("/dashboard/notes?note=n1")).toEqual({ kind: "note", id: "n1" });
    expect(itemTarget("/dashboard/health")).toEqual({ kind: "health", id: "" });
    expect(itemTarget("/dashboard/health?d=2026-10-21")).toEqual({ kind: "health", id: "2026-10-21" });
    expect(itemTarget("/dashboard/health?d=bad")).toBeNull();
    expect(itemTarget("/elsewhere")).toBeNull();
  });
});
