import {
  fmtDistance,
  fmtDuration,
  fmtHeartRange,
  fmtNumber,
  HEALTH_GOALS,
  HEALTH_WEEK,
  healthRatio,
  healthTotal,
  SOURCE_LABEL,
} from "@untitled/logic";
import type { HealthDay, Tone } from "@untitled/types";
import { useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
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
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { Palette, Radius, Space, Tints } from "@/constants/theme";
import { errorMessage } from "@/lib/api";

const RING = 200;
const STROKE = 20;
const R = (RING - STROKE) / 2;
const C = 2 * Math.PI * R;
/** Width at which the ring and the tiles sit side by side (a tablet, or the app running in a desktop browser). */
const WIDE = 760;
const WIDE_COLUMN = 1100;

type Metric = "steps" | "distance_m" | "active_kcal" | "resting_hr" | "sleep_minutes";

/** The newest day that has this metric. A day with a gap (no watch worn, nothing recorded yet) shouldn't blank the tile. */
function newest(days: HealthDay[], key: Metric) {
  const d = days.find((x) => x[key] !== null);
  return d ? { value: d[key] as number, day: d.day } : null;
}

const dayLabel = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });

export function HealthScreen() {
  const conn = useHealthConnection();
  const daysQ = useHealthDays();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE;
  // Stored data plus what the phone just read, so partial or not-yet-saved data still shows.
  const days = useMemo(() => mergeDays(daysQ.data ?? [], conn.phoneDays), [daysQ.data, conn.phoneDays]);
  const hasData = days.some((d) => Object.entries(d).some(([k, v]) => typeof v === "number" && k !== "day"));
  const latest = days[0];
  const today = latest?.day;
  const heartDay = days.find((d) => d.hr_min !== null && d.hr_max !== null);
  const steps = newest(days, "steps");
  const sleep = newest(days, "sleep_minutes");
  const distance = newest(days, "distance_m");
  const energy = newest(days, "active_kcal");
  const resting = newest(days, "resting_hr");
  const week = days.slice(0, HEALTH_WEEK);
  const weekSteps = healthTotal(week, (d) => d.steps);
  const refresh = () => void conn.sync().catch(() => undefined);

  return (
    <Screen onRefresh={refresh} refreshing={conn.syncing} contentStyle={wide ? styles.wide : undefined}>
      <View style={styles.head}>
        <AppText variant="display">Health</AppText>
        <AppText variant="small">
          {latest ? `Synced from ${SOURCE_LABEL[latest.source]}` : "Activity, sleep and heart rate from your phone"}
        </AppText>
      </View>

      {conn.status === "checking" ? (
        <LoadingState />
      ) : conn.status === "unsupported" ? (
        <EmptyState
          icon="heart-pulse"
          title="Health isn’t available here"
          hint={
            healthSource
              ? `${healthSource.name} isn’t available on this device. Open the app on your phone to connect your health data.`
              : "Open the app on your iPhone or Android phone to connect your health data. It then appears here on the web too."
          }
        />
      ) : conn.status === "setup" ? (
        <SetupCard onConnect={() => void conn.connect()} name={healthSource?.name ?? "Health"} />
      ) : daysQ.isPending && !hasData ? (
        <LoadingState />
      ) : daysQ.isError && !hasData ? (
        <ErrorState message={errorMessage(daysQ.error)} onRetry={() => void daysQ.refetch()} />
      ) : (
        <View style={wide ? styles.row : styles.stack}>
          {conn.noData && (
            <View style={styles.full}>
              <Banner kind="error">
                No health data came through. Check that access is allowed, then pull down to sync again.
              </Banner>
              <Button title="Open permission settings" kind="secondary" icon="gear" onPress={() => healthSource?.openSettings()} />
            </View>
          )}
          {(conn.syncError || daysQ.isError) && hasData && (
            <View style={styles.full}>
              <Banner kind="info">Showing what your phone has. It couldn’t be saved to your account yet, so pull down to try again.</Banner>
            </View>
          )}
          {latest ? (
            <>
              <Card tone="blue" style={wide ? styles.ringWide : undefined}>
                <Ring
                  fraction={healthRatio(weekSteps, HEALTH_GOALS.steps * HEALTH_WEEK)}
                  detail={`${fmtNumber(weekSteps)} of ${fmtNumber(HEALTH_GOALS.steps * HEALTH_WEEK)}`}
                />
              </Card>
              <View style={styles.tiles}>
                <Tile tone="green" icon="shoe-prints" label="Steps" value={steps && fmtNumber(steps.value)} day={steps?.day} today={today} />
                <Tile tone="violet" icon="moon" label="Sleep" value={sleep && fmtDuration(sleep.value)} day={sleep?.day} today={today} />
                <Tile
                  tone="mint"
                  icon="location-dot"
                  label="Distance"
                  value={distance && fmtDistance(distance.value)}
                  day={distance?.day}
                  today={today}
                />
                <Tile
                  tone="amber"
                  icon="fire"
                  label="Active energy"
                  value={energy && `${fmtNumber(energy.value)} kcal`}
                  day={energy?.day}
                  today={today}
                />
                <Tile
                  tone="clay"
                  icon="heart"
                  label="Heart rate"
                  value={heartDay ? fmtHeartRange(heartDay) : null}
                  day={heartDay?.day}
                  today={today}
                />
                <Tile
                  tone="blue"
                  icon="heart-pulse"
                  label="Resting heart rate"
                  value={resting && `${resting.value} bpm`}
                  day={resting?.day}
                  today={today}
                />
              </View>
            </>
          ) : conn.syncError ? (
            <View style={styles.full}>
              <ErrorState message={errorMessage(conn.syncError, "Couldn’t sync your health data.")} onRetry={refresh} />
            </View>
          ) : conn.syncing ? (
            <EmptyState icon="rotate" title="Syncing your health data" hint="This only takes a moment." />
          ) : (
            <EmptyState icon="heart-pulse" title="No health data yet" hint="Pull down to sync. If it stays empty, allow access in your phone’s health settings." />
          )}
        </View>
      )}
    </Screen>
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

function Tile({
  tone,
  icon,
  label,
  value,
  day,
  today,
}: {
  tone: Tone;
  icon: IconName;
  label: string;
  value: string | null;
  /** The day the value is from; named when it isn't the latest synced day. */
  day?: string;
  today?: string;
}) {
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
            {value && day && day !== today ? (
              <AppText variant="small" color={Tints[tone].fg}>
                {`From ${dayLabel(day)}`}
              </AppText>
            ) : null}
          </View>
        </View>
      </Card>
    </View>
  );
}

function Ring({ fraction, detail }: { fraction: number; detail: string }) {
  return (
    <View style={styles.ring} accessible accessibilityRole="progressbar" accessibilityLabel={`Weekly steps ${Math.round(fraction * 100)} percent. ${detail}`}>
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
        <AppText variant="label">Weekly steps</AppText>
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
});
