# features/calendar

**Does (planned):** month/week/day/agenda views of Google Calendar events plus task due dates; create/edit/delete events. **Track B (UI) + C (service). Phase 3.** _Today only the marketing demo and the To-do calendar layout exist._

**Backed by:** `calendar_events` cache + Composio Google Calendar tools through `src/server/services/calendar` (UNT-72). Needs a connection from the Integrations page (UNT-71).

**Rules**

- UI talks to `/api/v1/calendar/*`, never to Composio.
- Store UTC, render in the user's timezone; test DST.
- Without a connection show a connect prompt, not an error. Week start from preferences.
- Mobile uses the agenda view.

**Jira:** UNT-72 (service), UNT-73 (feature), UNT-76 (daily brief), UNT-82 (AI reads calendar).
