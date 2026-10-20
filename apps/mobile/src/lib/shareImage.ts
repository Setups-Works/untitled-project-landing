import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform, Share, TurboModuleRegistry } from "react-native";

type Options = { title: string; message: string; pngBase64: string; filename: string };
type NativeShare = { open: (o: Record<string, unknown>) => Promise<unknown> };

/** react-native-share is native code: it is missing in Expo Go and in builds made before it was added. */
function nativeShare(): NativeShare | null {
  // `get` returns null when the module isn't in the binary (Expo Go); the library itself would throw on import.
  if (!TurboModuleRegistry.get("RNShare")) return null;
  try {
    // Loaded lazily so a missing native module only disables image sharing instead of crashing the screen that imports this.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require("react-native-share") as { default: NativeShare }).default;
  } catch {
    return null;
  }
}

/**
 * Shares a PNG together with a message. With the native module that is one share sheet carrying both (iOS and Android).
 * Without it (Expo Go) the PNG is saved to the cache and shared as a file: on iOS the message goes with it; Android's file
 * share can't carry text, so there only the image is shared and `textShared` is false.
 */
export async function shareImageWithText({ title, message, pngBase64, filename }: Options) {
  const native = nativeShare();
  if (native) {
    await native.open({ title, message, url: `data:image/png;base64,${pngBase64}`, type: "image/png", filename, failOnCancel: false });
    return { textShared: true };
  }
  const file = new File(Paths.cache, `${filename}.png`);
  if (file.exists) file.delete();
  file.create();
  file.write(pngBase64, { encoding: "base64" });
  if (Platform.OS === "ios") {
    await Share.share({ title, message, url: file.uri });
    return { textShared: true };
  }
  await Sharing.shareAsync(file.uri, { mimeType: "image/png", dialogTitle: title });
  return { textShared: false };
}
