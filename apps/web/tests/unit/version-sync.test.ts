import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RELEASES } from "../../src/features/changelog/releases";

/**
 * One version number, in four places: the app's config (shown in Settings and compared with GitHub Releases), the app's and the repo's
 * package.json, and the newest release in the changelog. A release bumps them together; this fails when one is left behind.
 */
const read = (path: string) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8")) as { version?: string; expo?: { version: string } };
const appConfig = read("../../../mobile/app.json").expo!.version;

describe("app version", () => {
  it("is the same in app.json and both package.json files", () => {
    expect(read("../../../mobile/package.json").version).toBe(appConfig);
    expect(read("../../../../package.json").version).toBe(appConfig);
  });

  it("matches the newest app release in the changelog", () => {
    const newest = RELEASES.find((r) => r.appVersion)?.appVersion;
    expect(newest?.replace(/^v/, "")).toBe(appConfig);
  });
});
