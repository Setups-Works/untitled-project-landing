import type { Attachment } from "@untitled/types";
import { Image } from "expo-image";
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "./AppText";
import { Icon } from "./Icon";
import { Palette, Radius } from "@/constants/theme";
import { useSignedUrls } from "@/features/attachments/useSignedUrls";

const kb = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1000))} KB`);

/** Pictures show inline; voice notes and other files are tappable chips that open the file. Mirrors how the web shows attachments. */
export function AttachmentGallery({ attachments }: { attachments: Attachment[] }) {
  const urls = useSignedUrls(attachments);
  if (!attachments.length) return null;
  const images = attachments.filter((a) => a.type.startsWith("image/"));
  const files = attachments.filter((a) => !a.type.startsWith("image/"));

  return (
    <View style={styles.wrap}>
      {images.map((a) => {
        const uri = urls.data?.[a.path];
        return (
          <View key={a.path} style={styles.imageBox} accessibilityLabel={a.name}>
            {uri ? (
              <Image source={{ uri }} style={styles.image} contentFit="cover" transition={150} accessibilityLabel={a.name} />
            ) : urls.isError ? (
              <View style={styles.center}>
                <Icon name="image" size={18} color={Palette.fgFaint} />
                <AppText variant="small">Couldn’t load {a.name}</AppText>
              </View>
            ) : (
              <View style={styles.center}>
                <ActivityIndicator color={Palette.greenFg} />
              </View>
            )}
          </View>
        );
      })}
      {files.map((a) => {
        const uri = urls.data?.[a.path];
        const voice = a.type.startsWith("audio/");
        return (
          <Pressable
            key={a.path}
            accessibilityRole="link"
            accessibilityLabel={`${voice ? "Play" : "Open"} ${a.name}`}
            disabled={!uri}
            onPress={() => uri && void Linking.openURL(uri)}
            style={[styles.chip, { opacity: uri ? 1 : 0.5 }]}
          >
            <Icon name={voice ? "microphone" : "paperclip"} size={13} color={Palette.greenFg} />
            <AppText variant="small" color={Palette.fg} numberOfLines={1} style={styles.chipText}>
              {voice ? "Voice note" : a.name}
            </AppText>
            <AppText variant="small">{kb(a.size)}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginTop: 8 },
  imageBox: { borderRadius: Radius.r2, overflow: "hidden", backgroundColor: Palette.surfaceSunken, minHeight: 120 },
  image: { width: "100%", aspectRatio: 1.6 },
  center: { minHeight: 120, alignItems: "center", justifyContent: "center", gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    backgroundColor: Palette.glassHi,
    borderWidth: 1,
    borderColor: Palette.glassRing,
  },
  chipText: { flex: 1 },
});
