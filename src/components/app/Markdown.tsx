import Link from "next/link";
import type { ReactNode } from "react";

// A link to one of the user's own to-dos, notes or journal days: `[words](/dashboard/todo?task=<id> "To-do · Buy a rose · due 7 Aug 2026")`.
// Only these in-app paths are accepted (never an arbitrary relative URL), and the optional title becomes the hover card.
const ITEM_PATH = "\\/dashboard\\/(?:todo\\?task|notes\\?note|journal\\?d)=[A-Za-z0-9%._-]{1,64}";
const ITEM_LINK = new RegExp(`\\[([^\\]]+)\\]\\((${ITEM_PATH})(?: "([^"]{0,200})")?\\)`);
const ITEM_LINK_SPLIT = `\\[[^\\]]+\\]\\(${ITEM_PATH}(?: "[^"]{0,200}")?\\)`;

/** A link into the app with a small card on hover or keyboard focus that says what it points to. */
function ItemLink({ href, text, tip }: { href: string; text: string; tip?: string }) {
  const [kind, title, ...rest] = (tip ?? "").split(" · ");
  return (
    <span className="group/item relative inline-block">
      <Link
        href={href}
        className="rounded-sm font-medium text-green-fg underline decoration-green-fg/50 decoration-dotted decoration-2 underline-offset-4 transition-colors hover:decoration-solid focus-visible:outline-2 focus-visible:outline-violet-fg"
        aria-label={tip ? `${text} — ${tip}` : undefined}
      >
        {text}
      </Link>
      {tip && (
        <span
          role="tooltip"
          className="pointer-events-none invisible absolute top-full left-0 z-30 mt-2 w-max max-w-[min(280px,70vw)] translate-y-1 rounded-r2 bg-white/95 p-3 text-left text-[13px] leading-snug font-normal text-fg opacity-0 shadow-[0_14px_34px_-14px_rgba(27,28,20,0.45),inset_0_0_0_1px_rgba(27,28,20,0.08)] backdrop-blur-md transition-[opacity,transform] duration-200 group-focus-within/item:visible group-focus-within/item:translate-y-0 group-focus-within/item:opacity-100 group-hover/item:visible group-hover/item:translate-y-0 group-hover/item:opacity-100"
        >
          <span className="block text-[11px] font-semibold tracking-wide text-fg-muted uppercase">{kind}</span>
          {title && <span className="mt-0.5 block font-semibold">{title}</span>}
          {rest.length > 0 && <span className="mt-0.5 block text-fg-muted">{rest.join(" · ")}</span>}
        </span>
      )}
    </span>
  );
}

/** Tiny, safe markdown renderer (headings, lists, checklists, quotes, code, bold, links). Never uses innerHTML. */
function inline(text: string): ReactNode[] {
  return text
    .split(new RegExp(`(\\*\\*[^*]+\\*\\*|\`[^\`]+\`|\\[[^\\]]+\\]\\(https?:\\/\\/[^)\\s]+\\)|${ITEM_LINK_SPLIT})`, "g"))
    .map((p, i) => {
      if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={i}>{p.slice(2, -2)}</strong>;
      if (/^`[^`]+`$/.test(p)) return <code key={i}>{p.slice(1, -1)}</code>;
      const item = ITEM_LINK.exec(p);
      if (item && item.index === 0 && item[0] === p) return <ItemLink key={i} text={item[1]} href={item[2]} tip={item[3]} />;
      const a = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/.exec(p);
      if (a)
        return (
          <a key={i} href={a[2]} target="_blank" rel="noopener noreferrer">
            {a[1]}
          </a>
        );
      return p;
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

function cellAlign(separator: string): "left" | "center" | "right" {
  const left = separator.startsWith(":");
  const right = separator.endsWith(":");
  return left && right ? "center" : right ? "right" : "left";
}

export default function Markdown({ text }: { text: string }) {
  const out: ReactNode[] = [];
  const lines = text.split("\n");
  let list: { done?: boolean; text: string }[] = [];
  let check = false;
  const flush = (k: number) => {
    if (!list.length) return;
    out.push(
      <ul key={`l${k}`} data-check={check}>
        {list.map((it, j) => (
          <li key={j} data-done={it.done}>
            {check && <i aria-hidden>{it.done ? "☑" : "☐"}</i>}
            {inline(it.text)}
          </li>
        ))}
      </ul>,
    );
    list = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    let m: RegExpExecArray | null;
    if (l.startsWith("```")) {
      flush(i);
      const code: string[] = [];
      while (++i < lines.length && !lines[i].startsWith("```")) code.push(lines[i]);
      out.push(
        <pre key={i}>
          <code>{code.join("\n")}</code>
        </pre>,
      );
    } else if (i + 1 < lines.length && l.includes("|") && isTableSeparator(lines[i + 1])) {
      flush(i);
      const headers = tableCells(l);
      const separators = tableCells(lines[++i]);
      const rows: string[][] = [];
      while (i + 1 < lines.length && lines[i + 1].includes("|") && lines[i + 1].trim()) {
        const cells = tableCells(lines[++i]);
        rows.push(headers.map((_, column) => cells[column] ?? ""));
      }
      out.push(
        <div className="md-table-wrap" key={`table${i}`} role="region" aria-label="Table" tabIndex={0}>
          <table>
            <thead>
              <tr>
                {headers.map((header, column) => (
                  <th key={column} scope="col" style={{ textAlign: cellAlign(separators[column] ?? "") }}>
                    {inline(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((value, column) => (
                    <td key={column} style={{ textAlign: cellAlign(separators[column] ?? "") }}>
                      {inline(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
    } else if ((m = /^\s*[-*] \[( |x)\] (.*)$/i.exec(l))) {
      if (!check) flush(i);
      check = true;
      list.push({ done: m[1].toLowerCase() === "x", text: m[2] });
    } else if ((m = /^\s*[-*] (.*)$/.exec(l))) {
      if (check) flush(i);
      check = false;
      list.push({ text: m[1] });
    } else {
      flush(i);
      if ((m = /^(#{1,3}) (.*)$/.exec(l)))
        out.push(
          <p key={i} className={`md-h md-h${m[1].length}`}>
            {inline(m[2])}
          </p>,
        );
      else if ((m = /^> ?(.*)$/.exec(l))) out.push(<blockquote key={i}>{inline(m[1])}</blockquote>);
      else if (/^---+$/.test(l.trim())) out.push(<hr key={i} />);
      else if (l.trim()) out.push(<p key={i}>{inline(l)}</p>);
    }
  }
  flush(lines.length);
  return <div className="md">{out}</div>;
}
