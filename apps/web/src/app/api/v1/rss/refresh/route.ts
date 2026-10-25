import { handler } from "../../../../../server/api/handler";
import { refreshFeeds } from "../../../../../server/services/rss/rss.service";
import { refreshInput } from "../../../../../server/services/rss/rss.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/** Fetch new articles for one feed or all feeds. */
export const POST = handler({ write: true, body: refreshInput }, ({ userId, body }) => refreshFeeds(userId, body.feed_id));
