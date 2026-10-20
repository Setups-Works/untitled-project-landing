import { dayRange, fromIso, HEALTH_RANGES, rangeMeta, stepRange, type HealthPreset, type HealthRange } from "@untitled/logic";
import { useMemo, useState } from "react";
import { StyleSheet } from "react-native";

import { Button } from "@/components/ui/Button";
import { CalendarGrid } from "@/components/ui/DatePicker";
import { DayNav } from "@/components/ui/DayNav";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import { isoDate } from "@/lib/dates";

const shortDate = (iso: string) => fromIso(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/**
 * The Health filter, laid out like the Journal's: quick pills (Today / Yesterday / 7 days / 30 days) and the shared day navigator (‹ date ›)
 * to step one day or jump to any day from the calendar (days that have data get a dot; the future can't be picked). Under the date it
 * says how many figures were recorded that day (or how many days had data in a longer window).
 */
export function RangeFilter({
  value,
  onChange,
  daysWithData,
  count,
  pills = true,
}: {
  value: HealthRange;
  onChange: (range: HealthRange) => void;
  /** Days (YYYY-MM-DD) that have any reading, marked in the calendar. */
  daysWithData: string[];
  /** Shown on the right of the date card; null while there is nothing to count. */
  count: number | null;
  /** The Today / Yesterday / 7 days / 30 days pills above the date card. Off where only one day at a time makes sense. */
  pills?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const today = isoDate();
  const meta = rangeMeta(value, today);
  const marks = useMemo(() => new Set(daysWithData), [daysWithData]);
  const back = stepRange(value, today, -1);
  const forward = stepRange(value, today, 1);
  const single = meta.days === 1;
  const weekday = single ? fromIso(meta.from).toLocaleDateString(undefined, { weekday: "short" }) : meta.label;
  const title = single
    ? fromIso(meta.from).toLocaleDateString(undefined, { day: "numeric", month: "long" })
    : `${shortDate(meta.from)} – ${shortDate(meta.to)}`;
  const picked = value.startsWith("day:") ? meta.from : today;

  return (
    <>
      {pills && (
        // A day picked from the calendar or the arrows (not today or yesterday) lights no pill: the date card below shows it.
        <Segmented<HealthPreset>
          options={HEALTH_RANGES.map((r) => ({ key: r.key, label: r.label }))}
          value={(value.startsWith("day:") ? "" : value) as HealthPreset}
          onChange={onChange}
        />
      )}
      <DayNav
        label={single ? `${weekday}, ${title}` : title}
        hint={count ? `${count} recorded` : undefined}
        accessibilityLabel={`${weekday}, ${title}${count === null ? "" : `, ${count} recorded`}. Choose date.`}
        prevDisabled={!back}
        nextDisabled={!forward}
        onPrev={() => back && onChange(back)}
        onNext={() => forward && onChange(forward)}
        onOpen={() => setOpen(true)}
      />

      <Sheet visible={open} onClose={() => setOpen(false)} title="Choose a day">
        <CalendarGrid
          value={picked}
          marks={marks}
          maxDate={today}
          onPick={(iso) => {
            onChange(iso === today ? "today" : dayRange(iso));
            setOpen(false);
          }}
        />
        <Button
          title="Today"
          kind="secondary"
          icon="calendar-day"
          onPress={() => {
            onChange("today");
            setOpen(false);
          }}
          style={styles.todayButton}
        />
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({ todayButton: { marginTop: 12 } });
