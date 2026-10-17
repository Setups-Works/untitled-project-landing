import {
  daysInRange,
  fmtDistance,
  fmtDuration,
  fmtNumber,
  HEALTH_ACTIONS,
  HEALTH_GOALS,
  HEALTH_RANGES,
  healthPrompt,
  healthRatio,
  SOURCE_LABEL,
  summarizeHealth,
  type HealthAction,
  type HealthRange,
} from "@untitled/logic";
import type { Tone } from "@untitled/types";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Switch, View, useWindowDimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { mergeDays } from "./merge";
import { useHealthConnection, useHealthDays } from "./queries";
import { healthSource } from "./source";
import { AppText } from "@/components/ui/AppText";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Screen } from "@/components/ui/Screen";
import { Segmented } from "@/components/ui/Segmented";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { Palette, Radius, Space, Tints } from "@/constants/theme";
import { errorMessage } from "@/lib/api";
import { isoDate } from "@/lib/dates";

const RING = 200;
const STROKE = 20;
const R = (RING - STROKE) / 2;
const C = 2 * Math.PI * R;
/** Width at which the ring and the tiles sit side by side (a tablet, or the app running in a desktop browser). */
const WIDE = 760;
const WIDE_COLUMN = 1100;

const ACTION_ICON: Record<HealthAction, IconName> = { ask: "wand-magic-sparkles", journal: "book-open", note: "pen-to-square" };

export function HealthScreen() {
  const conn = useHealthConnection();
  const daysQ = useHealthDays();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE;
  const [range, setRange] = useState<HealthRange>("today");
  // Stored data plus what the phone just read, so partial or not-yet-saved data still shows.
  const days = useMemo(() => mergeDays(daysQ.data ?? [], conn.phoneDays), [daysQ.data, conn.phoneDays]);
  const hasData = days.some((d) => Object.entries(d).some(([k, v]) => typeof v === "number" && k !== "day"));
  const meta = HEALTH_RANGES.find((r) => r.key === range)!;
  const today = isoDate();
  const inRange = useMemo(() => daysInRange(days, range, today), [days, range, today]);
  const sum = useMemo(() => summarizeHealth(inRange), [inRange]);
  const multi = meta.days > 1;
  const latest = days[0];
  const goal = HEALTH_GOALS.steps * meta.days;
  const bars = useMemo(() => {
    const byDay = new Map(inRange.map((d) => [d.day, d.steps]));
    return Array.from({ length: meta.days }, (_, i) => {
      const day = isoDate(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - (meta.days - 1 - i)));
      return { day, steps: byDay.get(day) ?? null };
    });
  }, [inRange, meta.days]);
  const refresh = () => void conn.refresh().catch(() => undefined);
  // Hands the numbers to the chat: it answers, or drafts a journal entry or note that you confirm there.
  const toChat = (action: HealthAction) =>
    router.push({ pathname: "/chat", params: { ask: healthPrompt(action, range), n: String(Date.now()) } });

  return (
    <Screen onRefresh={refresh} refreshing={conn.syncing} contentStyle={wide ? styles.wide : undefined}>
      <View style={styles.head}>
        <AppText variant="display">Health</AppText>
        <AppText variant="small">
          {latest ? `Synced from ${SOURCE_LABEL[latest.source]}` : "Activity, sleep and heart rate from your phone"}
        </AppText>
      </View>

      {conn.status === "checking" || (daysQ.isPending && !hasData) ? (
        <LoadingState />
      ) : !hasData && conn.status === "unsupported" ? (
        <EmptyState
          icon="heart-pulse"
          title="Health isn’t available here"
          hint={
            healthSource
              ? `${healthSource.name} isn’t available on this device. Sync from another phone and it shows up here.`
              : "Open the app on your iPhone or Android phone to connect your health data. It then appears here on the web too."
          }
        />
      ) : !hasData && conn.status === "setup" ? (
        <SetupCard onConnect={() => void conn.connect()} name={healthSource?.name ?? "Health"} />
      ) : daysQ.isError && !hasData ? (
        <ErrorState message={errorMessage(daysQ.error)} onRetry={() => void daysQ.refetch()} />
      ) : (
        <View style={styles.stack}>
          <Segmented options={HEALTH_RANGES.map((r) => ({ key: r.key, label: r.label }))} value={range} onChange={setRange} />

          {conn.noData && (
            <View style={styles.full}>
              <Banner kind="error">No health data came through. Check that access is allowed, then pull down to sync again.</Banner>
              <Button title="Open permission settings" kind="secondary" icon="gear" onPress={() => healthSource?.openSettings()} />
            </View>
          )}
          {(conn.syncError || daysQ.isError) && hasData && (
            <Banner kind="info">Showing what your phone has. It couldn’t be saved to your account yet, so pull down to try again.</Banner>
          )}

          {!latest ? (
            conn.syncError ? (
              <ErrorState message={errorMessage(conn.syncError, "Couldn’t sync your health data.")} onRetry={refresh} />
            ) : conn.syncing ? (
              <EmptyState icon="rotate" title="Syncing your health data" hint="This only takes a moment." />
            ) : (
              <EmptyState icon="heart-pulse" title="No health data yet" hint="Pull down to sync. If it stays empty, allow access in your phone’s health settings." />
            )
          ) : (
            <>
              <View style={wide ? styles.row : styles.stack}>
                <Card tone="blue" style={wide ? styles.ringWide : undefined}>
                  <Ring
                    fraction={healthRatio(sum.steps ?? 0, goal)}
                    title={multi ? `Steps, ${meta.label}` : "Steps"}
                    detail={`${fmtNumber(sum.steps ?? 0)} of ${fmtNumber(goal)}`}
                  />
                  {multi && (
                    <View style={styles.bars} accessibilityLabel="Steps per day">
                      {bars.map((b) => (
                        <View key={b.day} style={styles.barCell}>
                          <View
                            style={[
                              styles.bar,
                              {
                                height: `${Math.max(healthRatio(b.steps ?? 0, HEALTH_GOALS.steps) * 100, 6)}%`,
                                backgroundColor: b.steps === null ? Tints.blue.line : Tints.blue.fg,
                              },
                            ]}
                          />
                        </View>
                      ))}
                    </View>
                  )}
                </Card>
                {sum.recorded === 0 ? (
                  <View style={styles.tiles}>
                    <EmptyState
                      icon="calendar-day"
                      title={`Nothing recorded ${range === "today" ? "today" : range === "yesterday" ? "yesterday" : "in this period"}`}
                      hint="Pull down to sync, or pick another day."
                    />
                  </View>
                ) : (
                  <View style={styles.tiles}>
                    <Tile
                      tone="green"
                      icon="shoe-prints"
                      label="Steps"
                      value={sum.steps === null ? null : fmtNumber(sum.steps)}
                      note={multi && sum.stepsAvg !== null ? `${fmtNumber(sum.stepsAvg)} a day on average` : `Goal ${fmtNumber(HEALTH_GOALS.steps)}`}
                    />
                    <Tile
                      tone="violet"
                      icon="moon"
                      label={multi ? "Sleep, average" : "Sleep"}
                      value={sum.sleepAvg === null ? null : fmtDuration(sum.sleepAvg)}
                      note={`Goal ${fmtDuration(HEALTH_GOALS.sleepMinutes)}`}
                    />
                    <Tile tone="mint" icon="location-dot" label="Distance" value={sum.distance === null ? null : fmtDistance(sum.distance)} />
                    <Tile
                      tone="amber"
                      icon="fire"
                      label="Active energy"
                      value={sum.activeKcal === null ? null : `${fmtNumber(sum.activeKcal)} kcal`}
                    />
                    <Tile
                      tone="clay"
                      icon="heart"
                      label="Heart rate"
                      value={sum.hrMin === null || sum.hrMax === null ? null : `${sum.hrMin}–${sum.hrMax} bpm`}
                    />
                    <Tile
                      tone="blue"
                      icon="heart-pulse"
                      label={multi ? "Resting heart rate, average" : "Resting heart rate"}
                      value={sum.restingAvg === null ? null : `${sum.restingAvg} bpm`}
                    />
                  </View>
                )}
              </View>

              <View style={styles.actions}>
                <AppText variant="label">Use with the assistant</AppText>
                <View style={styles.actionRow}>
                  {HEALTH_ACTIONS.map((a) => (
                    <Button
                      key={a.key}
                      title={a.label}
                      icon={ACTION_ICON[a.key]}
                      kind={a.key === "ask" ? "primary" : "secondary"}
                      onPress={() => toChat(a.key)}
                      style={styles.actionBtn}
                    />
                  ))}
                </View>
              </View>
            </>
          )}

          <SyncToggle
            on={conn.status === "ready"}
            unsupported={conn.status === "unsupported"}
            name={healthSource?.name ?? "Health"}
            onChange={(on) => void conn.setSyncOn(on)}
          />
        </View>
      )}
    </Screen>
  );
}

/**
 * Per-phone switch. Your account holds one set of daily totals, and a phone that syncs replaces the days it reads, so only the phone
 * you actually wear should sync. Every other phone leaves this off and still shows the account's data.
 */
function SyncToggle({ on, unsupported, name, onChange }: { on: boolean; unsupported: boolean; name: string; onChange: (on: boolean) => void }) {
  return (
    <Card>
      <View style={styles.toggle}>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">Sync this phone</AppText>
          <AppText variant="small" color={Palette.fgMuted}>
            {unsupported
              ? `${name} isn’t available on this phone, so it shows what your other phone synced.`
              : on
                ? `This phone reads ${name} and updates your account. Turn it off on a phone you don’t wear.`
                : "Off: this phone only shows the data already in your account. Turn it on to read this phone and replace those days."}
          </AppText>
        </View>
        {!unsupported && (
          <Switch
            value={on}
            onValueChange={onChange}
            accessibilityLabel="Sync this phone"
            trackColor={{ false: Palette.lineStrong, true: Palette.greenFg }}
            thumbColor={Palette.surface}
          />
        )}
      </View>
    </Card>
  );
}

function SetupCard({ onConnect, name }: { onConnect: () => void; name: string }) {
  return (
    <Card tone="green">
      <View style={styles.setupHead}>
        <View style={styles.badge}>
          <Icon name="heart-pulse" size={20} color={Tints.green.fg} />
        </View>
        <AppText variant="heading" style={styles.flex}>
          Connect {name}
        </AppText>
      </View>
      <AppText variant="body" color={Palette.fgMuted}>
        Allow untitled project to read your steps, distance, active energy, heart rate and sleep. They are sent to your account so you
        can see them on the web and ask the assistant about them. You can turn this off any time in your phone’s settings.
      </AppText>
      <Button title="Allow access" icon="shield-heart" onPress={onConnect} />
    </Card>
  );
}

function Tile({ tone, icon, label, value, note }: { tone: Tone; icon: IconName; label: string; value: string | null; note?: string }) {
  return (
    <View style={styles.tileCell}>
      <Card tone={tone}>
        <View style={styles.tile}>
          <View style={styles.badge}>
            <Icon name={icon} size={17} color={Tints[tone].fg} />
          </View>
          <View style={styles.flex}>
            <AppText variant="small" color={Tints[tone].fg}>
              {label}
            </AppText>
            <AppText variant="title" color={Tints[tone].fg} numberOfLines={1} adjustsFontSizeToFit>
              {value ?? "No data"}
            </AppText>
            {note ? (
              <AppText variant="small" color={Tints[tone].fg}>
                {note}
              </AppText>
            ) : null}
          </View>
        </View>
      </Card>
    </View>
  );
}

function Ring({ fraction, title, detail }: { fraction: number; title: string; detail: string }) {
  return (
    <View style={styles.ring} accessible accessibilityRole="progressbar" accessibilityLabel={`${title} ${Math.round(fraction * 100)} percent. ${detail}`}>
      <Svg width={RING} height={RING} viewBox={`0 0 ${RING} ${RING}`} style={styles.svg}>
        <Circle cx={RING / 2} cy={RING / 2} r={R} fill="none" stroke={Tints.blue.line} strokeWidth={STROKE} />
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={R}
          fill="none"
          stroke={Tints.blue.fg}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - fraction)}
          transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
        />
      </Svg>
      <View style={styles.ringText}>
        <AppText variant="label">{title}</AppText>
        <AppText variant="display">{`${Math.round(fraction * 100)}%`}</AppText>
        <AppText variant="small" align="center">
          {detail}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { gap: Space.xs, marginBottom: Space.lg },
  wide: { maxWidth: WIDE_COLUMN, width: "100%", alignSelf: "center" },
  stack: { gap: Space.md },
  row: { flexDirection: "row", flexWrap: "wrap", gap: Space.lg, alignItems: "flex-start" },
  full: { width: "100%", gap: Space.sm },
  ringWide: { width: 320 },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: Space.md, flex: 1, minWidth: 280 },
  tileCell: { flexGrow: 1, flexBasis: 240 },
  tile: { flexDirection: "row", alignItems: "center", gap: Space.md },
  badge: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  setupHead: { flexDirection: "row", alignItems: "center", gap: Space.md, marginBottom: Space.sm },
  ring: { width: RING, height: RING, alignSelf: "center", alignItems: "center", justifyContent: "center" },
  svg: { position: "absolute" },
  ringText: { alignItems: "center", gap: Space.xs },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 64, marginTop: Space.lg },
  barCell: { flex: 1, height: "100%", justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: Radius.pill, minHeight: 4 },
  toggle: { flexDirection: "row", alignItems: "center", gap: Space.md },
  actions: { gap: Space.sm, marginTop: Space.sm },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: Space.sm },
  actionBtn: { flexGrow: 1 },
});
