import { z } from "zod";
import { forbidden, json, sameOrigin, unauthorized } from "../../../../../server/http";
import { currentUser } from "../../../../../server/session";
import { isBucket, objectUrl, ownsKey, validKey } from "../../../../../server/storage";
import { mayUseJournalFile } from "../../../../../server/services/collaboration/collaboration.service";

const body = z.object({
  bucket: z.string(),
  paths: z.array(z.string()).min(1).max(200),
  ttl: z.number().int().min(60).max(86_400).optional(),
});

/** Returns expiring links for the caller's own files and for files in shared journals they belong to (used as <img>/<audio> sources). */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  const user = await currentUser();
  if (!user) return unauthorized();
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success || !isBucket(p.data.bucket)) return json({ error: "Bad request." }, 400);
  const bucket = p.data.bucket;
  const data = await Promise.all(
    p.data.paths.map(async (path) => {
      // Your own files, or a file in a shared journal you belong to (anyone in the journal may read what its members attached).
      const allowed = validKey(path) && (ownsKey(user.id, path) || (await mayUseJournalFile(user.id, path, false)) === true);
      return allowed
        ? { path, signedUrl: objectUrl(bucket, path, p.data.ttl ?? 3600), error: null }
        : { path, signedUrl: null, error: "Not allowed" };
    }),
  );
  return json({ data });
}
