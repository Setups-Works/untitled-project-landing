import { addDays, fromIso, isoDate, monthGrid } from "@untitled/logic";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "./AppText";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";
import { Palette, Radius } from "@/constants/theme";

const WEEK = ["S", "M", "T", "W", "T", "F", "S"];

/** The app's own month calendar (the web never uses native date inputs either): pick a day, jump to today, or clear. */
export function CalendarGrid({ value, onPick, marks }: { value: string | null; onPick: (iso: string) => void; marks?: Set<string> }) {
  const today = isoDate();
  const start = fromIso(value ?? today);
  const [cursor, setCursor] = useState({ y: start.getFullYear(), m: start.getMonth() });
  const days = monthGrid(cursor.y, cursor.m, 0);
  const move = (n: number) =>
    setCursor((c) => {
      const d = new Date(c.y, c.m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  const title = new Date(cursor.y, cursor.m, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  return (
    <View style={styles.cal}>
      <View style={styles.nav}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          hitSlop={10}
          onPress={() => move(-1)}
          style={styles.navBtn}
        >
          <Icon name="chevron-left" size={14} color={Palette.fg} />
        </Pressable>
        <AppText variant="bodyStrong">{title}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Next month" hitSlop={10} onPress={() => move(1)} style={styles.navBtn}>
          <Icon name="chevron-right" size={14} color={Palette.fg} />
        </Pressable>
      </View>
      <View style={styles.week}>
        {WEEK.map((w, i) => (
          <AppText key={i} variant="label" align="center" style={styles.cell}>
            {w}
          </AppText>
        ))}
      </View>
      <View style={styles.grid}>
        {days.map((iso) => {
          const inMonth = fromIso(iso).getMonth() === cursor.m;
          const on = iso === value;
          return (
            <Pressable
              key={iso}
              accessibilityRole="button"
              accessibilityLabel={fromIso(iso).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
              accessibilityState={{ selected: on }}
              onPress={() => onPick(iso)}
              style={styles.cell}
            >
              <View
                style={[
                  styles.day,
                  on ? { backgroundColor: Palette.fillDark } : iso === today ? { borderColor: Palette.greenFg, borderWidth: 1.5 } : null,
                ]}
              >
                <AppText variant="small" color={on ? Palette.onDark : inMonth ? Palette.fg : Palette.fgFaint}>
                  {fromIso(iso).getDate()}
                </AppText>
              </View>
              {marks?.has(iso) ? <View style={[styles.dot, on ? { backgroundColor: Palette.onDark } : null]} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type Props = { label: string; value: string | null; onChange: (iso: string | null) => void; clearable?: boolean };

export function DateField({ label, value, onChange, clearable = true }: Props) {
  const [open, setOpen] = useState(false);
  const text = value
    ? fromIso(value).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "No date";
  return (
    <View style={styles.wrap}>
      <AppText variant="small" style={styles.label}>
        {label}
      </AppText>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${text}`} onPress={() => setOpen(true)} style={styles.box}>
        <Icon name="calendar-day" size={14} color={Palette.fgSubtle} />
        <AppText variant="body" style={styles.value}>
          {text}
        </AppText>
      </Pressable>
      <Sheet visible={open} onClose={() => setOpen(false)} title={label}>
        <CalendarGrid
          value={value}
          onPick={(iso) => {
            onChange(iso);
            setOpen(false);
          }}
        />
        <View style={styles.actions}>
          <Button
            title="Today"
            kind="secondary"
            onPress={() => {
              onChange(isoDate());
              setOpen(false);
            }}
            style={styles.flex}
          />
          <Button
            title="Tomorrow"
            kind="secondary"
            onPress={() => {
              onChange(addDays(isoDate(), 1));
              setOpen(false);
            }}
            style={styles.flex}
          />
          {clearable && value ? (
            <Button
              title="Clear"
              kind="danger"
              onPress={() => {
                onChange(null);
                setOpen(false);
              }}
              style={styles.flex}
            />
          ) : null}
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { marginLeft: 4 },
  box: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 50,
    borderRadius: Radius.r2,
    borderWidth: 1,
    borderColor: Palette.line,
    backgroundColor: Palette.glassHi,
    paddingHorizontal: 16,
    gap: 10,
  },
  value: { flex: 1 },
  cal: { gap: 8 },
  nav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  navBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  week: { flexDirection: "row" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, alignItems: "center", paddingVertical: 3 },
  day: { width: 36, height: 36, borderRadius: Radius.pill, alignItems: "center", justifyContent: "center" },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Palette.greenFg, marginTop: 1 },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  flex: { flex: 1, paddingHorizontal: 8 },
});
