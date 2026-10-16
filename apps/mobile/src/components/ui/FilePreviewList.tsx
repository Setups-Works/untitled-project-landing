import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "./AppText";
import { AudioAttachment } from "./AttachmentGallery";
import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";
import { Sheet } from "./Sheet";
import type { PendingFile } from "@/features/chat/files";
import { Font, Palette, Radius, Space } from "@/constants/theme";

const size = (n: number) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);
const kindOf = (f: PendingFile) =>
  f.type.startsWith("image/") ? "image" : f.type.startsWith("audio/") ? "audio" : f.type.startsWith("video/") ? "video" : f.type === "application/pdf" ? "pdf" : "file";
const ICON: Record<string, IconName> = { audio: "microphone", pdf: "file-pdf", video: "file-lines", file: "file" };

/**
 * Files the person has picked but not sent yet, as cards like the web's FilePreviewList: a thumbnail for pictures (tap to see it large),
 * a player for voice notes, an icon for the rest, each with its name, size and a remove button.
 */
export function FilePreviewList({ files, onRemove, label = "Attachments to send" }: { files: PendingFile[]; onRemove: (index: number) => void; label?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const current = open !== null ? files[open] : undefined;
  if (!files.length) return null;

  return (
    <>
      <View style={styles.list} accessibilityLabel={label}>
        {files.map((f, i) => {
          const kind = kindOf(f);
          return (
            <View key={`${f.uri}-${i}`} style={styles.card}>
              {kind === "image" ? (
                <Pressable accessibilityRole="button" accessibilityLabel={`Preview ${f.name}`} onPress={() => setOpen(i)} style={styles.thumb}>
                  <Image source={{ uri: f.uri }} style={styles.thumbImage} contentFit="cover" accessibilityLabel={f.name} />
                </Pressable>
              ) : kind === "audio" ? null : (
                <View style={[styles.thumb, styles.iconBox]}>
                  <Icon name={ICON[kind] ?? "file"} size={20} color={Palette.fgMuted} />
                </View>
              )}
              <View style={styles.body}>
                <View style={styles.meta}>
                  {kind === "audio" ? <Icon name="microphone" size={12} color={Palette.fgSubtle} /> : null}
                  <AppText variant="small" color={Palette.fg} numberOfLines={1} style={styles.name}>
                    {f.name}
                  </AppText>
                  {f.size > 0 ? (
                    <AppText variant="small" color={Palette.fgSubtle} style={styles.size}>
                      {size(f.size)}
                    </AppText>
                  ) : null}
                </View>
                {kind === "audio" ? (
                  <View style={styles.player}>
                    <AudioAttachment uri={f.uri} name={f.name} failed={false} bare />
                  </View>
                ) : null}
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${f.name}`} onPress={() => onRemove(i)} hitSlop={8} style={styles.remove}>
                <Icon name="xmark" size={12} color={Palette.fgSubtle} />
              </Pressable>
            </View>
          );
        })}
      </View>

      <Sheet visible={current !== undefined && kindOf(current) === "image"} onClose={() => setOpen(null)} title={current?.name}>
        {current ? (
          <View style={styles.preview}>
            <Image source={{ uri: current.uri }} style={styles.previewImage} contentFit="contain" accessibilityLabel={current.name} />
            <View style={styles.previewActions}>
              <Button title="Close" kind="secondary" onPress={() => setOpen(null)} />
              <Button
                title="Remove"
                onPress={() => {
                  if (open !== null) onRemove(open);
                  setOpen(null);
                }}
              />
            </View>
          </View>
        ) : null}
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  list: { gap: Space.sm },
  // The same card as the web: white, hairline ring, 8 px inside, 12 px between thumbnail, text and the remove button.
  card: { flexDirection: "row", alignItems: "center", gap: Space.md, padding: Space.sm, paddingRight: 10, maxWidth: 460, width: "100%", borderRadius: Radius.r3, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line },
  thumb: { width: 56, height: 56, borderRadius: Radius.r2, overflow: "hidden", backgroundColor: Palette.surfaceSunken },
  thumbImage: { width: "100%", height: "100%" },
  iconBox: { alignItems: "center", justifyContent: "center" },
  body: { flex: 1, minWidth: 0 },
  meta: { flexDirection: "row", alignItems: "center", gap: Space.sm },
  name: { flexShrink: 1, ...Font.sansMedium },
  size: { fontSize: 12 },
  player: { marginTop: 6 },
  remove: { width: 28, height: 28, borderRadius: Radius.pill, alignItems: "center", justifyContent: "center" },
  preview: { gap: Space.md },
  previewImage: { width: "100%", aspectRatio: 1, borderRadius: Radius.r3, backgroundColor: Palette.surfaceSunken },
  previewActions: { flexDirection: "row", justifyContent: "flex-end", gap: Space.sm },
});
