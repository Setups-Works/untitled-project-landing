/**
 * The app's small, safe Markdown dialect (headings, lists, checklists, quotes, code, tables, bold, links) as plain data,
 * so the web (DOM) and mobile (native views) draw exactly the same document. Nothing here produces HTML.
 */

// A link to one of the user's own to-dos, notes or journal days: `[words](/dashboard/todo?task=<id> "To-do · Buy a rose · due 7 Aug 2026")`.
// Only these in-app paths are accepted (never an arbitrary relative URL), and the optional title becomes the hover card.
const ITEM_PATH = "\\/dashboard\\/(?:(?:todo\\?task|notes\\?note|journal\\?d)=[A-Za-z0-9%._-]{1,64}|health(?:\\?d=\\d{4}-\\d{2}-\\d{2})?)";
const ITEM_LINK = new RegExp(`\\[([^\\]]+)\\]\\((${ITEM_PATH})(?: "([^"]{0,200})")?\\)`);
const ITEM_LINK_SPLIT = `\\[[^\\]]+\\]\\(${ITEM_PATH}(?: "[^"]{0,200}")?\\)`;

export type Inline =
  | { type: "text"; text: string }
  | { type: "strong"; text: string }
  | { type: "em"; text: string }
  | { type: "code"; text: string }
  | { type: "item"; text: string; href: string; tip?: string }
  | { type: "link"; text: string; href: string };

export type Align = "left" | "center" | "right";
export type ListItem = { done?: boolean; text: string };
export type Block =
  | { type: "code"; lang: string; source: string }
  | { type: "table"; headers: string[]; aligns: Align[]; rows: string[][] }
  | { type: "list"; check: boolean; items: ListItem[] }
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "quote"; text: string }
  | { type: "hr" }
  | { type: "p"; text: string };

// *Emphasis*: one asterisk each side, hugging the words (so "5 * 3 * 2" is not italic), after bold has had its turn.
const EM = "\\*(?=[^*\\s])[^*\\n]*[^*\\s]\\*|\\*[^*\\s]\\*";

export function parseInline(text: string): Inline[] {
  return text
    .split(new RegExp(`(\\*\\*[^*]+\\*\\*|${EM}|\`[^\`]+\`|\\[[^\\]]+\\]\\(https?:\\/\\/[^)\\s]+\\)|${ITEM_LINK_SPLIT})`, "g"))
    .filter((p) => p !== "")
    .map((p): Inline => {
      if (/^\*\*[^*]+\*\*$/.test(p)) return { type: "strong", text: p.slice(2, -2) };
      if (/^\*[^*]+\*$/.test(p)) return { type: "em", text: p.slice(1, -1) };
      if (/^`[^`]+`$/.test(p)) return { type: "code", text: p.slice(1, -1) };
      const item = ITEM_LINK.exec(p);
      if (item && item.index === 0 && item[0] === p) return { type: "item", text: item[1]!, href: item[2]!, tip: item[3] };
      const a = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/.exec(p);
      if (a) return { type: "link", text: a[1]!, href: a[2]! };
      return { type: "text", text: p };
    });
}

function tableCells(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableSeparator(line: string) {
  const cells = tableCells(line);
  return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function cellAlign(separator: string): Align {
  const left = separator.startsWith(":");
  const right = separator.endsWith(":");
  return left && right ? "center" : right ? "right" : "left";
}

export function parseMarkdown(text: string): Block[] {
  const out: Block[] = [];
  const lines = text.split("\n");
  let list: ListItem[] = [];
  let check = false;
  const flush = () => {
    if (!list.length) return;
    out.push({ type: "list", check, items: list });
    list = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]!;
    let m: RegExpExecArray | null;
    if (l.startsWith("```")) {
      flush();
      const lang = l.slice(3).trim();
      const code: string[] = [];
      while (++i < lines.length && !lines[i]!.startsWith("```")) code.push(lines[i]!);
      out.push({ type: "code", lang, source: code.join("\n") });
    } else if (i + 1 < lines.length && l.includes("|") && isTableSeparator(lines[i + 1]!)) {
      flush();
      const headers = tableCells(l);
      const separators = tableCells(lines[++i]!);
      const rows: string[][] = [];
      while (i + 1 < lines.length && lines[i + 1]!.includes("|") && lines[i + 1]!.trim()) {
        const cells = tableCells(lines[++i]!);
        rows.push(headers.map((_, column) => cells[column] ?? ""));
      }
      out.push({ type: "table", headers, aligns: headers.map((_, c) => cellAlign(separators[c] ?? "")), rows });
    } else if ((m = /^\s*[-*] \[( |x)\] (.*)$/i.exec(l))) {
      if (!check) flush();
      check = true;
      list.push({ done: m[1]!.toLowerCase() === "x", text: m[2]! });
    } else if ((m = /^\s*[-*] (.*)$/.exec(l))) {
      if (check) flush();
      check = false;
      list.push({ text: m[1]! });
    } else {
      flush();
      if ((m = /^(#{1,3}) (.*)$/.exec(l))) out.push({ type: "heading", level: m[1]!.length as 1 | 2 | 3, text: m[2]! });
      else if ((m = /^> ?(.*)$/.exec(l))) out.push({ type: "quote", text: m[1]! });
      else if (/^---+$/.test(l.trim())) out.push({ type: "hr" });
      else if (l.trim()) out.push({ type: "p", text: l });
    }
  }
  flush();
  return out;
}

/**
 * Where an in-app link from the web points on mobile: `/dashboard/todo?task=<id>` → a task, note or journal day, and
 * `/dashboard/health[?d=<day>]` → the Health page (for that day when one is given; `id` is then "" or the day).
 */
export function itemTarget(href: string): { kind: "task" | "note" | "journal" | "health"; id: string } | null {
  const h = /^\/dashboard\/health(?:\?d=(\d{4}-\d{2}-\d{2}))?$/.exec(href);
  if (h) return { kind: "health", id: h[1] ?? "" };
  const m = /^\/dashboard\/(todo\?task|notes\?note|journal\?d)=(.+)$/.exec(href);
  if (!m) return null;
  const id = decodeURIComponent(m[2]!);
  return { kind: m[1] === "todo?task" ? "task" : m[1] === "notes?note" ? "note" : "journal", id };
}

/** Whether `href` is an address the Markdown dialect turns into a tap: a web link (http/https) or one of the app's own pages. */
export function isLinkAddress(href: string): boolean {
  const t = href.trim();
  if (!t || /[\s()]/.test(t)) return false;
  const kind = parseInline(`[x](${t})`)[0]?.type;
  return kind === "link" || kind === "item";
}

/** `[label](href)` for the editor's Add link; brackets in the label are dropped so they can't break the syntax. */
export const linkMarkdown = (label: string, href: string) => `[${label.replace(/[[\]]/g, "").trim() || href.trim()}](${href.trim()})`;

/** Ready-made links to the app's own pages for the editor's Add link, for the given day. They are always valid addresses. */
export const appLinkShortcuts = (today: string) => [
  { label: "Health", href: `/dashboard/health?d=${today}` },
  { label: "Journal", href: `/dashboard/journal?d=${today}` },
];
