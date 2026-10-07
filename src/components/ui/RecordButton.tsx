"use client";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faMicrophone, faStop } from "@fortawesome/free-solid-svg-icons";

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const BARS = [0.5, 0.9, 0.6, 1, 0.45, 0.8, 0.55];

/**
 * Voice-recording control. Idle: a microphone button. Recording: a red pill with a pulsing dot, a small live-looking level meter,
 * the elapsed time and a stop button, so it is obvious that the microphone is on and how to finish.
 *
 *   const rec = useRecorder(...);  <RecordButton recording={rec.recording} secs={rec.secs} onToggle={rec.toggle} />
 */
export default function RecordButton({
  recording,
  secs,
  onToggle,
  variant = "icon",
}: {
  recording: boolean;
  secs: number;
  onToggle: () => void;
  /** "icon": round microphone button (chat). "pill": microphone with a "Voice" label (journal). */
  variant?: "icon" | "pill";
}) {
  if (!recording)
    return variant === "pill" ? (
      <button type="button" className="jr-pill" aria-pressed={false} onClick={onToggle}>
        <FA icon={faMicrophone} /> Voice
      </button>
    ) : (
      <button type="button" className="ne-btn" aria-pressed={false} aria-label="Record a voice message" onClick={onToggle}>
        <FA icon={faMicrophone} />
      </button>
    );

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed
      aria-label={`Stop recording, ${clock(secs)} so far`}
      className="flex h-10 flex-none items-center gap-2.5 rounded-pill bg-clay-bg py-1 pr-1 pl-3.5 text-clay-fg shadow-[inset_0_0_0_1px_#9a5a4a40] transition-colors hover:bg-[#f0dcd6]"
    >
      <span className="relative flex size-2.5 flex-none" aria-hidden>
        <span className="absolute inset-0 animate-ping rounded-full bg-[#d64545]/60 motion-reduce:animate-none" />
        <span className="relative size-2.5 rounded-full bg-[#d64545]" />
      </span>
      <span className="flex h-4 items-center gap-[2px]" aria-hidden>
        {BARS.map((h, i) => (
          <span
            key={i}
            className="w-[3px] animate-pulse rounded-full bg-clay-fg/70 motion-reduce:animate-none"
            style={{ height: `${h * 100}%`, animationDelay: `${i * 110}ms`, animationDuration: "0.9s" }}
          />
        ))}
      </span>
      <span className="min-w-[2.2ch] text-[13px] font-medium tabular-nums" role="timer">
        {clock(secs)}
      </span>
      <span className="grid size-8 flex-none place-items-center rounded-full bg-clay-fg text-[11px] text-white">
        <FA icon={faStop} />
      </span>
    </button>
  );
}
