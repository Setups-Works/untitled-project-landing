# services/automation

**Owner:** track C. **Phase 5.** **Jira:** UNT-89 (engine), UNT-90 (UI), UNT-94 (Slack/GitHub), UNT-91 (notifications).

**Responsibilities:** store automations (`trigger` + `conditions` + `actions` as validated JSON), evaluate triggers (schedule, task events, Composio triggers), execute actions (create task/note, notify, draft email, run an AI action), record every run in `automation_runs`.

**Rules**

- Idempotent runs (idempotency key per trigger event); retries with backoff; one failing action never blocks others.
- Loop protection: an action's side effects must not re-trigger the same automation (tag events with their origin).
- Run via the job runner, never inline in a request. Rule evaluation is pure and unit-tested.
- AI actions inside automations are subject to the same confirmation/limits policy; destructive actions are not allowed without explicit user opt-in.
- Disabling an automation takes effect on the next evaluation — check `enabled` at execution time, not only at scheduling time.
