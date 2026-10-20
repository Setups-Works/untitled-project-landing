import "expo-router/entry";
import { Platform } from "react-native";

// Android runs the widget task handler in the background, even with the app closed, so it is registered here at startup rather than
// from a screen. iOS widgets are WidgetKit and need nothing at startup. Expo Go and older builds have no widget module: skip quietly.
if (Platform.OS === "android") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require("./src/features/widgets/android") as typeof import("./src/features/widgets/android")).registerAndroidWidgets();
  } catch {
    /* no native widget module in this build */
  }
}
