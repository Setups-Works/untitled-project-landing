import { z } from "zod";
import { forbidden, json, sameOrigin, unauthorized } from "../../../../../server/http";
import { currentUser } from "../../../../../server/session";
import { deleteObjects, isBucket, ownsKey, purgePrefix, validKey } from "../../../../../server/storage";

const body = z.object({
  bucket: z.string(),
  paths: z.array(z.string()).max(1000).optional(),
  /** Remove everything under the caller's own folder (e.g. when resetting the workspace). Must be the user's id or deeper. */
  prefix: z.string().max(300).optional(),
});

/** Deletes files the signed-in user owns. Other people's keys are skipped, never an error that reveals they exist. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  const user = await currentUser();
  if (!user) return unauthorized();
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success || !isBucket(p.data.bucket)) return json({ error: "Bad request." }, 400);
  const bucket = p.data.bucket;
  if (p.data.paths?.length)
    await deleteObjects(
      bucket,
      p.data.paths.filter((k) => validKey(k) && ownsKey(user.id, k)),
    );
  if (p.data.prefix !== undefined) {
    const prefix = p.data.prefix.endsWith("/") ? p.data.prefix : `${p.data.prefix}/`;
    if (prefix === `${user.id}/` || (ownsKey(user.id, prefix) && !prefix.includes(".."))) await purgePrefix(bucket, prefix);
    else return forbidden();
  }
  return json({ ok: true });
}
