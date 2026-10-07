# features/search

**Does:** universal search (Ctrl/⌘+K) over pages, actions, tasks, notes, journal, chats; later a `/search` page. **Track B. Phase 2.**

**Today (legacy):** `components/app/UniversalSearch.tsx` — queries Supabase with `ilike` from the browser (debounced, stale-result guard). `openSearch()` opens it from anywhere.

**Target:** `GET /api/v1/search` backed by `search_workspace()` (tsvector + GIN, ranking, highlighted snippets), later hybrid with pgvector (UNT-86).

**Rules**
- Results are always scoped to the user's workspace; journal only the author's own.
- Strip characters that have meaning in filter syntax before building queries (see `clean()`); prefer RPC/parameterised search in the target.
- Keyboard: ↑/↓/Enter/Esc; deep links use query params (`?task=`, `?d=`, `?c=`, `?note=`).

**Jira:** UNT-63 (server-side search), UNT-86 (semantic).
