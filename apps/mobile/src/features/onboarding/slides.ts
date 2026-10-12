import type { Tone } from "@untitled/types";

import type { IconName } from "@/components/ui/Icon";

/** Content comes from what the product actually does today (README "What's built" and docs/SECURITY.md). */
export const SLIDES: { key: string; icon: IconName; tone: Tone; eyebrow: string; title: string; body: string }[] = [
  {
    key: "workspace",
    icon: "layer-group",
    tone: "green",
    eyebrow: "Welcome",
    title: "One workspace for everything you keep",
    body: "Notes, to-dos and your journal live side by side, so nothing gets lost between apps.",
  },
  {
    key: "plan",
    icon: "list-check",
    tone: "violet",
    eyebrow: "To-do",
    title: "Plan your day, then do it",
    body: "Set priorities and due dates, see what’s overdue, and tick things off from Today.",
  },
  {
    key: "capture",
    icon: "pen-to-square",
    tone: "amber",
    eyebrow: "Notes & journal",
    title: "Capture it now, reflect later",
    body: "Colour-code notes, and add as many timestamped journal entries a day as you like.",
  },
  {
    key: "private",
    icon: "lock",
    tone: "blue",
    eyebrow: "Private by design",
    title: "Your data stays yours",
    body: "Journal entries are visible only to you, and everything runs on your own self-hosted stack.",
  },
];
