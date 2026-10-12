import "server-only";
import Redis from "ioredis";
import { serverEnv } from "../config/env";

const g = globalThis as unknown as { __redis?: Redis; __redisSub?: Redis };

function make() {
  const url = serverEnv().redisUrl;
  if (!url) return null;
  const r = new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: false });
  r.on("error", () => {
    /* Redis is an accelerator (cache, rate limits, realtime fan-out); the app keeps working without it */
  });
  return r;
}

/** Shared Redis connection for commands. Null when REDIS_URL isn't set. */
export function redis(): Redis | null {
  if (!g.__redis) {
    const r = make();
    if (!r) return null;
    g.__redis = r;
  }
  return g.__redis;
}

/** A separate connection for SUBSCRIBE (a subscribed connection can't run other commands). */
export function redisSub(): Redis | null {
  if (!g.__redisSub) {
    const r = make();
    if (!r) return null;
    g.__redisSub = r;
  }
  return g.__redisSub;
}
