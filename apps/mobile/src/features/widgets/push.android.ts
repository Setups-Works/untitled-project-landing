import type { WidgetProps } from "@untitled/logic";

/**
 * Android: redraw the App Widgets that are on the home screen. The widget code is loaded lazily and any failure is swallowed, so Expo Go
 * and builds made before widgets were added keep working and simply have no widgets.
 */
export async function pushWidgets(props: WidgetProps): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    await (require("./android") as typeof import("./android")).updateAndroidWidgets(props);
  } catch {
    /* no native widget module in this build */
  }
}
