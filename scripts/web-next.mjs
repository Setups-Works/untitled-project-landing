import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootLocalEnv = path.join(repoRoot, ".env.local");
if (existsSync(rootLocalEnv)) process.loadEnvFile(rootLocalEnv);

const nextCli = path.join(repoRoot, "apps/web/node_modules/next/dist/bin/next");
const result = spawnSync(process.execPath, [nextCli, ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
