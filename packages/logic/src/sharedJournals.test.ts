import { describe, expect, it } from "vitest";
import type { SharedJournalEntry } from "@untitled/types";
import { groupByDay, initials, journalFilePath, personName, toneFor } from "./sharedJournals";

const person = (name: string, username: string | null = null) => ({ id: "1", name, username, image: null });
const entry = (id: string, entry_date: string) => ({ id, entry_date }) as SharedJournalEntry;

describe("shared journal helpers", () => {
  it("names people by name, then @username, then a fallback", () => {
    expect(personName(person("Ada Lovelace", "ada"))).toBe("Ada Lovelace");
    expect(personName(person("  ", "ada"))).toBe("@ada");
    expect(personName(person("", null))).toBe("Someone");
  });

  it.each([
    ["Ada Lovelace", null, "AL"],
    ["ada", null, "A"],
    ["", "grace.hopper", "GH"],
    ["", null, "?"],
  ])("initials of %j / %j is %j", (name, username, want) => {
    expect(initials(person(name, username))).toBe(want);
  });

  it("gives the same person the same colour every time", () => {
    expect(toneFor("abc")).toBe(toneFor("abc"));
    expect(["violet", "blue", "green", "amber", "clay", "mint", "gold", "sand"]).toContain(toneFor("another-id"));
  });

  it("groups consecutive entries by day", () => {
    const groups = groupByDay([entry("a", "2026-10-20"), entry("b", "2026-10-20"), entry("c", "2026-10-19")]);
    expect(groups.map((g) => [g.date, g.entries.map((e) => e.id)])).toEqual([
      ["2026-10-20", ["a", "b"]],
      ["2026-10-19", ["c"]],
    ]);
  });

  it("builds the upload path the server accepts", () => {
    expect(journalFilePath("u", "j", "x", "a.png")).toBe("u/shared-journal/j/x-a.png");
  });
});
