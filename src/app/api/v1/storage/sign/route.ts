import { z } from "zod";
import { forbidden, json, sameOrigin, unauthorized } from "../../../../../server/http";
import { currentUser } from "../../../../../server/session";
import { isBucket, objectUrl, ownsKey, validKey } from "../../../../../server/storage";

const body = z.object({
  bucket: z.string(),
  paths: z.array(z.string()).min(1).max(200),
  ttl: z.number().int().min(60).max(86_400).optional(),
});

/** Returns expiring links for the caller's own files (used as <img>/<audio> sources). */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  const user = await currentUser();
  if (!user) return unauthorized();
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success || !isBucket(p.data.bucket)) return json({ error: "Bad request." }, 400);
  const bucket = p.data.bucket;
  const data = p.data.paths.map((path) =>
    validKey(path) && ownsKey(user.id, path)
      ? { path, signedUrl: objectUrl(bucket, path, p.data.ttl ?? 3600), error: null }
      : { path, signedUrl: null, error: "Not allowed" },
  );
  return json({ data });
}
