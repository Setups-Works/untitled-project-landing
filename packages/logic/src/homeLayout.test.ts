import { describe, expect, it } from "vitest";
import { cleanOrder, dropIndex, moveItem } from "./homeLayout";

describe("home layout", () => {
  const known = ["a", "b", "c", "d"];

  it("keeps a valid saved order", () => {
    expect(cleanOrder(["c", "a", "d", "b"], known)).toEqual(["c", "a", "d", "b"]);
  });

  it("drops unknown and repeated ids and appends new cards", () => {
    expect(cleanOrder(["c", "x", "c", "a"], known)).toEqual(["c", "a", "b", "d"]);
  });

  it("falls back to the default for anything that isn't a list", () => {
    expect(cleanOrder(null, known)).toEqual(known);
    expect(cleanOrder("a,b", known)).toEqual(known);
    expect(cleanOrder([1, {}], known)).toEqual(known);
  });

  it("moves an item without changing the original", () => {
    const list = ["a", "b", "c", "d"];
    expect(moveItem(list, 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveItem(list, 3, 0)).toEqual(["d", "a", "b", "c"]);
    expect(list).toEqual(["a", "b", "c", "d"]);
  });

  it("ignores moves that make no sense", () => {
    expect(moveItem(["a", "b"], 1, 1)).toEqual(["a", "b"]);
    expect(moveItem(["a", "b"], 5, 0)).toEqual(["a", "b"]);
    expect(moveItem(["a", "b"], 0, -1)).toEqual(["a", "b"]);
  });

  it("finds the drop position from the pointer", () => {
    expect(dropIndex([50, 150, 250], 10)).toBe(0);
    expect(dropIndex([50, 150, 250], 120)).toBe(1);
    expect(dropIndex([50, 150, 250], 900)).toBe(2);
  });
});
