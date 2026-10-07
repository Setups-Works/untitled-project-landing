# features/automation

**Does (planned):** "when X happens, do Y": list, enable/disable, create from templates, simple trigger+action builder, run history. **Track B (UI) + C (engine). Phase 5.**

**Backed by:** `automations`, `automation_runs`; engine in `src/server/services/automation` run by the job runner; triggers from schedules, task events and Composio (new mail, calendar change).

**Rules**
- The builder produces a validated JSON rule; preview it in plain English before saving.
- Runs are idempotent and isolated: one failing action never blocks others; every run is recorded.
- Disabling takes effect immediately. Guard against loops (an automation triggering itself).

**Jira:** UNT-89 (engine), UNT-90 (UI), UNT-94 (Slack/GitHub).
