/** What the app needs from a GitHub Release to offer an update. */
export type AppRelease = { version: string; apkUrl: string; page: string };

/** "v1.2.3" or "1.2.3" → [1, 2, 3]; null when it isn't a plain release version (a pre-release suffix is never offered). */
export function parseVersion(tag: string): [number, number, number] | null {
  const m = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(tag.trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** True when `latest` is a newer release than `current`. An unreadable version on either side means no update. */
export function isNewerVersion(latest: string, current: string): boolean {
  const a = parseVersion(latest);
  const b = parseVersion(current);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i]! > b[i]!;
  return false;
}

/**
 * Reads GitHub's "latest release" payload. Only a stable release with an .apk attached counts, and the download must come from
 * GitHub itself, so a tampered response can't send people to another host.
 */
export function readLatestRelease(payload: unknown): AppRelease | null {
  if (!payload || typeof payload !== "object") return null;
  const r = payload as { tag_name?: unknown; draft?: unknown; prerelease?: unknown; html_url?: unknown; assets?: unknown };
  if (typeof r.tag_name !== "string" || r.draft === true || r.prerelease === true || !parseVersion(r.tag_name)) return null;
  const assets = Array.isArray(r.assets) ? (r.assets as { name?: unknown; browser_download_url?: unknown }[]) : [];
  const apk = assets.find(
    (a) =>
      typeof a.name === "string" &&
      a.name.endsWith(".apk") &&
      typeof a.browser_download_url === "string" &&
      a.browser_download_url.startsWith("https://github.com/"),
  );
  if (!apk || typeof apk.browser_download_url !== "string") return null;
  const page = typeof r.html_url === "string" && r.html_url.startsWith("https://github.com/") ? r.html_url : apk.browser_download_url;
  return { version: r.tag_name.replace(/^v/, ""), apkUrl: apk.browser_download_url, page };
}
