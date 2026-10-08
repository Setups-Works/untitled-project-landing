import { describe, expect, it } from "vitest";
import { ageShort, groupByDate, isUnread, prettyTitle, chatGreeting } from "../../src/lib/chat";
import { analyse } from "../../src/lib/insights";
import { displayTitle, lineCount, plural, safeName, TONES, toneOf, wordCount } from "../../src/lib/notes";
import { cleanOnboarding, ONBOARDING_STEPS, shouldShowOnboarding } from "../../src/lib/onboarding";
import { cleanPrefs, DEFAULT_PREFS } from "../../src/lib/prefs";
import { clean, EMAIL_RE } from "../../src/lib/validate";
import { safeNext } from "../../src/lib/auth/redirect";
import type { Chat } from "../../src/lib/workspace";

describe("validate", () => {
  it.each(["a@b.co", "first.last@example.com", "x+tag@sub.domain.org"])("accepts %s", (e) => expect(EMAIL_RE.test(e)).toBe(true));
  it.each(["", "plain", "a@b", "a @b.com", "@b.com", "a@b.c"])("rejects %j", (e) => expect(EMAIL_RE.test(e)).toBe(false));
  it("clean() strips control characters, trims and limits length", () => {
    expect(clean("  hi\u0000there\n ")).toBe("hi there");
    expect(clean("x".repeat(500), 10)).toHaveLength(10);
    expect(clean(42)).toBe("");
    expect(clean(null)).toBe("");
  });
});

describe("safeNext (open-redirect guard)", () => {
  it("keeps same-site paths", () => expect(safeNext("/dashboard/notes?x=1")).toBe("/dashboard/notes?x=1"));
  it.each(["https://evil.test", "//evil.test", "javascript:alert(1)", "", null, undefined])("falls back for %j", (v) =>
    expect(safeNext(v)).toBe("/dashboard"),
  );
  it("supports a custom fallback", () => expect(safeNext("//x", "/home")).toBe("/home"));
});

describe("cleanPrefs", () => {
  const categories = ["Others", "Work"];
  it("returns the defaults for garbage input", () => {
    for (const v of [null, undefined, "x", 7, [], {}]) expect(cleanPrefs(v, categories)).toEqual(DEFAULT_PREFS);
  });
  it("keeps valid values and ignores invalid ones", () => {
    const p = cleanPrefs(
      { timeFormat: "24h", weekStart: "sun", density: "compact", reduceMotion: true, todoView: "upcoming", defaultCategory: "Work" },
      categories,
    );
    expect(p).toMatchObject({
      timeFormat: "24h",
      weekStart: "sun",
      density: "compact",
      reduceMotion: true,
      todoView: "upcoming",
      defaultCategory: "Work",
    });
    const bad = cleanPrefs({ timeFormat: "13h", defaultCategory: "Nope", todoView: "x", reduceMotion: "yes" }, categories);
    expect(bad).toEqual(DEFAULT_PREFS);
  });
});

describe("onboarding", () => {
  it("normalises stored state", () => {
    expect(cleanOnboarding(undefined)).toEqual({ completed: false, step: 0, skippedAt: null });
    expect(cleanOnboarding({ completed: true, step: 2 })).toMatchObject({ completed: true, step: 2 });
    expect(cleanOnboarding({ step: 99 }).step).toBe(0);
    expect(cleanOnboarding({ step: -1 }).step).toBe(0);
    expect(cleanOnboarding({ step: ONBOARDING_STEPS - 1 }).step).toBe(ONBOARDING_STEPS - 1);
    expect(cleanOnboarding({ skippedAt: "not a date" }).skippedAt).toBeNull();
  });
  it("shows to new and unfinished users, hides when completed, snoozes a skip for 3 days", () => {
    const now = Date.parse("2026-10-10T12:00:00Z");
    expect(shouldShowOnboarding(cleanOnboarding({}), now)).toBe(true);
    expect(shouldShowOnboarding(cleanOnboarding({ completed: true }), now)).toBe(false);
    expect(shouldShowOnboarding(cleanOnboarding({ skippedAt: "2026-10-09T12:00:00Z" }), now)).toBe(false); // 1 day ago
    expect(shouldShowOnboarding(cleanOnboarding({ skippedAt: "2026-10-06T11:00:00Z" }), now)).toBe(true); // > 3 days ago
  });
});

describe("notes helpers", () => {
  it("wordCount / lineCount / plural", () => {
    expect(wordCount("")).toBe(0);
    expect(wordCount("  one   two\nthree ")).toBe(3);
    expect(lineCount("")).toBe(0);
    expect(lineCount("a\nb\n")).toBe(3);
    expect(plural(1, "note")).toBe("1 note");
    expect(plural(2, "note")).toBe("2 notes");
  });
  it("displayTitle prefers the title, then the first line, then 'Untitled'", () => {
    expect(displayTitle({ title: " Plan ", body: "x" })).toBe("Plan");
    expect(displayTitle({ title: "", body: "\n\n## Heading line\nmore" })).toBe("Heading line");
    expect(displayTitle({ title: "", body: "- [ ] buy milk" })).toBe("buy milk");
    expect(displayTitle({ title: "", body: "  " })).toBe("Untitled");
  });
  it("safeName makes uploaded file names safe for storage keys", () => {
    expect(safeName("../../etc/passwd")).not.toContain("/");
    expect(safeName("my photo (1).jpg")).toBe("my photo _1_.jpg");
    expect(safeName("")).toBe("file");
    expect(safeName("x".repeat(200))).toHaveLength(80);
  });
  it("toneOf honours a chosen colour and is stable otherwise", () => {
    expect(toneOf({ id: "a", color: "blue" })).toBe("blue");
    const auto = toneOf({ id: "some-note-id", color: null });
    expect(TONES).toContain(auto);
    expect(auto).not.toBe("sand");
    expect(toneOf({ id: "some-note-id", color: null })).toBe(auto);
    expect(toneOf({ id: "x", color: "not-a-tone" })).not.toBe("not-a-tone");
  });
});

describe("chat helpers", () => {
  it("prettyTitle", () => {
    expect(prettyTitle("  hello world!! ")).toBe("Hello world");
    expect(prettyTitle("   ")).toBe("New chat");
  });
  it("ageShort", () => {
    const now = Date.parse("2026-10-07T12:00:00Z");
    const t = (s: number) => new Date(now - s * 1000).toISOString();
    expect(ageShort(t(5), now)).toBe("now");
    expect(ageShort(t(120), now)).toBe("2m");
    expect(ageShort(t(7200), now)).toBe("2h");
    expect(ageShort(t(3 * 86400), now)).toBe("3d");
    expect(ageShort(t(90 * 86400), now)).toBe("3mo");
    expect(ageShort(t(800 * 86400), now)).toBe("2y");
  });
  it("chatGreeting follows the hour", () => {
    expect(chatGreeting("Sam", 8).title).toBe("Good morning, Sam");
    expect(chatGreeting("Sam", 14).title).toBe("Good afternoon, Sam");
    expect(chatGreeting("Sam", 19).title).toBe("Good evening, Sam");
    expect(chatGreeting("Sam", 2).title).toBe("Still up, Sam?");
  });
  it("isUnread / groupByDate", () => {
    const base = { id: "1", title: "t", pinned: false, folder_id: null, share_token: null } as unknown as Chat;
    expect(isUnread({ ...base, updated_at: "2026-10-07T10:00:05Z", last_read_at: "2026-10-07T10:00:00Z" })).toBe(true);
    expect(isUnread({ ...base, updated_at: "2026-10-07T10:00:00Z", last_read_at: "2026-10-07T10:00:00Z" })).toBe(false);
    const now = new Date("2026-10-07T15:00:00Z");
    const chats = [
      { ...base, id: "a", updated_at: "2026-10-07T09:00:00Z" },
      { ...base, id: "b", updated_at: "2026-10-06T09:00:00Z" },
      { ...base, id: "c", updated_at: "2026-10-03T09:00:00Z" },
      { ...base, id: "d", updated_at: "2026-09-20T09:00:00Z" },
    ] as Chat[];
    expect(
      groupByDate(chats, now)
        .map((g) => g.label)
        .slice(0, 4),
    ).toEqual(["Today", "Yesterday", "Previous 7 days", "Previous 30 days"]);
  });
});

describe("analyse (personality insights)", () => {
  it("needs a little data before it says anything", () => {
    expect(analyse([], [], []).enough).toBe(false);
    expect(analyse([], [{ entry_date: "2026-10-07", body: "hi", created_at: "2026-10-07T10:00:00Z" }], []).enough).toBe(false);
  });
  it("produces axes and a summary once there is enough to go on", () => {
    const now = new Date("2026-10-07T12:00:00Z");
    const entries = Array.from({ length: 5 }, (_, i) => ({
      entry_date: `2026-10-0${i + 1}`,
      body: "I felt great and happy today, proud of the progress",
      created_at: `2026-10-0${i + 1}T09:00:00Z`,
    }));
    const tasks = Array.from({ length: 4 }, (_, i) => ({
      due_date: "2026-10-05",
      done: true,
      done_at: "2026-10-05T10:00:00Z",
      created_at: `2026-10-0${i + 1}T08:00:00Z`,
      priority: 1,
      list_id: null,
      cancelled: false,
      archived: false,
      recurrence: null,
    }));
    const r = analyse(tasks, entries, [], now);
    expect(r.enough).toBe(true);
    expect(r.axes.length).toBeGreaterThan(0);
    for (const a of r.axes) (expect(a.value).toBeGreaterThanOrEqual(0), expect(a.value).toBeLessThanOrEqual(100));
    expect(r.summary.length).toBeGreaterThan(0);
  });
});
