import {
  daysInRange,
  HEALTH_METRICS,
  healthRatio,
  isHealthMetric,
  metricPrompt,
  metricRowText,
  metricSeries,
  parseRange,
  rangeMeta,
  type HealthMetric,
  type HealthRange,
} from "@untitled/logic";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { askChat } from "../chat/handoff";
import { useHealthDays } from "./queries";
import { RangeFilter } from "./RangeFilter";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DetailBar } from "@/components/ui/DetailBar";
import { Screen } from "@/components/ui/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { Palette, Radius, Space, Tints } from "@/constants/theme";
import { errorMessage } from "@/lib/api";
import { isoDate } from "@/lib/dates";

const shortDay = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

/** One metric over a range: the headline, a bar per day, average / best / lowest, and every day listed. Opened from a Health tile. */
export function MetricScreen() {
  const params = useLocalSearchParams<{ metric?: string; range?: string }>();
  if (!isHealthMetric(params.metric)) return <NotFound />;
  return <Detail metric={params.metric} initialRange={parseRange(params.range) ?? "week"} />;
}

function NotFound() {
  return (
    <Screen>
      <DetailBar label="Health" onClose={() => router.back()} />
      <EmptyState icon="heart-pulse" title="That isn’t a health metric" hint="Go back and pick one from the Health tab." />
    </Screen>
  );
}

function Detail({ metric, initialRange }: { metric: HealthMetric; initialRange: HealthRange }) {
  const def = HEALTH_METRICS[metric];
  const tone = Tints[def.tone];
  const [range, setRange] = useState<HealthRange>(initialRange);
  const daysQ = useHealthDays();
  const today = isoDate();
  const days = useMemo(() => daysQ.data ?? [], [daysQ.data]);
  const series = useMemo(() => metricSeries(days, metric, range, today), [days, metric, range, today]);
  const rows = useMemo(() => daysInRange(days, range, today), [days, range, today]);
  const meta = rangeMeta(range, today);
  const daysWithData = useMemo(() => days.filter((d) => def.pick(d) !== null).map((d) => d.day), [days, def]);
  const peak = Math.max(def.goal ?? 0, ...series.points.map((p) => p.value ?? 0), 1);
  const goalDays = def.goal ? series.points.filter((p) => (p.value ?? 0) >= def.goal!).length : 0;

  const stats: { label: string; value: string | null; note?: string }[] = [
    { label: def.kind === "total" ? "Daily average" : "Average", value: series.average === null ? null : def.format(series.average) },
    {
      label: metric === "heart" ? "Highest" : "Best day",
      value: series.best?.value == null ? null : def.format(series.best.value),
      note: series.best ? shortDay(series.best.day) : undefined,
    },
    {
      label: metric === "heart" ? "Lowest" : "Lowest day",
      value: series.lowest?.value == null ? null : def.format(series.lowest.value),
      note: series.lowest ? shortDay(series.lowest.day) : undefined,
    },
    { label: "Days with data", value: `${series.recorded} of ${series.points.length}` },
  ];
  // Hands this metric to the chat: it answers, and anything it drafts is confirmed there.
  const askAssistant = () => askChat(metricPrompt(metric, range), "replace");

  return (
    <Screen onRefresh={() => void daysQ.refetch()} refreshing={daysQ.isRefetching}>
      <DetailBar label="Health" onClose={() => router.back()} />
      <View style={styles.head}>
        <AppText variant="display">{def.label}</AppText>
        <AppText variant="small">
          {meta.label}
          {def.goal ? ` · goal ${def.format(def.goal)} a day` : ""}
        </AppText>
      </View>

      {daysQ.isPending ? (
        <LoadingState />
      ) : daysQ.isError ? (
        <ErrorState message={errorMessage(daysQ.error)} onRetry={() => void daysQ.refetch()} />
      ) : (
        <View style={styles.stack}>
          <RangeFilter value={range} onChange={setRange} daysWithData={daysWithData} count={series.recorded} />

          <Card tone={def.tone}>
            <AppText variant="small" color={tone.fg}>
              {def.kind === "total" ? "Total" : "Average"}
            </AppText>
            <AppText variant="display" color={tone.fg} numberOfLines={1} adjustsFontSizeToFit>
              {series.headline === null ? "No data" : def.format(series.headline)}
            </AppText>
            {series.points.length > 1 ? (
              <View style={styles.bars} accessibilityLabel={`${def.label} per day`}>
                {series.points.map((p) => (
                  <View key={p.day} style={styles.barCell}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${Math.max(healthRatio(p.value ?? 0, peak) * 100, 3)}%`,
                          backgroundColor: p.value === null ? tone.line : tone.fg,
                        },
                      ]}
                    />
                  </View>
                ))}
              </View>
            ) : def.goal ? (
              // One day has nothing to compare against, so show progress toward the goal instead of a lone bar.
              <View
                style={[styles.goalTrack, { backgroundColor: tone.line }]}
                accessibilityRole="progressbar"
                accessibilityLabel={`${Math.round(healthRatio(series.headline ?? 0, def.goal) * 100)} percent of the goal`}
              >
                <View style={[styles.goalFill, { backgroundColor: tone.fg, width: `${Math.round(healthRatio(series.headline ?? 0, def.goal) * 100)}%` }]} />
              </View>
            ) : null}
            {def.goal ? (
              <AppText variant="small" color={tone.fg}>
                {series.points.length === 1
                  ? `${Math.round(healthRatio(series.headline ?? 0, def.goal) * 100)}% of your goal`
                  : `Goal met on ${goalDays} of ${series.points.length} days`}
              </AppText>
            ) : null}
          </Card>

          <View style={styles.stats}>
            {stats.map((s) => (
              <View key={s.label} style={styles.statCell}>
                <Card>
                  <AppText variant="label">{s.label}</AppText>
                  <AppText variant="title" numberOfLines={1} adjustsFontSizeToFit>
                    {s.value ?? "No data"}
                  </AppText>
                  {s.note ? (
                    <AppText variant="small" color={Palette.fgMuted}>
                      {s.note}
                    </AppText>
                  ) : null}
                </Card>
              </View>
            ))}
          </View>

          <View style={styles.list}>
            <AppText variant="label">Day by day</AppText>
            {rows.length === 0 ? (
              <EmptyState icon="calendar-day" title="Nothing recorded" hint="Nothing was recorded in this period yet." />
            ) : (
              <Card>
                {rows.map((d) => {
                  const v = def.pick(d);
                  return (
                    <View key={d.day} style={styles.row}>
                      <AppText variant="small" color={Palette.fgMuted} style={styles.rowDay}>
                        {d.day === today ? "Today" : shortDay(d.day)}
                      </AppText>
                      <View style={[styles.track, { backgroundColor: tone.line }]}>
                        <View style={[styles.fill, { backgroundColor: tone.fg, width: `${Math.round(healthRatio(v ?? 0, peak) * 100)}%` }]} />
                      </View>
                      <AppText variant="bodyStrong" style={styles.rowValue} numberOfLines={1}>
                        {metricRowText(metric, d) ?? "No data"}
                      </AppText>
                    </View>
                  );
                })}
              </Card>
            )}
          </View>

          <Button title="Ask the assistant" icon="wand-magic-sparkles" onPress={askAssistant} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: Space.xs, marginTop: Space.md, marginBottom: Space.lg },
  stack: { gap: Space.md },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 120, marginVertical: Space.lg },
  barCell: { flex: 1, height: "100%", justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: Radius.pill, minHeight: 4 },
  goalTrack: { height: 14, borderRadius: Radius.pill, overflow: "hidden", marginVertical: Space.lg },
  goalFill: { height: "100%", borderRadius: Radius.pill },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: Space.md },
  statCell: { flexGrow: 1, flexBasis: "45%" },
  list: { gap: Space.sm },
  row: { flexDirection: "row", alignItems: "center", gap: Space.md, paddingVertical: Space.sm },
  rowDay: { width: 92 },
  track: { flex: 1, height: 8, borderRadius: Radius.pill, overflow: "hidden" },
  fill: { height: "100%", borderRadius: Radius.pill },
  rowValue: { width: 96, textAlign: "right" },
});
