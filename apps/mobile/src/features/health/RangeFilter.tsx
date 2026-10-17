import { dayRange, fromIso, HEALTH_RANGES, rangeMeta, stepRange, type HealthPreset, type HealthRange } from "@untitled/logic";
import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CalendarGrid } from "@/components/ui/DatePicker";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import { Palette, Radius } from "@/constants/theme";
import { isoDate } from "@/lib/dates";

const shortDate = (iso: string) => fromIso(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/**
 * The Health filter, laid out like the Journal's: quick pills (Today / Yesterday / 7 days / 30 days) and a date card with ‹ calendar ›
 * to step one day or jump to any day (days that have data get a dot; the future can't be picked). The date card shows the weekday and
 * date and, on the right, how many figures were recorded that day (or how many days had data in a longer window).
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
      <Card tone="sand" style={styles.dateCard}>
        <View style={styles.dateNav}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous day"
            accessibilityState={{ disabled: !back }}
            disabled={!back}
            onPress={() => back && onChange(back)}
            style={[styles.navButton, !back ? styles.disabled : null]}
          >
            <Icon name="chevron-left" size={18} color={Palette.fgMuted} />
          </Pressable>
          <View style={styles.flex} />
          <Pressable accessibilityRole="button" accessibilityLabel="Open health calendar" onPress={() => setOpen(true)} style={styles.navButton}>
            <Icon name="calendar-days" size={17} color={Palette.fgMuted} />
          </Pressable>
          <View style={styles.flex} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next day"
            accessibilityState={{ disabled: !forward }}
            disabled={!forward}
            onPress={() => forward && onChange(forward)}
            style={[styles.navButton, !forward ? styles.disabled : null]}
          >
            <Icon name="chevron-right" size={18} color={Palette.fgMuted} />
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${weekday}, ${title}${count === null ? "" : `, ${count} recorded`}. Choose date.`}
          onPress={() => setOpen(true)}
          style={styles.selectedDate}
        >
          <View style={styles.selectedDateLabel}>
            <AppText variant="label" color={Palette.greenFg}>
              {weekday}
            </AppText>
            <AppText variant="bodyStrong" style={styles.selectedDateText}>
              {title}
            </AppText>
          </View>
          <AppText variant="body" color={Palette.fgSubtle}>
            {count === null ? "" : count}
          </AppText>
        </Pressable>
      </Card>

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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // Same measurements as the Journal's date card, so the two screens read as one.
  dateCard: { gap: 12, padding: 14, borderRadius: Radius.r4, overflow: Platform.OS === "android" ? "visible" : "hidden" },
  dateNav: { flexDirection: "row", alignItems: "center", paddingHorizontal: 4 },
  navButton: { width: 42, height: 42, borderRadius: Radius.pill, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.35 },
  selectedDate: {
    minHeight: 76,
    borderRadius: Radius.r3,
    borderWidth: 2,
    borderColor: Palette.greenFg,
    backgroundColor: Palette.greenBg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedDateLabel: { gap: 4 },
  selectedDateText: { fontSize: 19, lineHeight: 24 },
  todayButton: { marginTop: 12 },
});
