# services/composio

**Owner:** track C. **Phase 3.** **Jira:** UNT-70 (service), UNT-71 (page), UNT-94 (Slack/GitHub), UNT-96 (admin health).

**Responsibilities**

- Thin, typed wrapper around the Composio SDK using `COMPOSIO_API_KEY`: list apps, start OAuth (return a redirect URL), handle the callback, list/disconnect connections, execute tools, register triggers.
- Persist `integration_connections` (user/workspace, app, Composio connection id, status, display label). **Never store OAuth tokens.**
- Map Composio statuses/errors to `ConnectionStatus` and typed errors (`ConnectionExpired`, `RateLimited`, `NotConnected`).
- Verify webhook/trigger signatures; convert triggers into job/automation events.

**Rules**

- Only domain services (`calendar`, `email`, `automation`, `ai` tools) call this service; features and the browser never do.
- Add retries with backoff for transient failures; surface permanent failures as typed errors the UI can explain ("Reconnect Gmail").
- Vocabulary lives in `src/lib/composio` (safe to import anywhere); this folder is server-only.
