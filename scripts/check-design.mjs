#!/usr/bin/env node
/**
 * Design-language and no-hard-coding check. Fails on NEW violations only (lines you added), so existing code never blocks you.
 *
 *   npm run check:design                 your changes vs the merge-base with origin/main (or main) — committed and uncommitted
 *   node scripts/check-design.mjs --staged         only what is staged (the pre-commit hook)
 *   node scripts/check-design.mjs --base origin/main   explicit base (CI)
 *   node scripts/check-design.mjs --hook           Claude Code PostToolUse hook: reads the edited file from stdin, exit 2 = tell the agent
 *   node scripts/check-design.mjs --all            audit the whole tree (informational, always exits 0)
 *
 * Rules and how to fix each: scripts/design/rules.mjs · the language itself: docs/DESIGN_LANGUAGE.md
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { checkLines } from "./design/rules.mjs";

const git = (...args) => {
  try {
    return execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
};
const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const value = (f) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : undefined);
const norm = (p) => p.replace(/\\/g, "/").replace(/^\.\//, "");

/** Parse `git diff -U0` into { file → [{n, text}] } of added lines. */
function addedFromDiff(diff) {
  const files = new Map();
  let file = null;
  let n = 0;
  for (const raw of diff.split("\n")) {
    if (raw.startsWith("+++ ")) {
      file = raw === "+++ /dev/null" ? null : norm(raw.slice(6));
      continue;
    }
    const h = raw.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (h) {
      n = Number(h[1]);
      continue;
    }
    if (file && raw.startsWith("+") && !raw.startsWith("+++")) {
      if (!files.has(file)) files.set(file, []);
      files.get(file).push({ n: n++, text: raw.slice(1) });
    }
  }
  return files;
}

const wholeFile = (path) => {
  const lines = readFileSync(path, "utf8").split("\n");
  return { all: lines, added: lines.map((text, i) => ({ n: i + 1, text })) };
};
const untracked = () => git("ls-files", "--others", "--exclude-standard").split("\n").filter(Boolean).map(norm);

function collect() {
  /** @type {Map<string, {n:number,text:string}[]>} */
  let added = new Map();
  if (flag("--all")) {
    for (const f of git("ls-files").split("\n").filter(Boolean)) if (existsSync(f)) added.set(norm(f), wholeFile(f).added);
    return added;
  }
  if (flag("--hook")) {
    let path = "";
    try {
      path = JSON.parse(readFileSync(0, "utf8"))?.tool_input?.file_path ?? "";
    } catch {
      return added;
    }
    const root = git("rev-parse", "--show-toplevel").trim();
    const rel = norm(path.startsWith(root) ? path.slice(root.length + 1) : path);
    if (!rel || !existsSync(rel)) return added;
    const tracked = git("ls-files", "--error-unmatch", rel).trim();
    if (!tracked) added.set(rel, wholeFile(rel).added);
    else added = addedFromDiff(git("diff", "-U0", "--no-color", "HEAD", "--", rel));
    return added;
  }
  if (flag("--staged")) return addedFromDiff(git("diff", "--cached", "-U0", "--no-color", "--diff-filter=AM"));
  const base = value("--base") ?? (git("rev-parse", "--verify", "-q", "origin/main").trim() ? "origin/main" : "main");
  const mergeBase = git("merge-base", "HEAD", base).trim() || base;
  added = addedFromDiff(git("diff", "-U0", "--no-color", "--diff-filter=AM", mergeBase));
  for (const f of untracked()) if (existsSync(f)) added.set(f, wholeFile(f).added);
  return added;
}

const added = collect();
const found = [];
for (const [file, lines] of added) {
  if (!existsSync(file)) continue;
  const all = readFileSync(file, "utf8").split("\n");
  found.push(...checkLines(file, lines, all));
}

if (!found.length) {
  if (!flag("--hook")) console.log("check:design — no new design or hard-coding problems.");
  process.exit(0);
}

const byRule = new Map();
for (const v of found) byRule.set(v.id, [...(byRule.get(v.id) ?? []), v]);
const out = [];
out.push(
  `check:design — ${found.length} problem${found.length === 1 ? "" : "s"} in the lines you added${flag("--all") ? " (whole-tree audit)" : ""}:\n`,
);
for (const [id, list] of byRule) {
  out.push(`● ${id} — ${list[0].message}`);
  for (const v of list.slice(0, flag("--all") ? 5 : 20)) out.push(`    ${v.file}:${v.line}  ${v.text}`);
  if (flag("--all") && list.length > 5) out.push(`    … and ${list.length - 5} more`);
  out.push("");
}
out.push("Read docs/DESIGN_LANGUAGE.md. A real exception: add a `design-ok: <reason>` comment on that line (reviewers will read it).");
const text = out.join("\n");
if (flag("--all")) {
  console.log(text);
  process.exit(0);
}
console.error(text);
process.exit(flag("--hook") ? 2 : 1);
