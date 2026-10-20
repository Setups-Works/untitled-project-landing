import type { Chat } from "./types";

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
/** Date buckets for the recent chats drawer, matching the web sidebar. */
export function groupByDate(chats: Chat[], now = new Date()): { label: string; items: Chat[] }[] {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const out = new Map<string, Chat[]>();
  // Pinned chats get their own section first; Map keeps insertion order.
  const pinned = chats.filter((chat) => chat.pinned);
  if (pinned.length) out.set("Pinned", pinned);
  for (const chat of chats) {
    if (chat.pinned) continue;
    const time = new Date(chat.updated_at).getTime();
    const label =
      time >= start
        ? "Today"
        : time >= start - 86_400_000
          ? "Yesterday"
          : time >= start - 7 * 86_400_000
            ? "Previous 7 days"
            : time >= start - 30 * 86_400_000
              ? "Previous 30 days"
              : new Date(time).toLocaleDateString(undefined, { month: "long", year: "numeric" });
    out.set(label, [...(out.get(label) ?? []), chat]);
  }
  return [...out.entries()].map(([label, items]) => ({ label, items }));
}
