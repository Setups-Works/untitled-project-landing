import { handler } from "../../../../../server/api/handler";
import { markAllRead } from "../../../../../server/services/rss/rss.service";
import { readAllInput } from "../../../../../server/services/rss/rss.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Mark everything read, or only one feed's articles. */
export const POST = handler({ write: true, body: readAllInput }, ({ userId, body }) => markAllRead(userId, body.feed_id));
