import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";

export type Tint = "violet" | "blue" | "green" | "amber" | "clay" | "mint" | "gold" | "sand";

/** One metric, as a tinted tile: icon chip, label, big value and an optional second line. A tile with no value reads "No data". */
export default function StatTile({
  tint,
  icon,
  label,
  value,
  note,
  fill,
}: {
  tint: Tint;
  icon: IconDefinition;
  label: string;
  value: string | null;
  note?: string;
  /** 0–1: how much of the tile is washed with the strong tint, like a progress bar behind the text. */
  fill?: number;
}) {
  return (
    <div className={`at-${tint} tint relative flex items-center gap-3 overflow-hidden rounded-r3 p-3.5`}>
      {fill !== undefined && (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 bg-(--abf) opacity-[0.12]"
          style={{ width: `${Math.round(fill * 100)}%` }}
        />
      )}
      <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-surface text-[17px] text-(--abf)">
        <FA icon={icon} />
      </span>
      <div className="relative min-w-0">
        <p className="text-[13px] leading-tight opacity-80">{label}</p>
        <p className="font-serif text-[28px] leading-[1.1] tracking-[-0.02em]">{value ?? "No data"}</p>
        {note && <p className="text-[12.5px] leading-tight opacity-80">{note}</p>}
      </div>
    </div>
  );
}
