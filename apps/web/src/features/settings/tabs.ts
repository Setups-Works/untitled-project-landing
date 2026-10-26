/** The Settings sections. Each has its own address, e.g. /dashboard/settings/security. */
export type SettingsTab = "profile" | "prefs" | "appearance" | "billing" | "security" | "data" | "danger";

const SLUGS: Record<SettingsTab, string> = {
  profile: "profile",
  prefs: "preferences",
  appearance: "appearance",
  billing: "billing",
  security: "security",
  data: "data",
  danger: "danger",
};

export const SETTINGS_BASE = "/dashboard/settings";

export const settingsHref = (tab: SettingsTab) => `${SETTINGS_BASE}/${SLUGS[tab]}`;

/** "preferences" → "prefs"; null when the address names no section. */
export const tabFromSlug = (slug: string | undefined): SettingsTab | null =>
  (Object.keys(SLUGS) as SettingsTab[]).find((k) => SLUGS[k] === slug) ?? null;

/** The section named by a pathname, or null when Settings is not open. A bare /dashboard/settings opens Profile. */
export function tabFromPath(path: string): SettingsTab | null {
  if (path !== SETTINGS_BASE && !path.startsWith(`${SETTINGS_BASE}/`)) return null;
  return tabFromSlug(path.slice(SETTINGS_BASE.length + 1).split("/")[0]) ?? "profile";
}
