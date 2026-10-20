import { handler } from "../../../../../../../server/api/handler";
import { cancelInvite } from "../../../../../../../server/services/collaboration/collaboration.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Withdraw an invitation that hasn't been answered. */
export const DELETE = handler({ write: true }, ({ userId, params }) => cancelInvite(userId, params.id, params.inviteId));
