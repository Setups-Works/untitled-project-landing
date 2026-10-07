# lib/utils

**Purpose:** generic, dependency-free helpers (formatting, ids, small array/string helpers, a structured logger in Phase 6 — UNT-34). Today the equivalents are `lib/dates.ts` and `lib/validate.ts`; move them here when you next touch them.

**Rules:** each helper pure and unit-tested; no React, no database, no feature knowledge. If it only serves one feature, it belongs in that feature's `lib/`.
