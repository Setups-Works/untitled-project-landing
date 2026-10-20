import { useEffect } from "react";
import { AppState, Platform } from "react-native";

import { clearWidgets, syncWidgets } from "./sync";

/**
 * Keeps the home-screen widgets in step with the app: refreshes them when someone is signed in and the app opens or returns to the
 * foreground, and wipes them when they sign out. Mount once, near the root. Widgets exist only on iOS and Android.
 */
export function useWidgetSync(signedIn: boolean) {
  useEffect(() => {
    if (Platform.OS === "web") return;
    if (!signedIn) {
      void clearWidgets().catch(() => undefined);
      return;
    }
    void syncWidgets().catch(() => undefined);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void syncWidgets().catch(() => undefined);
    });
    return () => sub.remove();
  }, [signedIn]);
}
