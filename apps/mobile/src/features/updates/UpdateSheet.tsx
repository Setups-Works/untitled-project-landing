import { Linking, StyleSheet, View } from "react-native";

import type { UpdateState } from "./UpdateProvider";
import { AppText } from "@/components/ui/AppText";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { mobileEnv } from "@/config/env";
import { Palette, Radius, Space } from "@/constants/theme";

/** The update sheet: what is new, a progress bar while the file downloads, and the way out when something goes wrong. */
export function UpdateSheet({
  state,
  current,
  onUpdate,
  onCancel,
  onBrowser,
  onClose,
}: {
  state: UpdateState;
  current: string | null;
  onUpdate: () => void;
  onCancel: () => void;
  onBrowser: () => void;
  onClose: () => void;
}) {
  const open =
    state.phase === "available" ||
    state.phase === "downloading" ||
    state.phase === "installing" ||
    (state.phase === "error" && state.release !== null);
  const release = "release" in state ? state.release : null;

  return (
    <Sheet visible={open} onClose={state.phase === "downloading" ? onCancel : onClose} title="Update available">
      <View style={styles.stack}>
        {release ? (
          <AppText variant="body">
            Version {release.version} is ready. You have {current}.
          </AppText>
        ) : null}

        {state.phase === "available" ? (
          <>
            {mobileEnv.changelogUrl ? (
              <Button title="What’s new" kind="ghost" icon="list-ul" onPress={() => void Linking.openURL(mobileEnv.changelogUrl!)} />
            ) : null}
            <Button title="Update now" icon="download" onPress={onUpdate} />
            <Button title="Later" kind="secondary" onPress={onClose} />
          </>
        ) : null}

        {state.phase === "downloading" ? (
          <>
            <View
              style={styles.track}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: Math.round(state.ratio * 100) }}
            >
              <View style={[styles.fill, { width: `${Math.round(state.ratio * 100)}%` }]} />
            </View>
            <AppText variant="small">Downloading… {Math.round(state.ratio * 100)}%</AppText>
            <Button title="Cancel" kind="secondary" onPress={onCancel} />
          </>
        ) : null}

        {state.phase === "installing" ? (
          <>
            <AppText variant="small">
              The installer is open. Confirm there to finish; the app restarts on the new version. If Android asks, allow installs from this
              app.
            </AppText>
            <Button title="Close" kind="secondary" onPress={onClose} />
          </>
        ) : null}

        {state.phase === "error" ? (
          <>
            <Banner kind="error">{state.message}</Banner>
            <Button title="Try again" icon="rotate" onPress={onUpdate} />
            <Button title="Download in the browser" kind="secondary" onPress={onBrowser} />
          </>
        ) : null}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Space.md },
  track: { height: 10, borderRadius: Radius.pill, backgroundColor: Palette.surfaceSunken, overflow: "hidden" },
  fill: { height: "100%", borderRadius: Radius.pill, backgroundColor: Palette.greenFg },
});
