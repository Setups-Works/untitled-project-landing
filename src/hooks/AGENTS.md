# src/hooks

**Purpose:** React hooks used by **two or more** features: `useAutosave`, `useRecorder` (voice), `useAuthState`, `useRealtimeTable` (UNT-68), `useUpload` (UNT-67), `useMediaQuery`. Feature-specific hooks live in `src/features/<name>/hooks`.

**Done:** `useRealtimeInvalidate(table, queryKeys)` — listens to one shared Server-Sent Events stream (`/api/v1/realtime`) and invalidates TanStack Query keys (debounced). The table needs the notify trigger (see the realtime migration).

**Today (legacy):** `components/app/useAutosave.ts`, `components/app/useRecorder.ts`, `components/auth/useAuthState.ts` — move here when touched.

**Rules:** hooks never import from `src/server`; clean up effects; document inputs/outputs in a short JSDoc; don't hide network calls in generic hooks without an obvious name.
