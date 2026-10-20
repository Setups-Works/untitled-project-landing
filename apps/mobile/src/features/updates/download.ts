import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";

import { APK_FILE_NAME, APK_MIME, FLAG_GRANT_READ_URI_PERMISSION, INSTALL_ACTION } from "./constants";

/** A download that can be stopped. `done` resolves to the saved file's address, or null if it was cancelled. */
export type ApkDownload = { done: Promise<string | null>; cancel: () => Promise<void> };

/**
 * Downloads the release's APK into the cache, reporting progress from 0 to 1. The address is checked to come from GitHub (readLatestRelease
 * already does, this is the second lock before anything is fetched).
 */
export function downloadApk(url: string, onProgress: (ratio: number) => void): ApkDownload {
  if (!url.startsWith("https://github.com/")) throw new Error("That download isn’t from GitHub.");
  const target = `${FileSystem.cacheDirectory}${APK_FILE_NAME}`;
  const task = FileSystem.createDownloadResumable(url, target, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) =>
    onProgress(totalBytesExpectedToWrite > 0 ? Math.min(totalBytesWritten / totalBytesExpectedToWrite, 1) : 0),
  );
  let cancelled = false;
  const done = (async () => {
    await FileSystem.deleteAsync(target, { idempotent: true });
    const result = await task.downloadAsync();
    if (cancelled) return null;
    if (!result || result.status !== 200) throw new Error("The download didn’t finish. Check your connection and try again.");
    return result.uri;
  })();
  return {
    done,
    cancel: async () => {
      cancelled = true;
      await task.pauseAsync().catch(() => undefined);
    },
  };
}

/** Opens Android's installer for the downloaded APK. The first time, the phone asks to allow installs from this app. */
export async function installApk(fileUri: string) {
  const data = await FileSystem.getContentUriAsync(fileUri);
  await IntentLauncher.startActivityAsync(INSTALL_ACTION, { data, flags: FLAG_GRANT_READ_URI_PERMISSION, type: APK_MIME });
}
