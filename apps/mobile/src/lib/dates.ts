import { getRuntimePrefs } from "./preferences";

/** Calendar days are plain `YYYY-MM-DD` strings in the user's local time, as on the web (apps/web/src/lib/dates.ts). */
export const isoDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function addDays(iso: string, n: number) {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return isoDate(new Date(y, m - 1, d + n));
}
const parse = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
};

export function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export function longDate(d = new Date()) {
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

/** "Today", "Tomorrow", "Yesterday" or "Mon, Oct 12". */
export function dayLabel(iso: string, today = isoDate()) {
  if (iso === today) return "Today";
  if (iso === addDays(today, 1)) return "Tomorrow";
  if (iso === addDays(today, -1)) return "Yesterday";
  return parse(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function timeOf(iso: string) {
  const prefs = getRuntimePrefs();
  return prefs.timeFormat === "24h"
    ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })
    : new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
}
