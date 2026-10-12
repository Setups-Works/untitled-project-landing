import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SLIDES } from "./slides";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Palette, Radius, Tints } from "@/constants/theme";
import { useAppState } from "@/providers/AppState";

export function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const { completeOnboarding } = useAppState();
  const list = useRef<FlatList<(typeof SLIDES)[number]>>(null);
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  }

  // Finishing (or skipping) marks onboarding done; the route guards then move the user to the auth stack on their own.
  async function finish(to: "/signup" | "/login") {
    await completeOnboarding();
    router.replace(to);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <AppText variant="label">untitled project</AppText>
        {!last ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Skip introduction" hitSlop={12} onPress={() => void finish("/login")}>
            <AppText variant="bodyStrong" color={Palette.fgMuted}>
              Skip
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        ref={list}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => {
          const t = Tints[item.tone];
          return (
            <View style={[styles.slide, { width }]}>
              <View style={[styles.badge, { backgroundColor: t.bg, borderColor: t.line }]}>
                <Icon name={item.icon} size={44} color={t.fg} />
              </View>
              <AppText variant="label" color={t.fg}>
                {item.eyebrow}
              </AppText>
              <AppText variant="display" align="center">
                {item.title}
              </AppText>
              <AppText variant="body" align="center" color={Palette.fgMuted} style={styles.body}>
                {item.body}
              </AppText>
            </View>
          );
        }}
      />

      <View style={styles.bottom}>
        <View style={styles.dots} accessibilityRole="progressbar" accessibilityLabel={`Page ${index + 1} of ${SLIDES.length}`}>
          {SLIDES.map((s, i) => (
            <View key={s.key} style={[styles.dot, i === index ? styles.dotOn : null]} />
          ))}
        </View>
        {last ? (
          <View style={styles.actions}>
            <Button title="Get started" onPress={() => void finish("/signup")} />
            <Button title="I already have an account" kind="ghost" onPress={() => void finish("/login")} />
          </View>
        ) : (
          <Button title="Next" icon="arrow-right" onPress={() => list.current?.scrollToIndex({ index: index + 1, animated: true })} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.page },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: 8, minHeight: 44 },
  slide: { alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 16 },
  badge: {
    width: 112,
    height: 112,
    borderRadius: Radius.r4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  body: { maxWidth: 340 },
  bottom: { paddingHorizontal: 24, paddingBottom: 20, gap: 20 },
  dots: { flexDirection: "row", gap: 6, justifyContent: "center" },
  dot: { width: 7, height: 7, borderRadius: Radius.pill, backgroundColor: Palette.lineStrong },
  dotOn: { width: 22, backgroundColor: Palette.fillDark },
  actions: { gap: 4 },
});
