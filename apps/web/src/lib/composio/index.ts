/**
 * Composio — OAuth, tools, triggers and connections for Gmail, Google Calendar, Slack, GitHub and more.
 * NOT IMPLEMENTED YET (Phase 3). This file fixes the vocabulary so features and the server service agree on it.
 *
 * Rule: browser code never talks to Composio directly. It calls our own /api/v1/integrations/* routes, which use
 * the server service in src/server/services/composio (that is where COMPOSIO_API_KEY lives).
 */

export type IntegrationApp = "gmail" | "googlecalendar" | "slack" | "github";

export type ConnectionStatus = "connected" | "pending" | "expired" | "error";

/** One user's link to one external app, as shown on the Integrations page. */
export type IntegrationConnection = {
  id: string;
  app: IntegrationApp;
  status: ConnectionStatus;
  /** Display name of the connected account (e.g. an email address). Never a token. */
  account?: string;
  connectedAt: string;
};

export const INTEGRATION_APPS: { app: IntegrationApp; label: string; phase: number }[] = [
  { app: "gmail", label: "Gmail", phase: 3 },
  { app: "googlecalendar", label: "Google Calendar", phase: 3 },
  { app: "slack", label: "Slack", phase: 5 },
  { app: "github", label: "GitHub", phase: 5 },
];
