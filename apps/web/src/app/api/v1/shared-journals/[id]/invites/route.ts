import { handler } from "../../../../../../server/api/handler";
import { inviteByEmail, inviteByUsername } from "../../../../../../server/services/collaboration/collaboration.service";
import { inviteBody } from "../../../../../../server/services/collaboration/collaboration.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Invite someone by username or email address (`username` holds either). They join only after they accept. */
export const POST = handler({ write: true, body: inviteBody, status: 201 }, ({ userId, params, body }) =>
  body.username.includes("@")
    ? inviteByEmail(userId, params.id, body.username, body.role)
    : inviteByUsername(userId, params.id, body.username, body.role),
);
