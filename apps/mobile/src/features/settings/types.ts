export { NOTE_CATEGORIES } from "@/lib/preferences";
export type { SettingsPrefs } from "@/lib/preferences";

export type AccountSettings = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  username: string | null;
  displayUsername: string | null;
  providers: string[];
  hasPassword: boolean;
  createdAt: string;
  lastSignIn: string | null;
  preferences: unknown;
};

export type SettingsSection = "profile" | "prefs" | "appearance" | "security" | "data" | "danger";

export const SETTINGS_SECTIONS: { key: SettingsSection; title: string; icon: "user" | "sliders" | "palette" | "shield-halved" | "database" | "trash" }[] = [
  { key: "profile", title: "Profile", icon: "user" },
  { key: "prefs", title: "Preferences", icon: "sliders" },
  { key: "appearance", title: "Appearance", icon: "palette" },
  { key: "security", title: "Security", icon: "shield-halved" },
  { key: "data", title: "Your data", icon: "database" },
  { key: "danger", title: "Danger zone", icon: "trash" },
];
