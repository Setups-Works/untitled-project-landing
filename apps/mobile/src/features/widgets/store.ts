import AsyncStorage from "@react-native-async-storage/async-storage";
import type { WidgetProps } from "@untitled/logic";

import { WIDGET_STORE_KEY } from "./constants";

/** The props last handed to the widgets, or null before the first sync. */
export async function readWidgetProps(): Promise<WidgetProps | null> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_STORE_KEY);
    return raw ? (JSON.parse(raw) as WidgetProps) : null;
  } catch {
    return null;
  }
}

export async function writeWidgetProps(props: WidgetProps) {
  await AsyncStorage.setItem(WIDGET_STORE_KEY, JSON.stringify(props)).catch(() => undefined);
}

/** What the widgets would show, ignoring when it was built: two snapshots with the same signature need no redraw. */
export const signatureOf = (props: WidgetProps) => JSON.stringify({ ...props.snapshot, updatedAt: "" });
