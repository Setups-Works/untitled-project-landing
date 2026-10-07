import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  CreateBucketCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { requireEnv, serverEnv } from "../config/env";

/**
 * Object storage over the S3 API (SeaweedFS in Docker; MinIO, Garage or AWS S3 work by changing the S3_* variables).
 * The browser never talks to the object store: files go through /api/v1/storage/*, which checks the signed-in user first.
 * Every object key starts with the owner's user id — that prefix is the permission rule.
 */
export const BUCKETS = {
  avatars: { public: true, maxBytes: 2 * 1024 * 1024, types: ["image/png", "image/jpeg", "image/webp", "image/gif"] },
  "note-files": { public: false, maxBytes: 10 * 1024 * 1024, types: null },
} as const;
export type BucketName = keyof typeof BUCKETS;
export const isBucket = (b: string): b is BucketName => Object.hasOwn(BUCKETS, b);

const g = globalThis as unknown as { __s3?: S3Client; __buckets?: Promise<void> };

function s3() {
  if (!g.__s3) {
    const e = serverEnv().s3;
    g.__s3 = new S3Client({
      region: "us-east-1",
      endpoint: requireEnv("S3_ENDPOINT", "Run `docker compose up -d` and copy .env.example to .env.local."),
      forcePathStyle: true,
      credentials: { accessKeyId: e.accessKey ?? "", secretAccessKey: e.secretKey ?? "" },
    });
  }
  return g.__s3;
}

/** Creates the buckets once per process; "already exists" is fine. */
function ready() {
  g.__buckets ??= (async () => {
    for (const name of Object.keys(BUCKETS)) {
      try {
        await s3().send(new CreateBucketCommand({ Bucket: name }));
      } catch (e) {
        const n = (e as { name?: string }).name;
        if (n !== "BucketAlreadyOwnedByYou" && n !== "BucketAlreadyExists") {
          g.__buckets = undefined;
          throw e;
        }
      }
    }
  })();
  return g.__buckets;
}

/** Keys are `<user id>/<folder…>/<file>`; no empty, dot or traversal segments. */
const KEY_OK = /^[0-9a-f-]{36}(\/[^/\0\\]{1,200}){1,6}$/i;
export function validKey(key: string) {
  return KEY_OK.test(key) && !key.split("/").some((s) => s === "." || s === "..");
}
export const ownsKey = (userId: string, key: string) => key.startsWith(`${userId}/`);

export async function putObject(bucket: BucketName, key: string, body: Uint8Array, contentType: string) {
  await ready();
  await s3().send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType, CacheControl: "private, max-age=3600" }),
  );
}

export async function getObject(bucket: BucketName, key: string) {
  await ready();
  const r = await s3().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return { stream: r.Body!.transformToWebStream(), contentType: r.ContentType ?? "application/octet-stream", length: r.ContentLength };
}

/** Deletes the given keys (up to 1000). */
export async function deleteObjects(bucket: BucketName, keys: string[]) {
  if (!keys.length) return;
  await ready();
  await s3().send(
    new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: keys.slice(0, 1000).map((Key) => ({ Key })), Quiet: true } }),
  );
}

/** Deletes everything under a prefix (all of one user's files). Returns how many were removed. */
export async function purgePrefix(bucket: BucketName, prefix: string) {
  await ready();
  let removed = 0;
  let token: string | undefined;
  do {
    const r = await s3().send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token, MaxKeys: 1000 }));
    const keys = (r.Contents ?? []).map((o) => o.Key!).filter(Boolean);
    await deleteObjects(bucket, keys);
    removed += keys.length;
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return removed;
}

/* ---- signed, expiring read links (for <img src>, <audio src>, shared chats) ---- */

const secret = () => requireEnv("BETTER_AUTH_SECRET");
const sign = (bucket: string, key: string, exp: number) =>
  createHmac("sha256", secret()).update(`${bucket}\n${key}\n${exp}`).digest("base64url");

const encKey = (key: string) => key.split("/").map(encodeURIComponent).join("/");

/** A same-origin URL that serves the object to anyone holding it until it expires. Public buckets need no signature. */
export function objectUrl(bucket: BucketName, key: string, ttlSeconds = 3600) {
  const base = `/api/v1/storage/o/${bucket}/${encKey(key)}`;
  if (BUCKETS[bucket].public) return base;
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  return `${base}?e=${exp}&s=${sign(bucket, key, exp)}`;
}

export function verifySignature(bucket: string, key: string, exp: string | null, sig: string | null) {
  const e = Number(exp);
  if (!sig || !Number.isFinite(e) || e < Date.now() / 1000) return false;
  const want = Buffer.from(sign(bucket, key, e));
  const got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got);
}
