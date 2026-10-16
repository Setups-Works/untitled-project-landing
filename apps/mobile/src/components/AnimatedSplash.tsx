import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { Font, Palette, Radius } from "@/constants/theme";

const NAME = "untitled project";
/** Matches `imageWidth` of the native splash in app.json, so the hand-off from native to this screen does not jump. */
const GHOST_WIDTH = 160;
const GHOST_HEIGHT = Math.round(GHOST_WIDTH * (512 / 459));
const LETTER_STAGGER = 45;
const TEXT_DELAY = 500;
/** The splash stays at least this long so the animation can finish, even when the app is ready sooner. */
const MIN_VISIBLE = TEXT_DELAY + NAME.length * LETTER_STAGGER + 700;

function Letter({ char, index, still }: { char: string; index: number; still: boolean }) {
  const t = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (!still) t.value = withDelay(TEXT_DELAY + index * LETTER_STAGGER, withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) }));
  }, [index, still, t]);
  const style = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateY: (1 - t.value) * 10 }] }));
  return <Animated.Text style={[styles.letter, style]}>{char === " " ? " " : char}</Animated.Text>;
}

/**
 * The launch screen after the native one: the ghost pops in, floats gently, and the name writes itself underneath. It covers the
 * app until `ready` (fonts, session and onboarding state are known) and the animation has had time to play, then fades out.
 */
export function AnimatedSplash({ ready }: { ready: boolean }) {
  const still = useReducedMotion();
  const [minElapsed, setMinElapsed] = useState(false);
  const [gone, setGone] = useState(false);

  const pop = useSharedValue(still ? 1 : 0.86);
  const lift = useSharedValue(0);
  const float = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), MIN_VISIBLE);
    if (!still) {
      pop.value = withSequence(withTiming(1.08, { duration: 260, easing: Easing.out(Easing.quad) }), withSpring(1, { damping: 7, stiffness: 140 }));
      lift.value = withDelay(TEXT_DELAY - 100, withTiming(-26, { duration: 420, easing: Easing.out(Easing.cubic) }));
      float.value = withDelay(
        TEXT_DELAY + 300,
        withRepeat(withSequence(withTiming(-5, { duration: 1100, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.sin) })), -1),
      );
    } else lift.value = -26;
    return () => clearTimeout(timer);
  }, [still, pop, lift, float]);

  const ghost = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value + float.value }, { scale: pop.value }, { rotate: `${float.value * -0.4}deg` }],
  }));
  const shadow = useAnimatedStyle(() => ({
    opacity: 0.18 + float.value * 0.02,
    transform: [{ translateY: lift.value }, { scaleX: 1 + float.value * 0.02 }],
  }));

  const done = ready && minElapsed;
  useEffect(() => {
    if (done) {
      const timer = setTimeout(() => setGone(true), 400);
      return () => clearTimeout(timer);
    }
  }, [done]);

  if (gone) return null;
  return (
    <Animated.View
      style={styles.root}
      pointerEvents={done ? "none" : "auto"}
      // The native splash hides as soon as this first frame is on screen, so the two are never both missing.
      onLayout={() => void SplashScreen.hideAsync()}
      exiting={FadeOut.duration(400)}
    >
      <View style={styles.center}>
        <Animated.View style={[styles.shadow, shadow]} />
        <Animated.View style={ghost}>
          <Image source={require("../../assets/images/splash-icon.png")} style={styles.ghost} resizeMode="contain" accessibilityIgnoresInvertColors />
        </Animated.View>
        <View style={styles.name} accessibilityRole="header" accessibilityLabel={NAME}>
          {NAME.split("").map((c, i) => (
            <Letter key={`${c}${i}`} char={c} index={i} still={still} />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: Palette.page, alignItems: "center", justifyContent: "center", zIndex: 100 },
  center: { alignItems: "center", justifyContent: "center" },
  ghost: { width: GHOST_WIDTH, height: GHOST_HEIGHT },
  shadow: {
    position: "absolute",
    top: GHOST_HEIGHT - 6,
    width: GHOST_WIDTH * 0.7,
    height: 12,
    borderRadius: Radius.pill,
    backgroundColor: Palette.shadow,
  },
  name: { position: "absolute", top: GHOST_HEIGHT + 24, flexDirection: "row" },
  letter: { ...Font.serif, fontSize: 32, lineHeight: 36, letterSpacing: -0.9, color: Palette.fg },
});
