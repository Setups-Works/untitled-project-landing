"use client";
/**
 * Canvas waveform and audio scrubber, adapted from ElevenLabs UI (https://ui.elevenlabs.io/docs/components/waveform).
 * Original © 2025 Eleven Labs Inc., MIT License. Changes: our design tokens instead of shadcn colours, pointer (touch + mouse)
 * scrubbing, keyboard seeking, no `cn` helper, only the two pieces this app uses (Waveform, AudioScrubber).
 */
import { useCallback, useEffect, useRef, useState, type HTMLAttributes, type KeyboardEvent as ReactKeyboardEvent } from "react";

export type WaveformProps = Omit<HTMLAttributes<HTMLDivElement>, "onClick"> & {
  /** Values between 0 and 1, one per bar (resampled to however many bars fit). */
  data?: number[];
  barWidth?: number;
  barHeight?: number;
  barGap?: number;
  barRadius?: number;
  barColor?: string;
  fadeEdges?: boolean;
  fadeWidth?: number;
  height?: string | number;
};

export function Waveform({
  data = [],
  barWidth = 4,
  barHeight: baseBarHeight = 4,
  barGap = 2,
  barRadius = 2,
  barColor = "#1b1c14",
  fadeEdges = true,
  fadeWidth = 24,
  height = 128,
  className = "",
  ...props
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const heightStyle = typeof height === "number" ? `${height}px` : height;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const render = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, rect.width * dpr);
      canvas.height = Math.max(1, rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      const barCount = Math.floor(rect.width / (barWidth + barGap));
      const centerY = rect.height / 2;
      ctx.fillStyle = barColor;
      for (let i = 0; i < barCount; i++) {
        const value = data[Math.floor((i / barCount) * data.length)] || 0;
        const h = Math.max(baseBarHeight, value * rect.height * 0.8);
        const x = i * (barWidth + barGap);
        ctx.globalAlpha = 0.3 + value * 0.7;
        ctx.beginPath();
        if (barRadius > 0) ctx.roundRect(x, centerY - h / 2, barWidth, h, barRadius);
        else ctx.rect(x, centerY - h / 2, barWidth, h);
        ctx.fill();
      }

      if (fadeEdges && fadeWidth > 0 && rect.width > 0) {
        const g = ctx.createLinearGradient(0, 0, rect.width, 0);
        const p = Math.min(0.2, fadeWidth / rect.width);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(p, "rgba(255,255,255,0)");
        g.addColorStop(1 - p, "rgba(255,255,255,0)");
        g.addColorStop(1, "rgba(255,255,255,1)");
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, rect.width, rect.height);
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.globalAlpha = 1;
    };

    const ro = new ResizeObserver(render);
    ro.observe(container);
    render();
    return () => ro.disconnect();
  }, [data, barWidth, baseBarHeight, barGap, barRadius, barColor, fadeEdges, fadeWidth]);

  return (
    <div className={`relative ${className}`} ref={containerRef} style={{ height: heightStyle }} {...props}>
      <canvas className="block h-full w-full" ref={canvasRef} />
    </div>
  );
}

export type AudioScrubberProps = Omit<WaveformProps, "fadeEdges"> & {
  currentTime?: number;
  duration?: number;
  onSeek?: (time: number) => void;
  showHandle?: boolean;
  /** Colour of the played part, playhead and handle. */
  accent?: string;
  label?: string;
};

/** A waveform you can click or drag to seek, with the played part tinted and a playhead. Arrow keys skip 5 seconds. */
export function AudioScrubber({
  data = [],
  currentTime = 0,
  duration = 0,
  onSeek,
  showHandle = true,
  barWidth = 3,
  barHeight,
  barGap = 2,
  barRadius = 1.5,
  barColor,
  accent = "#1f5d49",
  height = 40,
  label = "Audio waveform",
  className = "",
  ...props
}: AudioScrubberProps) {
  const [dragging, setDragging] = useState(false);
  const [local, setLocal] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dragging && duration > 0) setLocal(Math.min(1, currentTime / duration));
  }, [currentTime, duration, dragging]);

  const scrub = useCallback(
    (clientX: number) => {
      const el = box.current;
      if (!el || !duration) return;
      const r = el.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      setLocal(p);
      onSeek?.(p * duration);
    },
    [duration, onSeek],
  );

  const onKey = (e: ReactKeyboardEvent) => {
    if (!duration) return;
    if (e.key === "ArrowRight") onSeek?.(Math.min(duration, currentTime + 5));
    else if (e.key === "ArrowLeft") onSeek?.(Math.max(0, currentTime - 5));
    else if (e.key === "Home") onSeek?.(0);
    else if (e.key === "End") onSeek?.(duration);
    else return;
    e.preventDefault();
  };

  return (
    <div
      ref={box}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(currentTime)}
      className={`relative cursor-pointer touch-none select-none rounded-r1 outline-offset-2 focus-visible:outline-2 focus-visible:outline-violet-fg ${className}`}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        scrub(e.clientX);
      }}
      onPointerMove={(e) => dragging && scrub(e.clientX)}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onKeyDown={onKey}
      {...props}
    >
      <Waveform
        data={data}
        barWidth={barWidth}
        barHeight={barHeight}
        barGap={barGap}
        barRadius={barRadius}
        barColor={barColor}
        fadeEdges={false}
        height="100%"
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 rounded-r1"
        style={{ width: `${local * 100}%`, background: accent, opacity: 0.14 }}
      />
      <div className="pointer-events-none absolute inset-y-0 w-0.5 rounded-full" style={{ left: `${local * 100}%`, background: accent }} />
      {showHandle && (
        <div
          className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
          style={{ left: `${local * 100}%`, background: accent }}
        />
      )}
    </div>
  );
}
