/** Local-time YYYY-MM-DD (not UTC), so "today" matches the user's own calendar. */
export const isoDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  return isoDate(new Date(y, m - 1, d + n));
};

/**
 * A sentence for the assistant's prompt that says what today is and lists the next three weeks with their weekday names, so it
 * can resolve "next Tuesday", "this Friday" or "in two weeks" by lookup instead of arithmetic (which language models get wrong).
 */
export function calendarFor(today: string) {
  const name = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long" });
  };
  const next = Array.from({ length: 21 }, (_, i) => addDays(today, i + 1)).map((iso) => `${name(iso)} ${iso}`);
  return `Today is ${name(today)} ${today} (the user's local date). The coming days: ${next.join(", ")}. Always take dates from this list when the user names a weekday or a relative day.`;
}

export const greeting = (d = new Date()) => {
  const h = d.getHours();
  return h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

export function ago(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Whole days from a to b (both YYYY-MM-DD). */
export const daysBetween = (a: string, b: string) => {
  const t = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((t(b) - t(a)) / 86_400_000);
};

export const dayLabel = (iso: string, today = isoDate()) => {
  if (iso === today) return "Today";
  if (iso === addDays(today, 1)) return "Tomorrow";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};
