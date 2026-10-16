const SIZE = 220;
const STROKE = 22;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

/** A progress ring with the percentage in the middle. `fraction` is 0–1 (the arc), `label`/`detail` sit under the number. */
export default function WeeklyRing({ fraction, label, detail }: { fraction: number; label: string; detail: string }) {
  return (
    <div className="at-blue relative mx-auto grid size-[220px] place-items-center" role="img" aria-label={`${label}: ${Math.round(fraction * 100)}%. ${detail}`}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" strokeWidth={STROKE} className="stroke-(--abl)" />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - fraction)}
          className="stroke-(--abf) transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
        />
      </svg>
      <div className="relative text-center">
        <p className="text-[12px] font-semibold tracking-[0.1em] text-fg-faint uppercase">{label}</p>
        <p className="font-serif text-[52px] leading-none tracking-[-0.03em]">{Math.round(fraction * 100)}%</p>
        <p className="text-[13px] text-fg-muted">{detail}</p>
      </div>
    </div>
  );
}
