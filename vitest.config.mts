import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Dates are built from local time (see src/lib/dates.ts); pin the zone so tests give the same answers on every machine and in CI.
process.env.TZ = "UTC";

// Database tests need a migrated PostgreSQL (docker compose up + npm run db:migrate), so they run only on request: npm run test:db.
const withDb = Boolean(process.env.RUN_DB_TESTS);
if (withDb && !process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(".env.local"); // same variables the app uses; real environment variables (CI) win
  } catch {
    /* no .env.local: DATABASE_URL must come from the environment */
  }
}

export default defineConfig({
  resolve: {
    alias: {
      // `server-only` throws outside a Next.js server build; tests import server modules directly.
      "server-only": fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", ...(withDb ? ["tests/db/**/*.test.ts"] : [])],
  },
});
