# src/types

**Purpose:** types used in two or more places. `index.ts` re-exports the domain types (today defined in `src/lib/workspace.ts`: `Task`, `Note`, `Chat`, `Message`, `Entry`, …) plus AI and integration types.

**Rules:** types describing database rows should match `docs/DATA_MODEL.md` — update both together. A type used by one feature stays in that feature. Prefer deriving types from Zod schemas (`z.infer`) once services exist so API, service and UI cannot drift.
