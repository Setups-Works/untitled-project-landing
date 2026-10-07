/**
 * Feature flags. A flag is `true` once the feature is shipped and safe for every user.
 * Flip a flag here when the matching Jira epic is done — UI should read the flag instead of guessing.
 * (Per-user or per-plan gating lives in the database later; these are global switches.)
 */
export const FEATURES = {
  // Built
  notes: true,
  tasks: true,
  journal: true,
  chat: true,
  chatSharing: true,
  universalSearch: true,
  adminPanel: true,

  // Planned — see docs/PHASES.md
  workspaces: false, // Phase 1: shared workspaces and membership
  aiReplies: false, // Phase 4: real AI answers in Chat (provider router + orchestrator)
  calendar: false, // Phase 3: Google Calendar through Composio
  email: false, // Phase 3: Gmail through Composio
  integrations: false, // Phase 3: Composio connections page
  meetings: false, // Phase 5
  automations: false, // Phase 5
  notifications: false, // Phase 5
  insightsAi: false, // Phase 5: AI-written insights (today they are computed locally)
  billing: false, // Phase 6: Free vs Pro enforcement
} as const;

export type FeatureName = keyof typeof FEATURES;
export const isEnabled = (f: FeatureName) => FEATURES[f];
