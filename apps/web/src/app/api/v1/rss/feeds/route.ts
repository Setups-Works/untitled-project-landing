import { handler } from "../../../../../server/api/handler";
import { addFeed, listFeeds } from "../../../../../server/services/rss/rss.service";
import { addFeedInput } from "../../../../../server/services/rss/rss.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** The feeds you follow, each with its unread count. */
export const GET = handler({}, ({ userId }) => listFeeds(userId));

/** Follow a feed. Accepts a feed address or a website address that advertises one. */
export const POST = handler({ write: true, body: addFeedInput, status: 201 }, ({ userId, body }) => addFeed(userId, body.url));
