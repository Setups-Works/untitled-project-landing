/** Query keys in one place (the web keeps its own in apps/web/src/lib/query/keys.ts). */
export const qk = {
  tasks: ["tasks"] as const,
  notes: ["notes"] as const,
  journal: ["journal"] as const,
  settings: ["settings"] as const,
  health: ["health"] as const,
  calendar: ["calendar"] as const,
};
