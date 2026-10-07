#!/usr/bin/env node
/**
 * Jira helper for developers and their AI agents (no dependencies, Node 20+).
 *
 *   node scripts/jira/jira.mjs whoami
 *   node scripts/jira/jira.mjs list [--track ai|platform|workspace] [--phase 3] [--status "To Do"] [--mine]
 *   node scripts/jira/jira.mjs get UNT-61
 *   node scripts/jira/jira.mjs start UNT-61            assign to me + In Progress
 *   node scripts/jira/jira.mjs review UNT-61 <pr-url>  In Review + comment with the PR link
 *   node scripts/jira/jira.mjs done UNT-61             Done (humans do this after merge)
 *   node scripts/jira/jira.mjs comment UNT-61 "text"
 *   node scripts/jira/jira.mjs create --epic UNT-42 --track workspace --size m --title "…" [--body "text"]
 *
 * Credentials come from the environment or .env.local (git-ignored) — NEVER from the command line or a chat:
 *   JIRA_EMAIL=you@example.com
 *   JIRA_API_TOKEN=…   (https://id.atlassian.com/manage-profile/security/api-tokens — your own token)
 *   JIRA_BASE_URL=https://setups-works.atlassian.net   (optional, this is the default)
 */
import { readFileSync, existsSync } from "node:fs";

// ---- config (reads .env.local without printing anything)
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const BASE = (process.env.JIRA_BASE_URL || "https://setups-works.atlassian.net").replace(/\/+$/, "");
const EMAIL = process.env.JIRA_EMAIL;
const TOKEN = process.env.JIRA_API_TOKEN;
const PROJECT = process.env.JIRA_PROJECT || "UNT";

const die = (msg) => {
  console.error(`jira: ${msg}`);
  process.exit(1);
};
if (!EMAIL || !TOKEN)
  die(
    "set JIRA_EMAIL and JIRA_API_TOKEN in .env.local (see .env.example). Create a token at https://id.atlassian.com/manage-profile/security/api-tokens",
  );

const auth = "Basic " + Buffer.from(`${EMAIL}:${TOKEN}`).toString("base64");

async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { Authorization: auth, Accept: "application/json", "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      })()
    : {};
  if (res.status === 401) die("Jira rejected your email/token (401). Check JIRA_EMAIL and create a fresh token.");
  if (res.status === 403) die("Your Jira account isn't allowed to do that (403).");
  if (!res.ok)
    die(
      `${method} ${path} failed (${res.status}): ${typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data.errorMessages ?? data.errors ?? data).slice(0, 300)}`,
    );
  return data;
}

// ---- Atlassian Document Format <-> text
const text = (t) => ({ type: "text", text: t });
function toAdf(md) {
  const nodes = [];
  let list = null;
  for (const raw of String(md).split("\n")) {
    const line = raw.trimEnd();
    if (/^[-*] /.test(line)) {
      list ??= { type: "bulletList", content: [] };
      list.content.push({ type: "listItem", content: [{ type: "paragraph", content: [text(line.slice(2))] }] });
      continue;
    }
    if (list) {
      nodes.push(list);
      list = null;
    }
    if (!line.trim()) continue;
    const h = /^(#{1,4}) (.*)$/.exec(line);
    nodes.push(
      h
        ? { type: "heading", attrs: { level: Math.min(h[1].length + 1, 4) }, content: [text(h[2])] }
        : { type: "paragraph", content: [text(line)] },
    );
  }
  if (list) nodes.push(list);
  return { type: "doc", version: 1, content: nodes.length ? nodes : [{ type: "paragraph", content: [] }] };
}
function fromAdf(n, depth = 0) {
  if (!n) return "";
  if (typeof n === "string") return n;
  const kids = (n.content ?? []).map((c) => fromAdf(c, depth + 1));
  switch (n.type) {
    case "text":
      return n.marks?.some((m) => m.type === "code") ? "`" + n.text + "`" : n.text;
    case "heading":
      return `\n${"#".repeat(n.attrs?.level ?? 3)} ${kids.join("")}\n`;
    case "paragraph":
      return kids.join("") + "\n";
    case "bulletList":
      return kids.join("");
    case "orderedList":
      return kids.map((k, i) => `${i + 1}. ${k.replace(/^- /, "")}`).join("");
    case "listItem":
      return "- " + kids.join("").trim() + "\n";
    case "hardBreak":
      return "\n";
    default:
      return kids.join("");
  }
}

// ---- helpers
const flag = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? (process.argv[i + 1]?.startsWith("--") ? true : (process.argv[i + 1] ?? true)) : undefined;
};
const keyArg = () => {
  const k = process.argv[3];
  if (!/^[A-Z]+-\d+$/.test(k ?? "")) die("expected an issue key like UNT-61");
  return k;
};

async function transition(key, name) {
  const { transitions } = await api("GET", `/rest/api/3/issue/${key}/transitions`);
  const t = transitions.find((x) => x.name.toLowerCase() === name.toLowerCase());
  if (!t) die(`${key} can't move to "${name}" from its current status. Available: ${transitions.map((x) => x.name).join(", ")}`);
  await api("POST", `/rest/api/3/issue/${key}/transitions`, { transition: { id: t.id } });
}
const comment = (key, body) => api("POST", `/rest/api/3/issue/${key}/comment`, { body: toAdf(body) });

const row = (i) =>
  `${i.key.padEnd(8)} ${(i.fields.status?.name ?? "").padEnd(12)} ${(i.fields.labels ?? [])
    .filter((l) => /^(track|size|phase)-/.test(l))
    .join(",")
    .padEnd(34)} ${i.fields.summary}`;

// ---- commands
const cmd = process.argv[2];
switch (cmd) {
  case "whoami": {
    const me = await api("GET", "/rest/api/3/myself");
    console.log(`${me.displayName} <${me.emailAddress ?? EMAIL}> — ${BASE}`);
    break;
  }
  case "list": {
    const jql = [`project = ${PROJECT}`, "issuetype != Epic"];
    const track = flag("track"),
      phase = flag("phase"),
      status = flag("status");
    if (track) jql.push(`labels = "track-${track}"`);
    if (phase) jql.push(`labels = "phase-${phase}"`);
    jql.push(status ? `status = "${status}"` : "statusCategory != Done");
    if (flag("mine")) jql.push("assignee = currentUser()");
    const r = await api("POST", "/rest/api/3/search/jql", {
      jql: jql.join(" AND ") + " ORDER BY key ASC",
      fields: ["summary", "status", "labels"],
      maxResults: 100,
    });
    r.issues.forEach((i) => console.log(row(i)));
    console.log(`\n${r.issues.length} task(s)`);
    break;
  }
  case "get": {
    const k = keyArg();
    const i = await api("GET", `/rest/api/3/issue/${k}?fields=summary,status,labels,parent,description,issuelinks,assignee`);
    const f = i.fields;
    console.log(
      `${i.key} — ${f.summary}\nStatus: ${f.status.name}   Assignee: ${f.assignee?.displayName ?? "unassigned"}   Epic: ${f.parent?.key ?? "—"}\nLabels: ${(f.labels ?? []).join(", ")}\n${BASE}/browse/${i.key}`,
    );
    const blockers = (f.issuelinks ?? [])
      .filter((l) => l.type.name === "Blocks" && l.inwardIssue)
      .map((l) => `${l.inwardIssue.key} (${l.inwardIssue.fields.status.name}) ${l.inwardIssue.fields.summary}`);
    if (blockers.length) console.log(`Blocked by: ${blockers.join("; ")}`);
    console.log("\n" + fromAdf(f.description).trim());
    break;
  }
  case "start": {
    const k = keyArg();
    const me = await api("GET", "/rest/api/3/myself");
    await api("PUT", `/rest/api/3/issue/${k}/assignee`, { accountId: me.accountId });
    await transition(k, "In Progress");
    console.log(`${k} assigned to ${me.displayName} and moved to In Progress`);
    break;
  }
  case "review": {
    const k = keyArg(),
      pr = process.argv[4];
    if (!pr?.startsWith("http")) die("usage: review UNT-61 <pull-request-url>");
    await transition(k, "In Review");
    await comment(k, `Pull request ready for review: ${pr}`);
    console.log(`${k} moved to In Review`);
    break;
  }
  case "done": {
    const k = keyArg();
    await transition(k, "Done");
    console.log(`${k} moved to Done`);
    break;
  }
  case "comment": {
    const k = keyArg(),
      body = process.argv.slice(4).join(" ");
    if (!body) die('usage: comment UNT-61 "text"');
    await comment(k, body);
    console.log(`commented on ${k}`);
    break;
  }
  case "create": {
    const title = flag("title");
    if (!title || title === true) die('usage: create --epic UNT-42 --track workspace --size m --title "…" [--body "…"]');
    const labels = [
      flag("track") && `track-${flag("track")}`,
      flag("size") && `size-${flag("size")}`,
      flag("phase") && `phase-${flag("phase")}`,
    ].filter(Boolean);
    const r = await api("POST", "/rest/api/3/issue", {
      fields: {
        project: { key: PROJECT },
        issuetype: { name: "Story" },
        summary: title,
        labels,
        ...(flag("epic") ? { parent: { key: flag("epic") } } : {}),
        description: toAdf(typeof flag("body") === "string" ? flag("body") : title),
      },
    });
    console.log(`created ${r.key} — ${BASE}/browse/${r.key}`);
    break;
  }
  default:
    console.log(
      readFileSync(new URL(import.meta.url), "utf8")
        .split("*/")[0]
        .replace(/^#!.*\n\/\*\*?/, "")
        .replace(/^ \* ?/gm, "")
        .trim(),
    );
}
