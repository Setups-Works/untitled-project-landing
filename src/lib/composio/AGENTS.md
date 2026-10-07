# lib/composio

**Contents:** `index.ts` — `IntegrationApp`, `ConnectionStatus`, `IntegrationConnection`, `INTEGRATION_APPS` (which app arrives in which phase). Pure types and constants, safe in the browser.

**The Composio SDK and `COMPOSIO_API_KEY` live only in `src/server/services/composio`.** Browser code uses our `/api/v1/integrations/*` routes. Never import the SDK here. **Jira:** UNT-70, UNT-71.
