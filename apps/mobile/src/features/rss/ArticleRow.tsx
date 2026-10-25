import { rssAge } from "@untitled/logic";
import type { RssItem } from "@untitled/types";
import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Palette, Radius } from "@/constants/theme";

const THUMB = 92;

/** One article in the list: picture, title, description, source and age, with a star. */
export function ArticleRow({ item, onOpen, onStar }: { item: RssItem; onOpen: () => void; onStar: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <Card onPress={onOpen} accessibilityLabel={item.title}>
      <View style={styles.row}>
        {item.image_url && !imageFailed ? (
          <Image source={{ uri: item.image_url }} style={styles.thumb} onError={() => setImageFailed(true)} accessibilityIgnoresInvertColors />
        ) : null}
        <View style={styles.body}>
          <AppText variant={item.is_read ? "body" : "bodyStrong"} color={item.is_read ? Palette.fgMuted : Palette.fg} numberOfLines={2}>
            {item.title}
          </AppText>
          {item.summary ? (
            <AppText variant="small" color={Palette.fgMuted} numberOfLines={2}>
              {item.summary}
            </AppText>
          ) : null}
          <View style={styles.meta}>
            {!item.is_read ? <View accessibilityLabel="Unread" style={styles.dot} /> : null}
            <AppText variant="small" color={Palette.fgSubtle} numberOfLines={1} style={styles.source}>
              {item.feed_title} · {rssAge(item.published_at)}
            </AppText>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={item.is_starred ? "Remove star" : "Star article"}
          accessibilityState={{ selected: item.is_starred }}
          hitSlop={10}
          onPress={onStar}
          style={styles.star}
        >
          <Icon name="star" size={16} color={item.is_starred ? Palette.orangeFg : Palette.fgFaint} />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  thumb: { width: THUMB, height: THUMB, borderRadius: Radius.r2, backgroundColor: Palette.surfaceMuted },
  body: { flex: 1, gap: 4, minHeight: THUMB / 2 },
  meta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  source: { flexShrink: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Palette.greenFg },
  star: { padding: 2 },
});
