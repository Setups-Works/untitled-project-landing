import { handler } from "../../../../../../server/api/handler";
import { getItem, updateItem } from "../../../../../../server/services/rss/rss.service";
import { itemPatchInput } from "../../../../../../server/services/rss/rss.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** One article with its full text. */
export const GET = handler({}, ({ userId, params }) => getItem(userId, params.id!));

/** Mark an article read/unread or starred/unstarred. */
export const PATCH = handler({ write: true, body: itemPatchInput }, ({ userId, params, body }) => updateItem(userId, params.id!, body));
