import { handler } from "../../../../server/api/handler";
import { listMyInvites } from "../../../../server/services/collaboration/collaboration.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Invitations to shared journals that are waiting for your answer. */
export const GET = handler({}, ({ userId }) => listMyInvites(userId));
