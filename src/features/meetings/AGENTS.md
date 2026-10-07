# features/meetings

**Does (planned):** create/start a meeting, record audio in the browser or upload it, take notes from a template, see transcript + summary + action items, create tasks from them. **Track B (UI) + C (pipeline). Phase 5.**

**Backed by:** `meetings`, `meeting_transcripts`, bucket `note-files`; processing by the background job in `src/server/jobs` and the AI orchestrator (UNT-88).

**Rules**

- Recording is chunk-uploaded so a reload doesn't lose it; work on iOS Safari and Android Chrome.
- Processing is asynchronous with a visible status (uploaded → transcribing → summarising → ready/failed) and retry.
- Link to a calendar event when there is one. Action items → tasks only after user review.
- Transcripts are sensitive: never log their content.

**Jira:** UNT-87 (feature), UNT-88 (pipeline).
