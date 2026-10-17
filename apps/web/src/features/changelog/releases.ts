import type { Tone } from "../../lib/tones";

export type Platform = "web" | "app";
export type ChangeKind = "new" | "improved" | "fixed";

export type Change = { kind: ChangeKind; platform: Platform; text: string };

export type Release = {
  /** ISO calendar day, newest first in the list. */
  date: string;
  title: string;
  summary: string;
  tone: Tone;
  /** The Android app's version tag, when the day shipped one. It links to the matching GitHub Release. */
  appVersion?: string;
  changes: Change[];
};

/**
 * The public changelog, newest first. Add an entry when something people can see ships; keep each line to what changed for
 * them, not how. App releases are published as GitHub Releases, so `appVersion` is the tag name (`v1.0.1`).
 */
export const RELEASES: Release[] = [
  {
    date: "2026-10-17",
    title: "Health syncs, and the app updates itself",
    summary: "Partial health data now shows up, and new Android versions are offered inside the app.",
    tone: "mint",
    appVersion: "v1.0.2",
    changes: [
      { kind: "new", platform: "app", text: "The app checks GitHub for a newer version when it opens and offers to install it." },
      { kind: "fixed", platform: "app", text: "Health no longer fails to sync when one reading, such as resting heart rate, is missing." },
      { kind: "improved", platform: "app", text: "Each Health tile shows its most recent value, and says which day it’s from when it isn’t today." },
      { kind: "improved", platform: "app", text: "Health shows what your phone read even when it can’t be saved to your account yet." },
      { kind: "fixed", platform: "web", text: "A reading outside the possible range is stored as no data instead of rejecting the whole sync." },
      { kind: "new", platform: "web", text: "This changelog page, covering both the web app and the Android app." },
      { kind: "improved", platform: "web", text: "Emails carry the ghost logo." },
    ],
  },
  {
    date: "2026-10-17",
    title: "Health sync tells you what went wrong",
    summary: "When the phone can’t send your health data, the app now says why instead of waiting forever.",
    tone: "clay",
    appVersion: "v1.0.1",
    changes: [
      { kind: "fixed", platform: "app", text: "The Health tab shows the real sync error with a Retry button, instead of “Syncing” that never ends." },
      { kind: "improved", platform: "app", text: "Clearer states for syncing, nothing synced yet, and a sync that failed." },
      { kind: "improved", platform: "web", text: "Health sync failures are recorded on the server so they can be diagnosed." },
      { kind: "improved", platform: "web", text: "The API reference and Swagger UI now list the Health endpoints." },
    ],
  },
  {
    date: "2026-10-17",
    title: "Health, Plan and the Android app",
    summary: "Your steps, sleep and heart rate in one place, and a first Android release you can install.",
    tone: "green",
    appVersion: "v1.0.0",
    changes: [
      { kind: "new", platform: "app", text: "Health tab: steps, distance, active energy, sleep and heart rate from Health Connect." },
      { kind: "new", platform: "web", text: "Health page on the web, fed by your phone, and available to the assistant as context." },
      { kind: "new", platform: "app", text: "Plan tab for what’s coming up." },
      { kind: "new", platform: "app", text: "Animated splash screen, ghost branding and audio that matches the web app." },
      { kind: "new", platform: "app", text: "Android builds are published as GitHub Releases whenever a version is tagged." },
    ],
  },
  {
    date: "2026-10-13",
    title: "A closer match to the web",
    summary: "The app picks up the web’s dialogs, a floating bar on Android and a redesigned home.",
    tone: "blue",
    changes: [
      { kind: "improved", platform: "app", text: "Confirm dialogs styled like the web’s, and a floating navigation bar on Android." },
      { kind: "improved", platform: "app", text: "Redesigned home dashboard." },
      { kind: "new", platform: "app", text: "Personality insights." },
      { kind: "improved", platform: "app", text: "Workspace features brought in line with the web app." },
      { kind: "improved", platform: "web", text: "The web app now deploys automatically to Azure from a container image." },
    ],
  },
  {
    date: "2026-10-12",
    title: "The mobile app begins",
    summary: "To-do, Notes, Journal and Chat on your phone, and a refreshed look for the site.",
    tone: "violet",
    changes: [
      { kind: "new", platform: "app", text: "Mobile app with onboarding, sign-in, To-do, Notes, Journal and Chat." },
      { kind: "new", platform: "app", text: "Liquid-glass cards on every page, and swipe to delete." },
      { kind: "improved", platform: "web", text: "Redesigned landing site with liquid-glass surfaces and motion." },
    ],
  },
  {
    date: "2026-10-10",
    title: "Calendar",
    summary: "See your time as a month, week, day or agenda.",
    tone: "amber",
    changes: [
      { kind: "new", platform: "web", text: "Calendar with month, week, day and agenda views." },
      { kind: "new", platform: "web", text: "Design language guide so every screen looks like one product." },
    ],
  },
  {
    date: "2026-10-09",
    title: "A welcome gift and tidier admin",
    summary: "New people get a card with their name on it.",
    tone: "gold",
    changes: [
      { kind: "new", platform: "web", text: "Welcome gift card after onboarding, downloadable from Settings." },
      { kind: "fixed", platform: "web", text: "Admin confirm dialogs open correctly, and dates no longer flicker on load." },
    ],
  },
  {
    date: "2026-10-08",
    title: "APIs, right-click and liquid glass",
    summary: "A public API for your notes, to-dos and journal, plus a lot of polish.",
    tone: "mint",
    changes: [
      { kind: "new", platform: "web", text: "REST API for notes, to-dos and journal, documented in Swagger UI." },
      { kind: "new", platform: "web", text: "Right-click menu with actions for the thing under the cursor." },
      { kind: "new", platform: "web", text: "Repeating to-dos on the n-th weekday of the month, shown on the calendar." },
      { kind: "new", platform: "web", text: "Turn a chat message into a journal entry, to-dos and notes, created only after you confirm." },
      { kind: "improved", platform: "web", text: "Liquid-glass dialogs, menus, cards and search." },
      { kind: "new", platform: "web", text: "Admins can see and end a person’s sign-ins, and ban with a reason and length." },
    ],
  },
];

export const KIND_LABEL: Record<ChangeKind, string> = { new: "New", improved: "Improved", fixed: "Fixed" };
export const PLATFORM_LABEL: Record<Platform, string> = { web: "Web", app: "App" };

export type PlatformFilter = "all" | Platform;

/** The changes shown for a filter; releases with nothing left are dropped. */
export function filterReleases(releases: Release[], filter: PlatformFilter): Release[] {
  if (filter === "all") return releases;
  return releases
    .map((r) => ({ ...r, changes: r.changes.filter((c) => c.platform === filter) }))
    .filter((r) => r.changes.length > 0);
}
