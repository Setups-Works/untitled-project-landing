# services/journal

**Purpose:** what can leave the private journal: a **secret link to one entry** that its author can switch off. (Writing together is a different thing: `services/collaboration`, separate tables.)

- `setEntryShared(userId, entryId, shared)` turns the link on (new random 32-hex token) or off (token cleared). Runs as the user, so only the author's own entry is found.
- `getPublicEntry(token)` is what the public page `/share/journal/[token]` shows: text, date, and signed links to files that really live in the author's folder. No name or email. The token is looked up by exact match with the owner connection; there is no policy or list that exposes shared entries.
- Table: `journal_entries.share_token` (unique, 32 hex, null = private) and `shared_at`.

**Rules**

- Switching off clears the token immediately; the old link stops working at once. Turning on again makes a **new** token.
- The public page is `noindex`, `referrer: no-referrer`, never prints the author's identity, and is read-only.
- Never log entry text or tokens.
