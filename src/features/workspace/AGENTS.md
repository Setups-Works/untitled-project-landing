# features/workspace

**Does (planned):** create/rename/delete workspaces, switch the active workspace, invite and manage members and roles. **Track A. Phase 1.** *(Not in the original folder list — added because "Workspace" is an application service in the architecture.)*

**Backed by:** `workspaces`, `workspace_members(role)`, `workspace_invites`; SQL helpers `is_workspace_member()` / `workspace_role()`. Service: `src/server/services/workspace`.

**Rules**
- The active workspace is a cookie resolved once per request on the server; UI reads it from context, never from query params.
- Roles: owner · admin · member · viewer — permission matrix in `docs/SECURITY.md` (UNT-58). Only owners/admins manage members.
- Every domain query must be workspace-scoped; journal entries stay author-private.

**Jira:** UNT-54 (data + RLS), UNT-55 (UI), UNT-58 (RBAC), UNT-95 (admin page).
