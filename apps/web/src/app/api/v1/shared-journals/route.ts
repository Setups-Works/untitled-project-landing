import { handler } from "../../../../server/api/handler";
import { createJournal, listJournals } from "../../../../server/services/collaboration/collaboration.service";
import { journalName } from "../../../../server/services/collaboration/collaboration.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** The journals you own or belong to. */
export const GET = handler({}, ({ userId }) => listJournals(userId));

/** Start a new shared journal; you are its owner. */
export const POST = handler({ write: true, body: journalName, status: 201 }, ({ userId, body }) => createJournal(userId, body.name));
