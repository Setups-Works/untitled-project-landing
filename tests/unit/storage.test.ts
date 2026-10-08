import { beforeAll, describe, expect, it, vi } from "vitest";

const UID = "d9a62f1f-77c3-4c16-a53d-c44bd22a5d1c";
const OTHER = "bfa39a69-3a68-42e4-b06d-cf8ef90e0cdc";

// Loaded after the secret is set: signing reads BETTER_AUTH_SECRET.
let storage: typeof import("../../src/server/storage");
beforeAll(async () => {
  vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-test-secret-test-secret-1234");
  storage = await import("../../src/server/storage");
});

describe("object keys (the permission rule is the user-id prefix)", () => {
  it("accepts keys under a user id", () => {
    expect(storage.validKey(`${UID}/journal/entry/photo.jpg`)).toBe(true);
    expect(storage.validKey(`${UID}/avatar-123.png`)).toBe(true);
  });
  it.each([
    "",
    "photo.jpg",
    `${UID}`,
    `${UID}/`,
    `${UID}/../${OTHER}/x`,
    `${UID}/./x`,
    `${UID}//x`,
    `not-a-uuid/x`,
    `${UID}/a\\b`,
    `${UID}/a\0b`,
    `${UID}/${"x".repeat(201)}`,
  ])("rejects %j", (k) => expect(storage.validKey(k)).toBe(false));

  it("ownsKey only matches the caller's own folder", () => {
    expect(storage.ownsKey(UID, `${UID}/a/b`)).toBe(true);
    expect(storage.ownsKey(UID, `${OTHER}/a/b`)).toBe(false);
    expect(storage.ownsKey(UID, `${UID}x/a`)).toBe(false);
  });
});

describe("signed links", () => {
  const sigOf = (url: string) => new URL(url, "http://x");
  it("public buckets need no signature; private ones carry an expiry and signature", () => {
    expect(storage.objectUrl("avatars", `${UID}/a.png`)).not.toContain("?");
    const u = sigOf(storage.objectUrl("note-files", `${UID}/a b/c.png`));
    expect(u.searchParams.get("e")).toBeTruthy();
    expect(u.searchParams.get("s")).toBeTruthy();
    expect(u.pathname).toContain("a%20b");
  });
  it("verifies its own links and rejects tampering and expiry", () => {
    const key = `${UID}/a/b.png`;
    const u = sigOf(storage.objectUrl("note-files", key, 600));
    const e = u.searchParams.get("e");
    const s = u.searchParams.get("s");
    expect(storage.verifySignature("note-files", key, e, s)).toBe(true);
    expect(storage.verifySignature("note-files", `${OTHER}/a/b.png`, e, s)).toBe(false); // other file
    expect(storage.verifySignature("avatars", key, e, s)).toBe(false); // other bucket
    expect(storage.verifySignature("note-files", key, String(Number(e) + 1), s)).toBe(false); // changed expiry
    expect(storage.verifySignature("note-files", key, e, `${s}x`)).toBe(false);
    expect(storage.verifySignature("note-files", key, null, null)).toBe(false);
    const past = Math.floor(Date.now() / 1000) - 10;
    expect(storage.verifySignature("note-files", key, String(past), s)).toBe(false);
  });
});

describe("buckets", () => {
  it("knows only its own buckets", () => {
    expect(storage.isBucket("avatars")).toBe(true);
    expect(storage.isBucket("note-files")).toBe(true);
    expect(storage.isBucket("../etc")).toBe(false);
    expect(storage.isBucket("toString")).toBe(false);
  });
});
