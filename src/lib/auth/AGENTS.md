# lib/auth

**Purpose (planned, UNT-58):** one documented module for roles and permissions — the permission matrix, `can(ctx, action, resource)`, role types (`owner | admin | member | viewer`, platform `admin`), and moving the `ADMIN_EMAILS` / `app_metadata.role` bootstrap out of `lib/supabase/admin.ts` into a clear API.

**Today:** auth helpers live in `server/session.ts` (`isAdmin`, `requireAdmin`, `currentUser`), `server/auth.ts` (Better Auth), `lib/auth/client.ts` and `lib/auth/redirect.ts` (`safeNext`).

**Rules:** pure, side-effect-free permission logic (so it can be unit-tested and used by services, API routes and AI tools); the matrix is documented in `docs/SECURITY.md`.
