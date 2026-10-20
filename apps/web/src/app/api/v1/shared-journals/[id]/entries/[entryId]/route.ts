import { handler } from "../../../../../../../server/api/handler";
import { editEntry, removeEntry } from "../../../../../../../server/services/collaboration/collaboration.service";
import { entryUpdate } from "../../../../../../../server/services/collaboration/collaboration.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const PATCH = handler({ write: true, body: entryUpdate }, ({ userId, params, body }) =>
  editEntry(userId, params.id, params.entryId, body),
);
export const DELETE = handler({ write: true }, ({ userId, params }) => removeEntry(userId, params.id, params.entryId));
