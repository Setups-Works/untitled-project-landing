import { useId } from "react";

/** The AI mark: a tall pill filled with a grainy blue-to-coral gradient (tokens --ai-from / --ai-to). Sized by `className`. */
export default function AiIcon({ className = "h-[18px] w-[11px]" }: { className?: string }) {
  const id = useId();
  return (
    <svg className={className} viewBox="0 0 22 36" aria-hidden focusable="false">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--ai-from)" />
          <stop offset="1" stopColor="var(--ai-to)" />
        </linearGradient>
        <clipPath id={`${id}-c`}>
          <rect width="22" height="36" rx="11" />
        </clipPath>
        <filter id={`${id}-n`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="7" result="t" />
          <feColorMatrix in="t" type="saturate" values="0" />
        </filter>
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        <rect width="22" height="36" fill={`url(#${id}-g)`} />
        <rect width="22" height="36" filter={`url(#${id}-n)`} opacity="0.35" style={{ mixBlendMode: "overlay" }} />
      </g>
    </svg>
  );
}
