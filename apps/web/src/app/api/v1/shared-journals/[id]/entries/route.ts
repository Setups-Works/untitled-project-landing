import { handler } from "../../../../../../server/api/handler";
import { ValidationError } from "../../../../../../server/errors";
import { addEntry, listEntries } from "../../../../../../server/services/collaboration/collaboration.service";
import { entryCreate, feedQuery } from "../../../../../../server/services/collaboration/collaboration.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** A page of entries, newest day first. `?cursor=<oldest day loaded>&limit=<n>` continues the feed. */
export const GET = handler({}, ({ userId, params, query }) => {
  const feed = feedQuery.safeParse(Object.fromEntries(query));
  if (!feed.success) throw new ValidationError(feed.error.issues[0]?.message ?? "That page request doesn’t look right.");
  return listEntries(userId, params.id, feed.data);
});
export const POST = handler({ write: true, body: entryCreate, status: 201 }, ({ userId, params, body }) =>
  addEntry(userId, params.id, body),
);
