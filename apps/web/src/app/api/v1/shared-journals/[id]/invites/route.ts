import { handler } from "../../../../../../server/api/handler";
import { inviteByUsername } from "../../../../../../server/services/collaboration/collaboration.service";
import { inviteBody } from "../../../../../../server/services/collaboration/collaboration.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Invite someone by username. They join only after they accept. */
export const POST = handler({ write: true, body: inviteBody, status: 201 }, ({ userId, params, body }) =>
  inviteByUsername(userId, params.id, body.username, body.role),
);
