import { existsSync, symlinkSync } from "node:fs";
import path from "node:path";

// Turbo needs `pnpm` on PATH; Corepack's pnpm shim can be run without a global symlink.
const executable = process.env.npm_execpath;
const localShim = path.resolve("node_modules/.bin/pnpm");
if (executable && !existsSync(localShim)) {
  try {
    symlinkSync(executable, localShim, "file");
  } catch {
    // A global pnpm install remains usable when the filesystem disallows local symlinks.
  }
}
