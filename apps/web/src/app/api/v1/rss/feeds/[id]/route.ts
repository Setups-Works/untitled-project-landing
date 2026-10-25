import { handler } from "../../../../../../server/api/handler";
import { removeFeed } from "../../../../../../server/services/rss/rss.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Unfollow a feed and drop its articles. */
export const DELETE = handler({ write: true }, ({ userId, params }) => removeFeed(userId, params.id!));
