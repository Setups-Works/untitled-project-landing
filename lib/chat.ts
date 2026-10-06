import type { Chat } from "./workspace";

/** Greeting for the empty chat screen — depends on the visitor's local hour and name. */
export function chatGreeting(name: string, hour = new Date().getHours()) {
  if (hour >= 5 && hour < 12) return { title: `Good morning, ${name}`, sub: "Fresh start. What’s first on your mind?" };
  if (hour >= 12 && hour < 17) return { title: `Good afternoon, ${name}`, sub: "What can we get done?" };
  if (hour >= 17 && hour < 22) return { title: `Good evening, ${name}`, sub: "Winding down or just getting going?" };
  return { title: `Still up, ${name}?`, sub: "Night owl mode. Let’s go." };
}

/** Display form of a chat title: first letter capitalised, stray trailing punctuation removed. */
export const prettyTitle = (t: string) => {
  const s = t.trim().replace(/[\s.,;:!?-]+$/, "");
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "New chat";
};

/** "now", "5m", "3h", "4d", "2mo", "1y" */
export function ageShort(iso: string, now = Date.now()) {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d`;
  if (s < 86400 * 365) return `${Math.floor(s / (86400 * 30))}mo`;
  return `${Math.floor(s / (86400 * 365))}y`;
}

export const isUnread = (c: Chat) => new Date(c.updated_at).getTime() > new Date(c.last_read_at).getTime() + 1000;

/** Date buckets for the sidebar: Today, Yesterday, Previous 7 days, Previous 30 days, then month by month. */
export function groupByDate(chats: Chat[], now = new Date()): { label: string; items: Chat[] }[] {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const out = new Map<string, Chat[]>();
  for (const c of chats) {
    const t = new Date(c.updated_at).getTime();
    const label =
      t >= start ? "Today" :
      t >= start - 86_400_000 ? "Yesterday" :
      t >= start - 7 * 86_400_000 ? "Previous 7 days" :
      t >= start - 30 * 86_400_000 ? "Previous 30 days" :
      new Date(t).toLocaleDateString(undefined, { month: "long", year: "numeric" });
    out.set(label, [...(out.get(label) ?? []), c]);
  }
  return [...out.entries()].map(([label, items]) => ({ label, items }));
}
