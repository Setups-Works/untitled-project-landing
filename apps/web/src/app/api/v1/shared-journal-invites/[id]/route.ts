import { handler } from "../../../../../server/api/handler";
import { respondToInvite } from "../../../../../server/services/collaboration/collaboration.service";
import { respondBody } from "../../../../../server/services/collaboration/collaboration.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Accept or decline an invitation addressed to you. */
export const POST = handler({ write: true, body: respondBody }, ({ userId, params, body }) =>
  respondToInvite(userId, params.id, body.action),
);
