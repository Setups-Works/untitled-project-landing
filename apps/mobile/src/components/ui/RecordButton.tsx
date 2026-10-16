import { audioClock } from "@untitled/logic";
import { useEffect } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { AppText } from "./AppText";
import { Icon } from "./Icon";
import { Palette, Radius } from "@/constants/theme";

/** Relative heights of the little level meter, the same seven bars as the web's RecordButton. */
const BARS = [0.5, 0.9, 0.6, 1, 0.45, 0.8, 0.55];
const METER_HEIGHT = 16;

function Bar({ height, index, still }: { height: number; index: number; still: boolean }) {
  const t = useSharedValue(1);
  useEffect(() => {
    if (still) return;
    t.value = withDelay(index * 110, withRepeat(withSequence(withTiming(0.5, { duration: 450 }), withTiming(1, { duration: 450 })), -1));
    return () => cancelAnimation(t);
  }, [index, still, t]);
  const style = useAnimatedStyle(() => ({ opacity: t.value }));
  return <Animated.View style={[styles.bar, { height: height * METER_HEIGHT }, style]} />;
}

function PulsingDot({ still }: { still: boolean }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    t.value = withRepeat(withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) }), -1);
    return () => cancelAnimation(t);
  }, [still, t]);
  const ping = useAnimatedStyle(() => ({ opacity: 0.6 * (1 - t.value), transform: [{ scale: 1 + t.value * 1.2 }] }));
  return (
    <View style={styles.dotBox} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.dotPing, ping]} />
      <View style={styles.dot} />
    </View>
  );
}

/**
 * Voice-recording control, drawn like the web's. Idle: a round microphone button (or a "Voice" pill). Recording: a red-tinted pill with a
 * pulsing dot, a small level meter, the elapsed time and a stop button, so it is obvious the microphone is on and how to finish.
 */
export function RecordButton({
  recording,
  secs,
  onToggle,
  variant = "icon",
  idleStyle,
}: {
  recording: boolean;
  secs: number;
  onToggle: () => void;
  /** "icon": round microphone button (chat). "pill": microphone with a "Voice" label (journal). */
  variant?: "icon" | "pill";
  /** Size and surface of the idle button, so it can sit among its neighbours. */
  idleStyle?: StyleProp<ViewStyle>;
}) {
  const still = useReducedMotion();

  if (!recording)
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Record a voice note"
        accessibilityState={{ selected: false }}
        onPress={onToggle}
        hitSlop={8}
        style={[variant === "pill" ? styles.idlePill : styles.idleIcon, idleStyle]}
      >
        <Icon name="microphone" size={17} color={Palette.fgMuted} />
        {variant === "pill" ? (
          <AppText variant="bodyStrong" color={Palette.fgMuted}>
            Voice
          </AppText>
        ) : null}
      </Pressable>
    );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Stop recording, ${audioClock(secs)} so far`}
      accessibilityState={{ selected: true }}
      onPress={onToggle}
      style={({ pressed }) => [styles.pill, pressed ? styles.pressed : null]}
    >
      <PulsingDot still={still} />
      <View style={styles.meter} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {BARS.map((h, i) => (
          <Bar key={i} height={h} index={i} still={still} />
        ))}
      </View>
      <AppText variant="bodyStrong" color={Palette.clayFg} style={styles.time} accessibilityRole="timer">
        {audioClock(secs)}
      </AppText>
      <View style={styles.stop}>
        <Icon name="stop" size={11} color={Palette.surface} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  idleIcon: { width: 38, height: 38, borderRadius: Radius.pill, alignItems: "center", justifyContent: "center" },
  idlePill: { minHeight: 40, paddingHorizontal: 14, borderRadius: Radius.pill, flexDirection: "row", alignItems: "center", gap: 7 },
  // 40 high; 14 in from the left and 4 from the right (the stop button is 32), as on the web.
  pill: { height: 40, flexDirection: "row", alignItems: "center", gap: 10, paddingLeft: 14, paddingRight: 4, paddingVertical: 4, borderRadius: Radius.pill, backgroundColor: Palette.clayBg, borderWidth: 1, borderColor: Palette.clayFg + "40" },
  pressed: { opacity: 0.9 },
  dotBox: { width: 10, height: 10, alignItems: "center", justifyContent: "center" },
  dotPing: { ...StyleSheet.absoluteFill, borderRadius: Radius.pill, backgroundColor: Palette.rec },
  dot: { width: 10, height: 10, borderRadius: Radius.pill, backgroundColor: Palette.rec },
  meter: { height: METER_HEIGHT, flexDirection: "row", alignItems: "center", gap: 2 },
  bar: { width: 3, borderRadius: Radius.pill, backgroundColor: Palette.clayFg, opacity: 0.7 },
  time: { fontVariant: ["tabular-nums"], fontSize: 13, minWidth: 28 },
  stop: { width: 32, height: 32, borderRadius: Radius.pill, backgroundColor: Palette.clayFg, alignItems: "center", justifyContent: "center" },
});
