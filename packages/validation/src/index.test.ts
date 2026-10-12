import { describe, expect, it } from "vitest";
import { forgotPasswordSchema, friendlyAuthError, loginSchema, passwordStrength, resetPasswordSchema, signupSchema } from "./index";

describe("auth validation", () => {
  it("accepts an email or a username to sign in", () => {
    expect(loginSchema.safeParse({ identifier: "ada@example.com", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ identifier: "ada_l", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ identifier: "a b", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ identifier: "ada@example.com", password: "" }).success).toBe(false);
  });

  it("requires name, username, email and an 8+ character password to sign up", () => {
    const ok = { name: "Ada", username: "ada.l", email: "ada@example.com", password: "longenough" };
    expect(signupSchema.safeParse(ok).success).toBe(true);
    expect(signupSchema.safeParse({ ...ok, password: "short" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...ok, username: "a!" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...ok, name: "  " }).success).toBe(false);
  });

  it("checks the email for forgot password", () => {
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({ email: " ada@example.com " }).success).toBe(true);
  });

  it("needs a 6-digit code and matching passwords to reset", () => {
    const ok = { email: "ada@example.com", otp: "123456", password: "longenough", confirmPassword: "longenough" };
    expect(resetPasswordSchema.safeParse(ok).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ ...ok, otp: "12345" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ ...ok, confirmPassword: "different1" }).success).toBe(false);
  });

  it("scores passwords and softens server messages", () => {
    expect(passwordStrength("abc")).toBe(0);
    expect(passwordStrength("Abcdef12!")).toBe(4);
    expect(friendlyAuthError("Invalid email or password")).toBe("That email and password don’t match.");
    expect(friendlyAuthError("something else")).toBe("something else");
  });
});

import { parseChatActions } from "./chatActions";

describe("chat drafts", () => {
  const draft = '<create-item>{"kind":"task","title":"Buy milk","description":"","due_date":"2026-10-13"}</create-item>';

  it("pulls valid drafts out of the text and hides the markup", () => {
    const r = parseChatActions(`Sure, here you go.\n${draft}`);
    expect(r.body).toBe("Sure, here you go.");
    expect(r.proposals).toHaveLength(1);
    expect(r.proposals[0]?.action.kind).toBe("task");
    expect(r.proposals[0]?.created).toBeNull();
  });

  it("ignores invalid drafts and never leaks a half-written block", () => {
    expect(parseChatActions('<create-item>{"kind":"task"}</create-item>ok').proposals).toHaveLength(0);
    expect(parseChatActions('Working on it <create-item>{"kind":').body).toBe("Working on it");
  });

  it("reads confirmed drafts as created", () => {
    const done = `<created-item>${JSON.stringify({ kind: "task", path: "/dashboard/todo?task=1", action: { kind: "task", title: "Buy milk", description: "", due_date: null } })}</created-item>`;
    expect(parseChatActions(done).proposals[0]?.created?.path).toBe("/dashboard/todo?task=1");
  });
});
