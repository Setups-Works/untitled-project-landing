# src/hooks

**Purpose:** React hooks used by **two or more** features: `useAutosave`, `useRecorder` (voice), `useAuthState`, `useRealtimeTable` (UNT-68), `useUpload` (UNT-67), `useMediaQuery`. Feature-specific hooks live in `src/features/<name>/hooks`.

**Today (legacy):** `components/app/useAutosave.ts`, `components/app/useRecorder.ts`, `components/auth/useAuthState.ts` — move here when touched.

**Rules:** hooks never import from `src/server`; clean up effects; document inputs/outputs in a short JSDoc; don't hide network calls in generic hooks without an obvious name.
