import { isNewerVersion, type AppRelease } from "@untitled/logic";
import * as Application from "expo-application";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Linking, Platform } from "react-native";

import { downloadApk, installApk, type ApkDownload } from "./download";
import { APP_VERSION } from "@/config/version";
import { fetchLatestRelease } from "./github";
import { UpdateSheet } from "./UpdateSheet";

/** The Expo Go app's id: running inside it there is no app of ours to update. */
const EXPO_GO_ID = "host.exp.exponent";

export type UpdateState =
  | { phase: "idle" }
  | { phase: "checking" }
  | { phase: "upToDate" }
  | { phase: "available"; release: AppRelease }
  | { phase: "downloading"; release: AppRelease; ratio: number }
  | { phase: "installing"; release: AppRelease }
  | { phase: "error"; release: AppRelease | null; message: string };

type Update = {
  state: UpdateState;
  /** The version of this app (from app.json, bundled with the code), shown in Settings and compared with the latest release. */
  version: string;
  /** Updates are offered on Android (APK from GitHub); iOS updates come from the store. */
  supported: boolean;
  /** Asks GitHub for a newer version and reports "up to date" or a failure. */
  check: () => Promise<void>;
};

const UpdateContext = createContext<Update | null>(null);

export function useUpdate() {
  const value = useContext(UpdateContext);
  if (!value) throw new Error("useUpdate must be used inside <UpdateProvider>");
  return value;
}

/**
 * Looks for a newer release once per launch (Android) and on request, and drives the update: ask → download inside the app with progress →
 * hand the APK to Android's installer. It renders the update sheet over whatever screen is open. Same signing key and a higher
 * versionCode are what let the phone install it over this app (see docs/RELEASING.md).
 */
export function UpdateProvider({ children }: { children: ReactNode }) {
  const version = APP_VERSION;
  // Updates are offered on Android builds; Expo Go is the host app there and has nothing of ours to replace.
  const supported = Platform.OS === "android" && Application.applicationId !== EXPO_GO_ID;
  const [state, setState] = useState<UpdateState>({ phase: "idle" });
  const download = useRef<ApkDownload | null>(null);

  /** The person asked: also says "up to date" and reports a failed check. */
  const check = useCallback(async () => {
    if (!supported) return;
    setState({ phase: "checking" });
    const latest = await fetchLatestRelease();
    if (latest && isNewerVersion(latest.version, version)) setState({ phase: "available", release: latest });
    else
      setState(
        latest ? { phase: "upToDate" } : { phase: "error", release: null, message: "Couldn’t reach GitHub. Try again in a moment." },
      );
  }, [supported, version]);

  // Once per launch, quietly: only a newer version shows anything.
  useEffect(() => {
    if (!supported) return;
    let live = true;
    void fetchLatestRelease().then((latest) => {
      if (live && latest && isNewerVersion(latest.version, version)) setState({ phase: "available", release: latest });
    });
    return () => {
      live = false;
    };
  }, [supported, version]);

  async function start(release: AppRelease) {
    setState({ phase: "downloading", release, ratio: 0 });
    try {
      download.current = downloadApk(release.apkUrl, (ratio) => setState((s) => (s.phase === "downloading" ? { ...s, ratio } : s)));
      const uri = await download.current.done;
      if (!uri) return setState({ phase: "available", release });
      setState({ phase: "installing", release });
      await installApk(uri);
    } catch (e) {
      setState({ phase: "error", release, message: e instanceof Error && e.message ? e.message : "Couldn’t update the app." });
    } finally {
      download.current = null;
    }
  }

  const value = useMemo<Update>(() => ({ state, version, supported, check }), [state, version, supported, check]);
  const release = "release" in state ? state.release : null;

  return (
    <UpdateContext.Provider value={value}>
      {children}
      <UpdateSheet
        state={state}
        current={version}
        onUpdate={() => release && void start(release)}
        onCancel={() => void download.current?.cancel()}
        onBrowser={() => release && void Linking.openURL(release.apkUrl)}
        onClose={() => setState({ phase: "idle" })}
      />
    </UpdateContext.Provider>
  );
}
