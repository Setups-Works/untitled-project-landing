import { expect, test } from "@playwright/test";

test.describe("smoke: the app is up and its doors are locked", () => {
  test("the home page renders", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/untitled project/i);
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("the login page shows the form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/log in/i);
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByRole("button", { name: /^log in/i })).toBeVisible();
  });

  test("signed-out visitors are sent to log in from the dashboard and the admin panel", async ({ page }) => {
    for (const path of ["/dashboard", "/dashboard/notes", "/admin"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test("the data and storage APIs refuse requests without a session", async ({ request }) => {
    const db = await request.post("/api/v1/db", {
      data: { table: "tasks", op: "select", filters: [], or: [], order: [] },
    });
    expect(db.status()).toBe(401);
    expect((await request.get("/api/v1/realtime")).status()).toBe(401);
    expect((await request.get("/api/v1/ai/status")).status()).toBe(401);
  });

  test("the server reports it is configured", async ({ request }) => {
    const r = await request.get("/api/v1/auth-config");
    expect(r.ok()).toBe(true);
    expect((await r.json()).configured).toBe(true);
  });
});

test.describe("journey: sign up → note → task → sign out", () => {
  test.skip(
    !process.env.E2E_SIGNUP,
    "set E2E_SIGNUP=1 (and run the app with AUTH_REQUIRE_EMAIL_VERIFICATION=false) to create a throwaway account",
  );

  test("a new person can sign up, add a note and a task, and sign out", async ({ page }) => {
    const stamp = Date.now().toString(36);
    const email = `e2e-${stamp}@example.test`;

    await page.goto("/signup");
    await page.getByPlaceholder("Ada Lovelace").fill("E2E Tester");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("At least 8 characters").fill(`Pw-${stamp}-12345`);
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // First-run walkthrough appears for new accounts; skip it.
    await page.getByRole("button", { name: /skip for now/i }).click();

    // Task on the Home screen.
    const title = `Task ${stamp}`;
    await page.getByLabel("Add a task for today").fill(title);
    await page.getByLabel("Add a task for today").press("Enter");
    await expect(page.getByText(title)).toBeVisible();

    // Note on the Notes screen.
    await page.goto("/dashboard/notes");
    const note = `Note ${stamp}`;
    await page.getByLabel("Write a new note").fill(note);
    await page.getByLabel("Write a new note").press("Enter");
    await expect(page.getByText(note).first()).toBeVisible();

    // The task is also on the To-do page (shared data).
    await page.goto("/dashboard/todo");
    await expect(page.getByText(title)).toBeVisible();

    // Sign out from the account menu.
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/localhost:3000\/?$|\/$/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
