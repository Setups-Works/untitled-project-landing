import { describe, expect, it } from "vitest";
import { asleepMinutes, sleepWindow } from "./sleep";

const at = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min).getTime();

describe("sleep", () => {
  it("windows run 18:00 to 18:00 and touch without overlapping", () => {
    const a = sleepWindow("2026-10-16");
    const b = sleepWindow("2026-10-17");
    expect(a.end).toBe(b.start);
    expect(b.start).toBe(at(2026, 10, 16, 18));
    expect(b.end).toBe(at(2026, 10, 17, 18));
  });

  it("counts a night that crosses midnight once, for the morning it ends", () => {
    const night = [{ start: at(2026, 10, 16, 23), end: at(2026, 10, 17, 7) }];
    expect(asleepMinutes(night, sleepWindow("2026-10-17"))).toBe(8 * 60);
    expect(asleepMinutes(night, sleepWindow("2026-10-16"))).toBe(0);
  });

  it("does not add a watch and a phone that recorded the same night", () => {
    const both = [
      { start: at(2026, 10, 16, 23), end: at(2026, 10, 17, 6) },
      { start: at(2026, 10, 16, 23, 30), end: at(2026, 10, 17, 7) },
    ];
    expect(asleepMinutes(both, sleepWindow("2026-10-17"))).toBe(8 * 60);
  });

  it("counts an afternoon nap for its own day and ignores empty intervals", () => {
    const nap = [{ start: at(2026, 10, 17, 14), end: at(2026, 10, 17, 14, 45) }, { start: 5, end: 5 }];
    expect(asleepMinutes(nap, sleepWindow("2026-10-17"))).toBe(45);
    expect(asleepMinutes([], sleepWindow("2026-10-17"))).toBe(0);
  });
});
