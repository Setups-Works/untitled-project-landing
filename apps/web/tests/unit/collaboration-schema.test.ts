import { SHARED_JOURNAL as LIMIT } from "@untitled/logic";
import { describe, expect, it } from "vitest";
import {
  entryCreate,
  feedQuery,
  inviteBody,
  journalName,
  usernameInput,
} from "../../src/server/services/collaboration/collaboration.schema";

describe("shared journal inputs", () => {
  it.each([
    ["ada", "ada"],
    ["@Ada.Lovelace", "ada.lovelace"],
    ["  grace_h  ", "grace_h"],
  ])("normalises the username %j to %j", (input, want) => {
    expect(usernameInput.parse(input)).toBe(want);
  });

  it.each(["", "ab", "a".repeat(LIMIT.usernameMax + 1), "has space", "emoji😀", "semi;colon"])("rejects the username %j", (input) => {
    expect(usernameInput.safeParse(input).success).toBe(false);
  });

  it("only lets an owner hand out editor or viewer", () => {
    expect(inviteBody.safeParse({ username: "ada", role: "viewer" }).success).toBe(true);
    expect(inviteBody.safeParse({ username: "ada", role: "owner" }).success).toBe(false);
    // The same field takes an email address, normalised to lower case.
    expect(inviteBody.parse({ username: "  Ada@Example.COM ", role: "editor" }).username).toBe("ada@example.com");
    expect(inviteBody.safeParse({ username: "ada@", role: "editor" }).success).toBe(false);
    expect(inviteBody.safeParse({ username: "not an@email", role: "editor" }).success).toBe(false);
  });

  it("trims journal names and enforces their length", () => {
    expect(journalName.parse({ name: "  Trip  " }).name).toBe("Trip");
    expect(journalName.safeParse({ name: "   " }).success).toBe(false);
    expect(journalName.safeParse({ name: "x".repeat(LIMIT.nameMax + 1) }).success).toBe(false);
  });

  it("fills in entry defaults and caps attachments", () => {
    expect(entryCreate.parse({ entry_date: "2026-10-20" })).toEqual({ entry_date: "2026-10-20", body: "", kind: "text", attachments: [] });
    const file = { path: "p", name: "n", type: "image/png", size: 1 };
    expect(entryCreate.safeParse({ entry_date: "2026-10-20", attachments: Array(LIMIT.attachmentsMax + 1).fill(file) }).success).toBe(
      false,
    );
  });

  it("reads the feed's cursor and page size with sensible bounds", () => {
    expect(feedQuery.parse({})).toEqual({ limit: LIMIT.pageSize });
    expect(feedQuery.parse({ cursor: "2026-10-01", limit: "20" })).toEqual({ cursor: "2026-10-01", limit: 20 });
    expect(feedQuery.safeParse({ limit: String(LIMIT.pageMax + 1) }).success).toBe(false);
    expect(feedQuery.safeParse({ cursor: "yesterday" }).success).toBe(false);
  });
});
