import { analyse, type Axis, type Observation } from "@untitled/logic";
import { router } from "expo-router";
import { Fragment, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Line, Polygon, Text as SvgText } from "react-native-svg";

import { useJournal } from "@/features/journal/queries";
import { useNotes } from "@/features/notes/queries";
import { useTasks } from "@/features/tasks/queries";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Font, Palette, Radius, Tints } from "@/constants/theme";

const OBSERVATION_ICONS: Record<Observation["icon"], IconName> = {
  check: "circle-check",
  clock: "clock",
  fire: "fire",
  pen: "pen",
  sun: "sun",
  tag: "tag",
  smile: "face-smile",
  calendar: "calendar-days",
};

export function PersonalityInsightsCard() {
  const tasksQ = useTasks();
  const journalQ = useJournal();
  const notesQ = useNotes();
  const [page, setPage] = useState(0);
  const result = useMemo(() => {
    if (!tasksQ.data || !journalQ.data || !notesQ.data) return null;
    return analyse(tasksQ.data, journalQ.data, notesQ.data);
  }, [tasksQ.data, journalQ.data, notesQ.data]);
  const pending = tasksQ.isPending || journalQ.isPending || notesQ.isPending;
  const failed = tasksQ.isError || journalQ.isError || notesQ.isError;

  return (
    <Card tone="gold" style={styles.card} accessibilityLabel="Personality insights">
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Icon name="wand-magic-sparkles" size={17} color={Tints.gold.fg} />
          <AppText variant="bodyStrong" color={Tints.gold.fg}>Personality insights</AppText>
        </View>
        {result?.enough ? (
          <View style={styles.pager}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous insight page"
              accessibilityState={{ disabled: page === 0 }}
              disabled={page === 0}
              onPress={() => setPage(0)}
              style={styles.pageButton}
            >
              <Icon name="chevron-left" size={16} color={page === 0 ? Palette.fgFaint : Tints.gold.fg} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next insight page"
              accessibilityState={{ disabled: page === 1 }}
              disabled={page === 1}
              onPress={() => setPage(1)}
              style={styles.pageButton}
            >
              <Icon name="chevron-right" size={16} color={page === 1 ? Palette.fgFaint : Tints.gold.fg} />
            </Pressable>
          </View>
        ) : null}
      </View>

      {pending ? (
        <AppText variant="body" color={Palette.fgMuted}>Reading your workspace…</AppText>
      ) : failed ? (
        <AppText variant="body" color={Palette.clayFg}>Couldn’t load your insights right now.</AppText>
      ) : result && !result.enough ? (
        <View style={styles.empty}>
          <AppText variant="body" color={Palette.fgMuted}>
            Insights appear once there’s something to look at. They’re worked out from your journal, notes and tasks.
          </AppText>
          <View style={styles.actions}>
            <Button title="Journal" kind="secondary" onPress={() => router.navigate("/journal")} />
            <Button title="Notes" kind="secondary" onPress={() => router.navigate("/notes")} />
            <Button title="To-do" kind="secondary" onPress={() => router.navigate("/todo")} />
          </View>
        </View>
      ) : result ? (
        <>
          {page === 0 ? <ProfilePage result={result} /> : <PatternsPage observations={result.observations} words={result.words} />}
          <View style={styles.dots} accessibilityRole="tablist" accessibilityLabel="Insight pages">
            {[0, 1].map((index) => (
              <Pressable
                key={index}
                accessibilityRole="tab"
                accessibilityLabel={index === 0 ? "Profile" : "Patterns"}
                accessibilityState={{ selected: page === index }}
                onPress={() => setPage(index)}
                style={[styles.dot, page === index ? styles.activeDot : null]}
              />
            ))}
          </View>
          <AppText variant="small" color={Palette.fgSubtle} style={styles.disclaimer}>
            Worked out on your device from your journal, notes and tasks. Patterns, not a diagnosis.
          </AppText>
        </>
      ) : null}
    </Card>
  );
}

function ProfilePage({ result }: { result: NonNullable<ReturnType<typeof analyse>> }) {
  const topAxes = [...result.axes].sort((a, b) => b.value - a.value).slice(0, 3);
  return (
    <View style={styles.profile}>
      <AppText variant="display" style={styles.archetype}>{result.name}</AppText>
      <AppText variant="body" color={Palette.fgMuted}>{result.summary}</AppText>
      <View style={styles.tags}>
        {result.tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <AppText variant="small" color={Tints.gold.fg}>{tag}</AppText>
          </View>
        ))}
      </View>
      <PersonalityRadar axes={result.axes} />
      <View style={styles.legend}>
        {topAxes.map((axis) => <AxisSummary key={axis.key} axis={axis} />)}
      </View>
    </View>
  );
}

function AxisSummary({ axis }: { axis: Axis }) {
  return (
    <View style={styles.axisRow}>
      <AppText variant="bodyStrong" style={styles.axisName}>{axis.label}</AppText>
      <AppText variant="small" color={Palette.fgSubtle} numberOfLines={1} style={styles.axisWhy}>{axis.why}</AppText>
      <AppText variant="bodyStrong" color={Tints.gold.fg} style={styles.axisValue}>{axis.value}</AppText>
    </View>
  );
}

function PatternsPage({ observations, words }: { observations: Observation[]; words: [string, number][] }) {
  return (
    <View style={styles.patterns}>
      {observations.length ? (
        observations.map((observation, index) => (
          <View key={`${observation.icon}-${index}`} style={styles.observation}>
            <View style={styles.observationIcon}>
              <Icon name={OBSERVATION_ICONS[observation.icon]} size={15} color={Tints.gold.fg} />
            </View>
            <AppText variant="body" style={styles.observationText}>{observation.text}</AppText>
          </View>
        ))
      ) : (
        <AppText variant="body" color={Palette.fgMuted}>Keep going — patterns show up after a few more days.</AppText>
      )}
      {words.length ? (
        <View style={styles.words}>
          <AppText variant="bodyStrong">On your mind lately</AppText>
          <View style={styles.tags}>
            {words.map(([word, count]) => (
              <View key={word} style={styles.tag}>
                <AppText variant="small" color={Tints.gold.fg}>{word}</AppText>
                <AppText variant="small" color={Palette.fgSubtle}>{count}</AppText>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function PersonalityRadar({ axes }: { axes: Axis[] }) {
  const width = 360;
  const height = 300;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 76;
  const labelRadius = 108;
  const point = (index: number, value: number, distance: number) => {
    const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2;
    const scaledRadius = distance * (value / 100);
    return [centerX + Math.cos(angle) * scaledRadius, centerY + Math.sin(angle) * scaledRadius] as const;
  };
  const points = (value: number, distance: number) => axes.map((_axis, index) => point(index, value, distance).join(",")).join(" ");
  const shape = axes.map((axis, index) => point(index, Math.max(5, axis.value), radius).join(",")).join(" ");

  return (
    <Svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Personality chart: ${axes.map((axis) => `${axis.label} ${axis.value}`).join(", ")}`}
      style={styles.radar}
    >
      {[25, 50, 75, 100].map((level) => (
        <Polygon key={level} points={points(level, radius)} fill="none" stroke={Tints.gold.line} strokeWidth={1} />
      ))}
      {axes.map((axis, index) => {
        const [endX, endY] = point(index, 100, radius);
        const [labelX, labelY] = point(index, 100, labelRadius);
        const [edgeX] = point(index, 100, labelRadius);
        const anchor = Math.abs(edgeX - centerX) < 4 ? "middle" : edgeX > centerX ? "start" : "end";
        return (
          <Fragment key={axis.key}>
            <Line x1={centerX} y1={centerY} x2={endX} y2={endY} stroke={Tints.gold.line} strokeWidth={1} />
            {/* design-ok: SVG labels need the app's Geist token because they do not inherit AppText styles. */}
            <SvgText x={labelX} y={labelY} textAnchor={anchor} alignmentBaseline="middle" fontSize={11} fontFamily={Font.sans.fontFamily} fontWeight="500" fill={Palette.fg}>
              {axis.label}
            </SvgText>
          </Fragment>
        );
      })}
      <Polygon points={shape} fill={Tints.gold.fg} fillOpacity={0.14} stroke={Tints.gold.fg} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0, paddingHorizontal: 18, paddingVertical: 0, overflow: "hidden" },
  header: { minHeight: 58, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Tints.gold.line },
  headerTitle: { flexDirection: "row", alignItems: "center", gap: 9 },
  pager: { flexDirection: "row", alignItems: "center", gap: 4 },
  pageButton: { width: 34, height: 40, alignItems: "center", justifyContent: "center" },
  empty: { gap: 16, paddingTop: 18, paddingBottom: 4 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  profile: { paddingTop: 18, gap: 12 },
  archetype: { fontSize: 34, lineHeight: 38 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { minHeight: 32, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 13, borderRadius: Radius.pill, backgroundColor: Palette.glassHi },
  radar: { alignSelf: "center", marginVertical: 2 },
  legend: { gap: 8 },
  axisRow: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, borderRadius: Radius.r2, backgroundColor: Palette.glassHi },
  axisName: { minWidth: 75 },
  axisWhy: { flex: 1 },
  axisValue: { minWidth: 26, textAlign: "right" },
  patterns: { gap: 13, paddingTop: 18, paddingBottom: 8 },
  observation: { flexDirection: "row", alignItems: "center", gap: 11 },
  observationIcon: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: Radius.pill, backgroundColor: Palette.glassHi },
  observationText: { flex: 1 },
  words: { gap: 10, marginTop: 8, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Tints.gold.line },
  dots: { flexDirection: "row", alignSelf: "center", gap: 7, paddingVertical: 14 },
  dot: { width: 7, height: 7, borderRadius: Radius.pill, backgroundColor: Palette.lineStrong },
  activeDot: { width: 20, backgroundColor: Tints.gold.fg },
  disclaimer: { textAlign: "center", paddingBottom: 16 },
});
