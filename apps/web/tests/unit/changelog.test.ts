import { describe, expect, it } from "vitest";
import { filterReleases, RELEASES } from "../../src/features/changelog/releases";

describe("changelog", () => {
  it("is ordered newest first", () => {
    const dates = RELEASES.map((r) => r.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("only keeps the chosen platform and drops releases left empty", () => {
    const web = filterReleases(RELEASES, "web");
    expect(web.every((r) => r.changes.every((c) => c.platform === "web"))).toBe(true);
    expect(web.length).toBeGreaterThan(0);
    expect(filterReleases(RELEASES, "all")).toBe(RELEASES);
  });

  it("uses plain v1.2.3 tags for app versions", () => {
    for (const r of RELEASES) if (r.appVersion) expect(r.appVersion).toMatch(/^v\d+\.\d+\.\d+$/);
  });
});
