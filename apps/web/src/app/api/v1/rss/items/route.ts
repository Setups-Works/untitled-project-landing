import { handler } from "../../../../../server/api/handler";
import { ValidationError } from "../../../../../server/errors";
import { listItems } from "../../../../../server/services/rss/rss.service";
import { itemsQuery } from "../../../../../server/services/rss/rss.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Articles, newest first. Filters: feed, filter=all|unread|starred, q (search). Page with the returned `next` as `cursor`. */
export const GET = handler({}, ({ userId, query }) => {
  const parsed = itemsQuery.safeParse(Object.fromEntries(query));
  if (!parsed.success) throw new ValidationError("That filter isn’t valid.");
  return listItems(userId, parsed.data);
});
