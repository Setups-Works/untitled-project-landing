import { isNewerVersion, readLatestRelease } from "@untitled/logic";
import * as Application from "expo-application";
import { useEffect } from "react";
import { Linking, Platform } from "react-native";

import { useConfirm } from "@/components/ui/Confirm";
import { mobileEnv } from "@/config/env";

const CHECK_TIMEOUT_MS = 8000;

/** The newest stable release on GitHub, or null when offline, rate limited or there is nothing installable. Never throws. */
async function fetchLatest() {
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

/**
 * Once per launch, asks GitHub whether a newer APK has been released and offers it. Android only: iOS updates come from the store.
 * "Update" opens the APK, which the phone downloads and offers to install over this app (same signing key, higher versionCode).
 * Render the returned `dialog` once near the root.
 */
export function useAppUpdate() {
  const { ask, dialog } = useConfirm();

  useEffect(() => {
    const current = Application.nativeApplicationVersion;
    if (Platform.OS !== "android" || !current) return;
    let live = true;
    void (async () => {
      const latest = await fetchLatest();
      if (!live || !latest || !isNewerVersion(latest.version, current)) return;
      const body = `Version ${latest.version} is ready. You have ${current}.${
        mobileEnv.changelogUrl ? " See what’s new in the changelog on the web." : ""
      }`;
      if (await ask({ title: "Update available", body, confirmLabel: "Update" })) void Linking.openURL(latest.apkUrl);
    })();
    return () => {
      live = false;
    };
  }, [ask]);

  return { dialog };
}
