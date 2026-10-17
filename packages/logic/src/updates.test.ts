import { describe, expect, it } from "vitest";
import { isNewerVersion, parseVersion, readLatestRelease } from "./updates";

const release = (over: Record<string, unknown> = {}) => ({
  tag_name: "v1.0.2",
  html_url: "https://github.com/Setups-Works/untitled-project-landing/releases/tag/v1.0.2",
  assets: [
    { name: "untitled-project-v1.0.2.apk.sha256", browser_download_url: "https://github.com/x/y/releases/download/v1.0.2/a.sha256" },
    { name: "untitled-project-v1.0.2.apk", browser_download_url: "https://github.com/x/y/releases/download/v1.0.2/a.apk" },
  ],
  ...over,
});

describe("app updates", () => {
  it("parses plain versions only", () => {
    expect(parseVersion("v1.2.3")).toEqual([1, 2, 3]);
    expect(parseVersion("1.2.3")).toEqual([1, 2, 3]);
    expect(parseVersion("v1.2.3-beta.1")).toBeNull();
  });

  it("compares numerically, not as text", () => {
    expect(isNewerVersion("v1.0.10", "1.0.9")).toBe(true);
    expect(isNewerVersion("1.0.1", "1.0.1")).toBe(false);
    expect(isNewerVersion("1.0.0", "1.0.1")).toBe(false);
    expect(isNewerVersion("v2.0.0", "1.9.9")).toBe(true);
    expect(isNewerVersion("garbage", "1.0.0")).toBe(false);
  });

  it("picks the apk, not its checksum", () => {
    expect(readLatestRelease(release())).toMatchObject({ version: "1.0.2", apkUrl: expect.stringMatching(/a\.apk$/) });
  });

  it("ignores drafts, pre-releases, missing apks and other hosts", () => {
    expect(readLatestRelease(release({ prerelease: true }))).toBeNull();
    expect(readLatestRelease(release({ draft: true }))).toBeNull();
    expect(readLatestRelease(release({ assets: [] }))).toBeNull();
    expect(readLatestRelease(release({ assets: [{ name: "a.apk", browser_download_url: "https://evil.example/a.apk" }] }))).toBeNull();
    expect(readLatestRelease(null)).toBeNull();
  });
});
