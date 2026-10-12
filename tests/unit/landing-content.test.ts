import { describe, expect, it } from "vitest";
import { ALL_INTEGRATIONS, CAPABILITIES, FAQS, GROUPS, ROADMAP, SHORTCUTS, TRUST } from "../../src/components/landing/content";
import { isTone, toneClass } from "../../src/lib/tones";
import { isLive } from "../../src/lib/logos";

// These mirror docs/CURRENT_STATE.md. If a feature ships, update the doc and this list together.
const NOT_BUILT = ["Email", "Meetings", "Automations"];
const BUILT = ["Notes", "Tasks", "Journal", "Calendar", "Chat with AI", "Universal search"];

describe("landing content stays honest", () => {
  it("only marks shipped capabilities as live", () => {
    for (const name of NOT_BUILT) expect(CAPABILITIES.find((c) => c.t === name)?.status).not.toBe("live");
    for (const name of BUILT) expect(CAPABILITIES.find((c) => c.t === name)?.status).toBe("live");
  });

  it("uses only valid tones, so a class name can never be injected", () => {
    for (const c of CAPABILITIES) expect(isTone(c.tone)).toBe(true);
    for (const t of TRUST) expect(isTone(t.tone)).toBe(true);
    expect(toneClass("blue")).toBe("at-blue");
    expect(toneClass("not-a-tone")).toBe("");
    expect(toneClass(undefined)).toBe("");
  });

  it("starts the roadmap with what is live and ends with what is not", () => {
    expect(ROADMAP[0].status).toBe("live");
    expect(ROADMAP.at(-1)?.status).toBe("soon");
    expect(ROADMAP.filter((m) => m.status === "live").length).toBeGreaterThan(0);
  });

  it("has complete copy (no empty titles, answers or tips)", () => {
    for (const [q, a] of FAQS) expect(q.length > 5 && a.length > 20).toBe(true);
    for (const t of TRUST) expect(t.tip.length).toBeGreaterThan(20);
    for (const s of SHORTCUTS) expect(s.keys.length).toBeGreaterThan(0);
  });

  it("lists every integration once and marks the live ones from lib/logos", () => {
    expect(new Set(ALL_INTEGRATIONS).size).toBe(ALL_INTEGRATIONS.length);
    expect(GROUPS.length).toBe(5);
    expect(ALL_INTEGRATIONS.filter(isLive).length).toBeGreaterThan(0);
  });
});
