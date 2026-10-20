"use client";
import { faHeartPulse } from "@fortawesome/free-solid-svg-icons";
import { dayLabel, fmtDistance, fmtDuration, fmtNumber, HEALTH_SPAN, healthLink } from "@untitled/logic";
import { useHealthDays } from "../../../../features/health/queries";
import { isoDate } from "../../../../lib/dates";
import ShownGroup, { ShownEmpty, ShownRow } from "./ShownGroup";

/** One day of the person's health figures, from the same cached days as the Health page. */
export default function HealthShown({ date }: { date: string }) {
  const { days, isPending } = useHealthDays(HEALTH_SPAN);
  const day = days.find((d) => d.day === date);
  const href = healthLink(date);
  const figures = day
    ? [
        day.steps !== null ? `${fmtNumber(day.steps)} steps` : null,
        day.distance_m !== null ? fmtDistance(day.distance_m) : null,
        day.active_kcal !== null ? `${fmtNumber(day.active_kcal)} kcal` : null,
        day.sleep_minutes !== null ? `${fmtDuration(day.sleep_minutes)} sleep` : null,
      ].filter((f): f is string => f !== null)
    : [];
  return (
    <ShownGroup tone="mint" icon={faHeartPulse} title={`Health · ${dayLabel(date, isoDate())}`} openLabel="Open health" openHref={href}>
      {isPending && <ShownEmpty>Loading…</ShownEmpty>}
      {!isPending && figures.length === 0 && <ShownEmpty>Nothing recorded on this day.</ShownEmpty>}
      {figures.length > 0 && (
        <ShownRow href={href} label="Open health for this day">
          <span className="text-[14.5px]">{figures.join(" · ")}</span>
        </ShownRow>
      )}
    </ShownGroup>
  );
}
