# features/email

**Does (planned):** Gmail in the workspace: inbox, thread view, compose/reply/forward, labels, turn an email into a task or note. **Track B (UI) + C (service). Phase 3.**

**Backed by:** Composio Gmail tools via `src/server/services/email` (UNT-74). Only thread **metadata** is cached; bodies are fetched on demand and **never stored** in our database.

**Rules**

- Sanitise HTML email (no scripts, no remote images by default) with a tested sanitiser — email is hostile input.
- Sending/replying is a write action: from the AI it always needs user confirmation.
- Respect Gmail rate limits; show friendly errors when the connection expired.

**Jira:** UNT-74 (service), UNT-75 (feature), UNT-76 (daily brief), UNT-82 (AI tools).
