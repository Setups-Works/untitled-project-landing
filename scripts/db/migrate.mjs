// Applies db/migrations/*.sql in order, once each, and records them in public.schema_migrations.
//   npm run db:migrate
// DATABASE_URL comes from the environment, or from .env.local / .env.selfhost when run on your machine.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function loadEnvFile(name) {
  const file = join(root, name);
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnvFile(".env.local");

if (!process.env.DATABASE_URL) {
  loadEnvFile(".env.selfhost");
  const { POSTGRES_USER = "app", POSTGRES_PASSWORD, POSTGRES_DB = "untitled" } = process.env;
  if (POSTGRES_PASSWORD) process.env.DATABASE_URL = `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:5432/${POSTGRES_DB}`;
}
if (!process.env.DATABASE_URL) {
  console.error("migrate: set DATABASE_URL (see .env.example), or create .env.selfhost from .env.selfhost.example.");
  process.exit(1);
}

const dir = join(root, "db", "migrations");
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query(
    "create table if not exists public.schema_migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const done = new Set((await client.query("select name from public.schema_migrations")).rows.map((r) => r.name));
  let n = 0;
  for (const f of files) {
    if (done.has(f)) continue;
    process.stdout.write(`applying ${f} … `);
    await client.query("begin");
    try {
      await client.query(readFileSync(join(dir, f), "utf8"));
      await client.query("insert into public.schema_migrations (name) values ($1)", [f]);
      await client.query("commit");
      console.log("ok");
      n++;
    } catch (e) {
      await client.query("rollback");
      console.log("FAILED");
      throw e;
    }
  }
  console.log(n ? `${n} migration(s) applied.` : "Database is up to date.");
} finally {
  await client.end();
}
