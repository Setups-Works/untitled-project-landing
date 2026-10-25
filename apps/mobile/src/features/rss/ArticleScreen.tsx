import { rssAge } from "@untitled/logic";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Image, Linking, StyleSheet, View } from "react-native";

import { useArticle, useRssActions } from "./queries";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { BarButton, DetailBar } from "@/components/ui/DetailBar";
import { Screen } from "@/components/ui/Screen";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { Palette, Radius, Space } from "@/constants/theme";

/** The reader: the article's picture, title, source and full text, with star, unread and "open original". */
export function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useArticle(id);
  const { setStarred, setRead } = useRssActions();
  const [imageFailed, setImageFailed] = useState(false);
  const item = q.data;

  if (!item)
    return (
      <Screen edges={["top", "left", "right", "bottom"]}>
        <DetailBar label="Article" onClose={() => router.back()} />
        {q.isError ? <ErrorState message="Couldn’t open this article." onRetry={() => void q.refetch()} /> : <LoadingState />}
      </Screen>
    );

  const paragraphs = (item.content || item.summary).split(/\n{2,}/).filter(Boolean);
  return (
    <Screen edges={["top", "left", "right", "bottom"]}>
      <DetailBar
        label="Article"
        onClose={() => router.back()}
        action={<BarButton title={item.is_starred ? "Starred" : "Star"} onPress={() => setStarred.mutate({ id: item.id, value: !item.is_starred })} />}
      />
      {item.image_url && !imageFailed ? (
        <Image source={{ uri: item.image_url }} style={styles.hero} onError={() => setImageFailed(true)} accessibilityIgnoresInvertColors />
      ) : null}
      <AppText variant="title">{item.title}</AppText>
      <AppText variant="small" color={Palette.fgSubtle}>
        {item.feed_title}
        {item.author ? ` · ${item.author}` : ""} · {rssAge(item.published_at)}
      </AppText>
      <View style={styles.text}>
        {paragraphs.map((p, i) => (
          <AppText key={i} variant="body">
            {p}
          </AppText>
        ))}
      </View>
      <View style={styles.actions}>
        {item.link ? <Button title="Open original" icon="arrow-up-right-from-square" onPress={() => void Linking.openURL(item.link!)} /> : null}
        <Button title={item.is_read ? "Mark as unread" : "Mark as read"} kind="secondary" onPress={() => setRead.mutate({ id: item.id, value: !item.is_read })} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { width: "100%", aspectRatio: 16 / 9, borderRadius: Radius.r3, backgroundColor: Palette.surfaceMuted },
  text: { gap: Space.md },
  actions: { gap: Space.sm },
});
