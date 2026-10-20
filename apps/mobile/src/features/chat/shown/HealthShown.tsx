import { dayLabel, fmtDistance, fmtDuration, fmtNumber } from "@untitled/logic";
import { router } from "expo-router";

import { ShownEmpty, ShownGroup, ShownRow } from "./ShownGroup";
import { AppText } from "@/components/ui/AppText";
import { useHealthDays } from "@/features/health/queries";
import { isoDate } from "@/lib/dates";

/** One day of the person's health figures, from the same cached days as the Health tab. */
export function HealthShown({ date }: { date: string }) {
  const q = useHealthDays();
  const day = (q.data ?? []).find((d) => d.day === date);
  const figures = day
    ? [
        day.steps !== null ? `${fmtNumber(day.steps)} steps` : null,
        day.distance_m !== null ? fmtDistance(day.distance_m) : null,
        day.active_kcal !== null ? `${fmtNumber(day.active_kcal)} kcal` : null,
        day.sleep_minutes !== null ? `${fmtDuration(day.sleep_minutes)} sleep` : null,
      ].filter((f): f is string => f !== null)
    : [];
  const open = () => router.navigate({ pathname: "/health", params: { d: date } });
  return (
    <ShownGroup tone="mint" icon="heart-pulse" title={`Health · ${dayLabel(date, isoDate())}`} openLabel="Open health" onOpen={open}>
      {q.isPending ? <ShownEmpty>Loading…</ShownEmpty> : null}
      {q.data && figures.length === 0 ? <ShownEmpty>Nothing recorded on this day.</ShownEmpty> : null}
      {figures.length ? (
        <ShownRow label="Open health for this day" onPress={open}>
          <AppText variant="body">{figures.join(" · ")}</AppText>
        </ShownRow>
      ) : null}
    </ShownGroup>
  );
}
