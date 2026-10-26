/**
 * Home cards can be dragged into the order a person likes. Both the web and the phone app keep that order as a list of card ids
 * on the device; these helpers keep it valid when cards are added or removed in a later release.
 */

/** A saved order cleaned against the cards that exist today: unknown or repeated ids drop out, new cards join at the end. */
export function cleanOrder(saved: unknown, known: readonly string[]): string[] {
  const seen = new Set<string>();
  const kept = (Array.isArray(saved) ? saved : []).filter((id): id is string => {
    if (typeof id !== "string" || !known.includes(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  return [...kept, ...known.filter((id) => !seen.has(id))];
}

/** The list with the item at `from` moved to `to`. Out-of-range positions leave the list as it was. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return [...list];
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

/** Where a dragged card lands: the position of the first card whose midpoint is below the pointer (or the end). */
export function dropIndex(midpoints: readonly number[], pointer: number): number {
  const i = midpoints.findIndex((m) => pointer < m);
  return i === -1 ? midpoints.length - 1 : i;
}
