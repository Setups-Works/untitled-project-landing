# services/calendar

**Owner:** track C. **Phase 3.** **Jira:** UNT-72 (service), UNT-73 (UI), UNT-76 (daily brief), UNT-82 (AI reads calendar), UNT-89 (triggers).

**Responsibilities:** list/create/update/delete events through Composio Google Calendar tools; cache events in `calendar_events` for fast reads; incremental sync job plus trigger-driven refresh; free/busy helpers for the AI and the daily brief.

**Rules**
- Store everything in UTC with the event's original timezone; convert for display using the user's timezone preference. Test daylight-saving boundaries and all-day events.
- Writes (create/update/delete) from the AI require confirmation upstream — this service just executes authorised requests.
- Never expose another workspace's cached events; cache rows carry `workspace_id` and are protected by RLS.
- Handle `ConnectionExpired` by returning a typed error the UI turns into "Reconnect".
