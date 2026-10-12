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
