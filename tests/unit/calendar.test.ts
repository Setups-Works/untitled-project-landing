import { describe, expect, it } from "vitest";
import { calendarFor } from "../../src/lib/dates";

describe("calendarFor (the date list given to the assistant)", () => {
  const text = calendarFor("2026-10-08");
  it("names today with its weekday", () => expect(text).toContain("Today is Thursday 2026-10-08"));
  it("lists the next three weeks with weekday names", () => {
    expect(text).toContain("Friday 2026-10-09");
    expect(text).toContain("Tuesday 2026-10-13");
    expect(text).toContain("Thursday 2026-10-29");
    expect(text).not.toContain("2026-10-30"); // 21 days only
  });
  it("crosses month and year ends", () => {
    expect(calendarFor("2026-12-30")).toContain("Friday 2027-01-01");
    expect(calendarFor("2028-02-28")).toContain("Tuesday 2028-02-29");
  });
});
