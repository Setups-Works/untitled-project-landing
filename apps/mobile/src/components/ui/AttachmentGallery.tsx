import { audioClock, fallbackPeaks, WAVE, waveBarCount, waveSample } from "@untitled/logic";
import type { Attachment } from "@untitled/types";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Image } from "expo-image";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Linking, PanResponder, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "./AppText";
import { Icon } from "./Icon";
import { Palette, Radius, Shadow } from "@/constants/theme";
import { useSignedUrls } from "@/features/attachments/useSignedUrls";
import { useRuntimePrefs } from "@/lib/preferences";

const kb = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1000))} KB`);

/** Pictures show inline; audio plays in place; other files open from a tappable chip. */
export function AttachmentGallery({ attachments }: { attachments: Attachment[] }) {
  const urls = useSignedUrls(attachments);
  const preferences = useRuntimePrefs();
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
              <Image source={{ uri }} style={styles.image} contentFit="cover" transition={preferences.reduceMotion ? 0 : 150} accessibilityLabel={a.name} />
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
        if (voice) return <AudioAttachment key={a.path} uri={uri ?? null} name={a.name} failed={urls.isError} />;
        return (
          <Pressable
            key={a.path}
            accessibilityRole="link"
            accessibilityLabel={`Open ${a.name}`}
            disabled={!uri}
            onPress={() => uri && void Linking.openURL(uri)}
            style={[styles.chip, { opacity: uri ? 1 : 0.5 }]}
          >
            <Icon name="paperclip" size={13} color={Palette.greenFg} />
            <AppText variant="small" color={Palette.fg} numberOfLines={1} style={styles.chipText}>
              {a.name}
            </AppText>
            <AppText variant="small">{kb(a.size)}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** `bare` is the flat grey version used inside another card (the web's `bare` AudioWave in FilePreviewList). */
export function AudioAttachment({ uri, name, failed, bare = false }: { uri: string | null; name: string; failed: boolean; bare?: boolean }) {
  const player = useAudioPlayer(uri, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const [playbackError, setPlaybackError] = useState(false);
  const [waveWidth, setWaveWidth] = useState(0);
  const duration = status.duration || 0;
  const progress = duration > 0 ? Math.min(1, status.currentTime / duration) : 0;
  const peaks = useMemo(() => fallbackPeaks(name), [name]);
  const barCount = waveBarCount(waveWidth);
  const disabled = !uri || failed || !status.isLoaded || !!status.error;

  const seekAt = useCallback((x: number) => {
    if (waveWidth > 0 && duration > 0) void player.seekTo(Math.max(0, Math.min(duration, (x / waveWidth) * duration)));
  }, [duration, player, waveWidth]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => duration > 0,
    onMoveShouldSetPanResponder: (_, gesture) => duration > 0 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderGrant: (event) => seekAt(event.nativeEvent.locationX),
    onPanResponderMove: (event) => seekAt(event.nativeEvent.locationX),
  }), [duration, seekAt]);

  async function togglePlayback() {
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (status.playing) player.pause();
      else player.play();
      setPlaybackError(false);
    } catch {
      setPlaybackError(true);
    }
  }

  return (
    <View style={styles.audioWrap}>
      <View style={[styles.audioCard, bare ? styles.audioBare : null]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${status.playing ? "Pause" : "Play"} ${name}`}
          accessibilityState={{ disabled, busy: status.isBuffering }}
          disabled={disabled}
          onPress={() => void togglePlayback()}
          style={({ pressed }) => [styles.audioButton, pressed ? styles.pressed : null, disabled ? styles.disabled : null]}
        >
          {uri && !failed && (!status.isLoaded || status.isBuffering) ? (
            <ActivityIndicator size="small" color={Palette.onDark} />
          ) : (
            <Icon name={status.playing ? "pause" : "play"} size={15} color={Palette.onDark} />
          )}
        </Pressable>
        <View
          accessibilityRole="adjustable"
          accessibilityLabel={`Seek ${name}`}
          accessibilityValue={{ min: 0, max: Math.round(duration), now: Math.round(status.currentTime) }}
          onLayout={(event) => setWaveWidth(event.nativeEvent.layout.width)}
          style={styles.waveform}
          {...panResponder.panHandlers}
        >
          {/* The same bars as the web's waveform: 3 px wide, 2 px apart, taller and more opaque where the clip is louder. */}
          <View style={styles.waveBars}>
            {Array.from({ length: barCount }, (_, index) => {
              const value = waveSample(peaks, index, barCount);
              return (
                <View
                  key={index}
                  style={{
                    width: WAVE.barWidth,
                    marginRight: index < barCount - 1 ? WAVE.barGap : 0,
                    height: Math.max(WAVE.minBarHeight, value * WAVE.height * WAVE.maxFill),
                    borderRadius: WAVE.barRadius,
                    backgroundColor: Palette.fg,
                    opacity: 0.3 + value * 0.7,
                  }}
                />
              );
            })}
          </View>
          <View style={[styles.played, { width: `${progress * 100}%` }]} />
          <View style={[styles.playhead, { left: `${progress * 100}%` }]} />
          <View style={[styles.playheadDot, { left: `${progress * 100}%` }]} />
        </View>
        <AppText variant="small" color={Palette.fgSubtle} style={styles.audioTime}>
          {audioClock(status.playing || status.currentTime > 0 ? status.currentTime : duration)}
        </AppText>
      </View>
      {failed || status.error || playbackError ? <AppText variant="small" color={Palette.clayFg}>Couldn’t load this audio.</AppText> : null}
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
  // Same measurements as the web's AudioWave: a pill 6 px in from the left, 16 px on the right, a 40 px play button, 12 px gaps.
  audioCard: { maxWidth: 420, width: "100%", flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 6, paddingRight: 16, paddingVertical: 6, borderRadius: Radius.pill, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line },
  audioBare: { backgroundColor: Palette.surfaceMuted, borderWidth: 0 },
  audioWrap: { gap: 4 },
  audioButton: { width: 40, height: 40, borderRadius: Radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: Palette.fillDark },
  waveform: { height: WAVE.height, flex: 1, justifyContent: "center", borderRadius: Radius.r1, overflow: "hidden" },
  waveBars: { height: WAVE.height, flexDirection: "row", alignItems: "center" },
  played: { position: "absolute", top: 0, bottom: 0, left: 0, borderRadius: Radius.r1, backgroundColor: Palette.greenFg, opacity: 0.14 },
  playhead: { position: "absolute", top: 0, bottom: 0, width: 2, marginLeft: -1, borderRadius: Radius.pill, backgroundColor: Palette.greenFg },
  playheadDot: { position: "absolute", top: (WAVE.height - 14) / 2, width: 14, height: 14, marginLeft: -7, borderRadius: Radius.pill, backgroundColor: Palette.greenFg, borderWidth: 2, borderColor: Palette.surface, ...Shadow.e2 },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.55 },
  audioTime: { fontVariant: ["tabular-nums"], fontSize: 12, minWidth: 34, textAlign: "right" },
});
