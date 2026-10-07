"use client";
import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { AudioScrubber } from "./waveform";

// Enough samples for the widest layout; the canvas resamples them to however many bars fit.
const BARS = 96;
const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

/** Stable pseudo-random bar heights, used until (or if) the real audio can't be decoded. */
function fallbackPeaks(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return Array.from({ length: BARS }, (_, i) => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) + i;
    return 0.25 + ((h >>> 0) % 1000) / 1400;
  });
}

/** Loudness per bar from the real audio, so the picture matches what you will hear. */
async function readPeaks(src: string, signal: AbortSignal) {
  const buf = await (await fetch(src, { signal })).arrayBuffer();
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  try {
    const audio = await ctx.decodeAudioData(buf);
    const data = audio.getChannelData(0);
    const block = Math.max(1, Math.floor(data.length / BARS));
    const peaks = Array.from({ length: BARS }, (_, i) => {
      let max = 0;
      for (let j = i * block; j < Math.min(data.length, (i + 1) * block); j += 16) max = Math.max(max, Math.abs(data[j]));
      return max;
    });
    const top = Math.max(...peaks, 0.001);
    return { peaks: peaks.map((p) => Math.max(0.12, p / top)), duration: audio.duration };
  } finally {
    void ctx.close();
  }
}

let playing: HTMLAudioElement | null = null; // only one clip plays at a time

/**
 * Audio player drawn as a waveform: play/pause, a bar chart of the recording that fills as it plays, click or drag to seek,
 * arrow keys to skip, and the elapsed/total time.
 */
export default function AudioWave({ src, label, bare = false }: { src: string; label: string; bare?: boolean }) {
  const el = useRef<HTMLAudioElement>(null);
  const [peaks, setPeaks] = useState<number[]>(() => fallbackPeaks(label));
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const ac = new AbortController();
    readPeaks(src, ac.signal)
      .then((r) => {
        setPeaks(r.peaks);
        if (Number.isFinite(r.duration)) setDuration((d) => d || r.duration);
      })
      .catch(() => undefined);
    return () => ac.abort();
  }, [src]);

  // Recordings made in the browser (webm) often report an unknown length; fall back to the decoded length above.
  const total = Number.isFinite(el.current?.duration) && el.current!.duration > 0 ? el.current!.duration : duration;

  const seek = (t: number) => {
    const a = el.current;
    if (!a) return;
    a.currentTime = t;
    setTime(t);
  };

  const toggle = () => {
    const a = el.current;
    if (!a) return;
    if (a.paused) {
      if (playing && playing !== a) playing.pause();
      playing = a;
      void a.play();
    } else a.pause();
  };

  return (
    <div
      className={`flex w-full max-w-[420px] items-center gap-3 rounded-pill py-1.5 pr-4 pl-1.5 ${bare ? "bg-surface-muted" : "bg-white shadow-[inset_0_0_0_1px_var(--line)]"}`}
    >
      <audio
        ref={el}
        src={src}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setTime(0);
        }}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={isPlaying ? `Pause ${label}` : `Play ${label}`}
        className="grid size-10 flex-none place-items-center rounded-full bg-fill-dark text-[13px] text-on-dark transition-transform hover:scale-105 active:scale-95"
      >
        <FA icon={isPlaying ? faPause : faPlay} className={isPlaying ? "" : "translate-x-px"} />
      </button>
      {/* ElevenLabs-style canvas waveform (src/components/ui/waveform.tsx): click or drag to seek, arrow keys skip 5 s. */}
      <AudioScrubber
        className="min-w-0 flex-1"
        label={`Seek ${label}`}
        data={peaks}
        currentTime={time}
        duration={total}
        height={40}
        barWidth={3}
        barGap={2}
        barRadius={1.5}
        barColor="#1b1c14"
        accent="#1f5d49"
        onSeek={seek}
      />
      <span className="flex-none text-[12px] tabular-nums text-fg-subtle">{fmt(isPlaying || time > 0 ? time : total)}</span>
    </div>
  );
}
