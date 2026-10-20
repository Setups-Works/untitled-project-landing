import { requireOptionalNativeModule } from "expo";
import type { WidgetProps } from "@untitled/logic";

/**
 * iOS: update the WidgetKit widgets' snapshot (one timeline entry each). The widget code is loaded only when the native module exists,
 * so Expo Go and builds made before widgets were added keep working and simply have no widgets.
 */
export async function pushWidgets(props: WidgetProps): Promise<void> {
  if (!requireOptionalNativeModule("ExpoWidgets")) return;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  (require("./ios") as typeof import("./ios")).updateIosWidgets(props);
}
