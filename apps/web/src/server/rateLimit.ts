import "server-only";
import { redis } from "./redis";

/**
 * Fixed-window counter: allows `max` calls per `windowSeconds` for one key (e.g. `invite:<userId>`). Without Redis there is no limit,
 * and a Redis hiccup never blocks a person, matching how the AI chat limit behaves.
 */
export async function underLimit(key: string, max: number, windowSeconds: number) {
  const r = redis();
  if (!r) return true;
  try {
    const slot = `rl:${key}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;
    const n = await r.incr(slot);
    if (n === 1) await r.expire(slot, windowSeconds + 30);
    return n <= max;
  } catch {
    return true;
  }
}
