# features/integrations

**Does (planned):** the Integrations page — connect, reconnect and disconnect Gmail and Google Calendar (later Slack, GitHub), show status and last sync. **Track B (UI) + C (service). Phase 3.**

**Backed by:** `integration_connections` + `src/server/services/composio` + `/api/v1/integrations/*`. Vocabulary/types: `src/lib/composio`.

**Rules**
- Browser never talks to Composio. OAuth starts by calling our API for a redirect URL and returns to `/api/v1/integrations/callback`.
- We store connection ids and a display label only — **never tokens**.
- Expired/error states are first-class UI ("Reconnect").

**Jira:** UNT-70 (service), UNT-71 (page), UNT-94, UNT-96 (admin health).
