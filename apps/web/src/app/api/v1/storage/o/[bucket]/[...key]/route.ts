import { NextResponse } from "next/server";
import { forbidden, json, sameOrigin, unauthorized } from "../../../../../../../server/http";
import { currentUser } from "../../../../../../../server/session";
import { BUCKETS, deleteObject, getObject, isBucket, ownsKey, putObject, validKey, verifySignature } from "../../../../../../../server/storage";

type Ctx = { params: Promise<{ bucket: string; key: string[] }> };

const keyOf = (parts: string[]) => parts.map(decodeURIComponent).join("/");

/** Download. Public buckets (avatars) are open; private ones need a valid signed link or the owner's session. */
export async function GET(req: Request, { params }: Ctx) {
  const { bucket, key: parts } = await params;
  const key = keyOf(parts);
  if (!isBucket(bucket) || !validKey(key)) return json({ error: "Not found." }, 404);
  if (!BUCKETS[bucket].public) {
    const url = new URL(req.url);
    if (!verifySignature(bucket, key, url.searchParams.get("e"), url.searchParams.get("s"))) {
      const user = await currentUser();
      if (!user) return unauthorized();
      if (!ownsKey(user.id, key)) return forbidden();
    }
  }
  try {
    // Native audio players request byte ranges to stream and seek within media files.
    const range = req.headers.get("range") ?? undefined;
    const o = await getObject(bucket, key, range);
    return new NextResponse(o.stream, {
      status: o.contentRange ? 206 : 200,
      headers: {
        "content-type": o.contentType,
        ...(o.length ? { "content-length": String(o.length) } : {}),
        ...(o.contentRange ? { "content-range": o.contentRange } : {}),
        "accept-ranges": "bytes",
        "cache-control": BUCKETS[bucket].public ? "public, max-age=31536000, immutable" : "private, max-age=300",
        "x-content-type-options": "nosniff",
        // Uploaded files are untrusted: never let them run as pages in our origin.
        "content-security-policy": "default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch {
    return json({ error: "Not found." }, 404);
  }
}

/** Upload. Only into the signed-in user's own folder, within the bucket's size and type limits. */
export async function PUT(req: Request, { params }: Ctx) {
  if (!sameOrigin(req)) return forbidden();
  const user = await currentUser();
  if (!user) return unauthorized();
  const { bucket, key: parts } = await params;
  const key = keyOf(parts);
  if (!isBucket(bucket) || !validKey(key)) return json({ error: "Bad path." }, 400);
  if (!ownsKey(user.id, key)) return forbidden();
  const rules = BUCKETS[bucket];
  const type = (req.headers.get("content-type") || "application/octet-stream").split(";")[0].trim().toLowerCase();
  if (rules.types && !(rules.types as readonly string[]).includes(type)) return json({ error: "That file type isn’t allowed." }, 415);
  const declared = Number(req.headers.get("content-length"));
  if (declared > rules.maxBytes) return json({ error: "That file is too large." }, 413);
  const body = new Uint8Array(await req.arrayBuffer());
  if (body.byteLength > rules.maxBytes) return json({ error: "That file is too large." }, 413);
  await putObject(bucket, key, body, type);
  return json({ ok: true });
}

/** Delete one object from the caller's own storage folder. */
export async function DELETE(req: Request, { params }: Ctx) {
  if (!sameOrigin(req)) return forbidden();
  const user = await currentUser();
  if (!user) return unauthorized();
  const { bucket, key: parts } = await params;
  const key = keyOf(parts);
  if (!isBucket(bucket) || !validKey(key)) return json({ error: "Not found." }, 404);
  if (!ownsKey(user.id, key)) return forbidden();
  try {
    await deleteObject(bucket, key);
    return json({ ok: true });
  } catch {
    return json({ error: "Couldn’t delete that file." }, 500);
  }
}
