import { handler } from "../../../../../server/api/handler";
import { deleteJournal, getJournal, renameJournal } from "../../../../../server/services/collaboration/collaboration.service";
import { journalName } from "../../../../../server/services/collaboration/collaboration.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** One journal with its people (and, for the owner, open invitations). */
export const GET = handler({}, ({ userId, params }) => getJournal(userId, params.id));
export const PATCH = handler({ write: true, body: journalName }, ({ userId, params, body }) => renameJournal(userId, params.id, body.name));
export const DELETE = handler({ write: true }, ({ userId, params }) => deleteJournal(userId, params.id));
