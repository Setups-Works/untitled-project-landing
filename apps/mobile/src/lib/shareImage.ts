import * as Sharing from "expo-sharing";
import { Platform, Share, TurboModuleRegistry } from "react-native";

type Options = { title: string; message: string; /** A file:// URI of a PNG. */ imageUri: string };
type NativeShare = { open: (o: Record<string, unknown>) => Promise<unknown> };

/** react-native-share is native code: it is missing in Expo Go and in builds made before it was added. */
function nativeShare(): NativeShare | null {
  // `get` returns null when the module isn't in the binary (Expo Go); the library itself would throw on import.
  if (!TurboModuleRegistry.get("RNShare")) return null;
  try {
    // Loaded lazily so a missing native module only disables the richer share instead of crashing the screen that imports this.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require("react-native-share") as { default: NativeShare }).default;
  } catch {
    return null;
  }
}

/**
 * Shares an image file together with a message. With the native module that is one share sheet carrying both (iOS and Android).
 * Without it (Expo Go) iOS still carries the message; Android's plain file share can't, so there only the image is shared and
 * `textShared` is false.
 */
export async function shareImageWithText({ title, message, imageUri }: Options) {
  const native = nativeShare();
  if (native) {
    await native.open({ title, message, url: imageUri, type: "image/png", failOnCancel: false });
    return { textShared: true };
  }
  if (Platform.OS === "ios") {
    await Share.share({ title, message, url: imageUri });
    return { textShared: true };
  }
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing isn’t available on this device.");
  await Sharing.shareAsync(imageUri, { mimeType: "image/png", dialogTitle: title });
  return { textShared: false };
}
