import pg from "pg";

/**
 * Test data is cleaned up after each run (UNT-33 acceptance criterion): the journey test signs up as e2e-<stamp>@example.test,
 * and deleting that user cascades to everything they created (notes, tasks, sessions, profile).
 * Needs DATABASE_URL (same variable the app uses); without it the throwaway accounts are left for you to delete.
 */
export default async function globalTeardown() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("e2e cleanup skipped: DATABASE_URL is not set (delete users matching e2e-%@example.test yourself).");
    return;
  }
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    const r = await client.query("delete from auth.users where email like 'e2e-%@example.test'");
    if (r.rowCount) console.log(`e2e cleanup: removed ${r.rowCount} throwaway account(s).`);
  } finally {
    await client.end();
  }
}
