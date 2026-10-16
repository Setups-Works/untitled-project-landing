/** Shared by the web `AudioWave` and the phone's audio player, so a clip looks the same on both. */

/** Enough samples for the widest layout; the waveform resamples them to however many bars fit. */
export const AUDIO_BARS = 96;

/** Waveform geometry, in px: the web canvas and the phone draw bars of exactly this size. */
export const WAVE = { barWidth: 3, barGap: 2, barRadius: 1.5, minBarHeight: 4, height: 40, maxFill: 0.8 } as const;

/** m:ss, tolerant of unknown (NaN, negative) lengths. */
export function audioClock(seconds: number) {
  const s = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Stable pseudo-random bar heights (0–1), used until (or if) the real audio can't be decoded. */
export function fallbackPeaks(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return Array.from({ length: AUDIO_BARS }, (_, i) => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) + i;
    return 0.25 + ((h >>> 0) % 1000) / 1400;
  });
}

/** How many bars fit in `width` px. */
export const waveBarCount = (width: number) => Math.max(0, Math.floor(width / (WAVE.barWidth + WAVE.barGap)));

/** The sample drawn by bar `i` of `count` bars. */
export const waveSample = (data: number[], i: number, count: number) => data[Math.floor((i / count) * data.length)] || 0;
