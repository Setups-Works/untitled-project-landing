import { describe, expect, it } from "vitest";
import { plainEntryText, wrapLines } from "./entryCard";

const width = (s: string) => s.length * 10; // every character 10 px wide

describe("entry picture card", () => {
  it("removes Markdown syntax but keeps the text and its structure", () => {
    const md = "# Day\n\nWent **far** and *fast* with [a friend](https://x.dev).\n\n- one\n- two\n\n- [x] done\n- [ ] todo";
    expect(plainEntryText(md)).toBe("Day\n\nWent far and fast with a friend.\n\n• one\n• two\n\n☑ done\n☐ todo");
  });

  it("wraps on words, keeps paragraph breaks and splits a word longer than a line", () => {
    expect(wrapLines("aaa bbb ccc ddd", 70, width)).toEqual(["aaa bbb", "ccc ddd"]);
    expect(wrapLines("one\n\ntwo", 100, width)).toEqual(["one", "", "two"]);
    expect(wrapLines("abcdefghij", 40, width)).toEqual(["abcd", "efgh", "ij"]);
  });

  it("ends with an ellipsis when there is more text than lines", () => {
    const lines = wrapLines("a b c d e f", 10, width, 3);
    expect(lines).toHaveLength(3);
    expect(lines[2]).toMatch(/…$/);
  });

  it("copes with empty text", () => {
    expect(plainEntryText("")).toBe("");
    expect(wrapLines("", 100, width)).toEqual([]);
  });
});
