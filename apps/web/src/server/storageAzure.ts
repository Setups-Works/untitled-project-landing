import "server-only";
import { Readable } from "node:stream";
import { BlobServiceClient, type ContainerClient } from "@azure/storage-blob";
import { serverEnv } from "../config/env";

/**
 * Azure Blob Storage backend for server/storage.ts, used when AZURE_STORAGE_CONNECTION_STRING is set. Same contract as the S3
 * path: one container per bucket name, object keys unchanged. Containers are private; files are only ever served through our
 * own /api/v1/storage routes.
 */
const g = globalThis as unknown as { __az?: BlobServiceClient; __azReady?: Promise<void> };

/** The Blob client, or null when Azure isn't configured (the S3 path is used instead). */
export function azure() {
  const conn = serverEnv().azureStorageConnection;
  if (!conn) return null;
  return (g.__az ??= BlobServiceClient.fromConnectionString(conn));
}

async function container(buckets: string[], name: string): Promise<ContainerClient> {
  const svc = azure()!;
  g.__azReady ??= (async () => {
    if (!serverEnv().s3.autoCreateBuckets) return;
    await Promise.all(buckets.map((b) => svc.getContainerClient(b).createIfNotExists()));
  })().catch((e) => {
    g.__azReady = undefined;
    throw e;
  });
  await g.__azReady;
  return svc.getContainerClient(name);
}

export async function azPut(buckets: string[], bucket: string, key: string, body: Uint8Array, contentType: string) {
  const c = await container(buckets, bucket);
  await c.getBlockBlobClient(key).uploadData(body, { blobHTTPHeaders: { blobContentType: contentType, blobCacheControl: "private, max-age=3600" } });
}

export async function azDelete(buckets: string[], bucket: string, key: string) {
  const c = await container(buckets, bucket);
  await c.getBlobClient(key).deleteIfExists();
}

export async function azDeleteMany(buckets: string[], bucket: string, keys: string[]) {
  const c = await container(buckets, bucket);
  await Promise.all(keys.map((k) => c.getBlobClient(k).deleteIfExists()));
}

/** Deletes every blob under a prefix. Returns how many were removed. */
export async function azPurge(buckets: string[], bucket: string, prefix: string) {
  const c = await container(buckets, bucket);
  let removed = 0;
  for await (const b of c.listBlobsFlat({ prefix })) {
    await c.getBlobClient(b.name).deleteIfExists();
    removed++;
  }
  return removed;
}

/** "bytes=0-99", "bytes=500-" and "bytes=-200" → offset and count (count undefined = to the end). */
function parseRange(range: string, size: number) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!m || (!m[1] && !m[2])) return null;
  let start: number;
  let end: number;
  if (!m[1]) {
    start = Math.max(size - Number(m[2]), 0);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  }
  return start <= end && start < size ? { start, end } : null;
}

export async function azGet(buckets: string[], bucket: string, key: string, range?: string) {
  const c = await container(buckets, bucket);
  const blob = c.getBlobClient(key);
  let part: { start: number; end: number } | null = null;
  let size = 0;
  if (range) {
    size = (await blob.getProperties()).contentLength ?? 0;
    part = parseRange(range, size);
  }
  const r = part ? await blob.download(part.start, part.end - part.start + 1) : await blob.download();
  return {
    stream: Readable.toWeb(r.readableStreamBody as Readable) as ReadableStream,
    contentType: r.contentType ?? "application/octet-stream",
    length: r.contentLength,
    contentRange: part ? `bytes ${part.start}-${part.end}/${size}` : undefined,
  };
}
