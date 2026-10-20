import { handler } from "../../../../../../../server/api/handler";
import { changeRole, removeMember } from "../../../../../../../server/services/collaboration/collaboration.service";
import { roleBody } from "../../../../../../../server/services/collaboration/collaboration.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const PATCH = handler({ write: true, body: roleBody }, ({ userId, params, body }) =>
  changeRole(userId, params.id, params.userId, body.role),
);
/** The owner removes someone, or a member leaves by passing their own id. */
export const DELETE = handler({ write: true }, ({ userId, params }) => removeMember(userId, params.id, params.userId));
