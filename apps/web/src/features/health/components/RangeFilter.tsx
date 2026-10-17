"use client";

import { HEALTH_RANGES, type HealthRange } from "../format";

/** Today / Yesterday / 7 days / 30 days, as a glass segmented control (the active one is a white pill). */
export default function RangeFilter({ value, onChange }: { value: HealthRange; onChange: (r: HealthRange) => void }) {
  return (
    <div role="group" aria-label="Show health for" className="glass inline-flex max-w-full gap-1 overflow-x-auto rounded-pill p-1">
      {HEALTH_RANGES.map((r) => (
        <button
          key={r.key}
          type="button"
          aria-pressed={value === r.key}
          onClick={() => onChange(r.key)}
          className="h-9 shrink-0 rounded-pill px-4 text-[13.5px] font-medium text-fg-muted transition-colors active:scale-95 aria-pressed:bg-white aria-pressed:text-fg aria-pressed:shadow-e1"
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
