import { readLatestRelease, type AppRelease } from "@untitled/logic";

import { CHECK_TIMEOUT_MS } from "./constants";
import { mobileEnv } from "@/config/env";

/** The newest stable release on GitHub, or null when offline, rate limited or there is nothing installable. Never throws. */
export async function fetchLatestRelease(): Promise<AppRelease | null> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), CHECK_TIMEOUT_MS);
  try {
    const res = await fetch(`https://api.github.com/repos/${mobileEnv.githubRepo}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
      signal: ctl.signal,
    });
    return res.ok ? readLatestRelease(await res.json()) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
