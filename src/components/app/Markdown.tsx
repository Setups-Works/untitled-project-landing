import type { ReactNode } from "react";

/** Tiny, safe markdown renderer (headings, lists, checklists, quotes, code, bold, links). Never uses innerHTML. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g).map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (/^`[^`]+`$/.test(p)) return <code key={i}>{p.slice(1, -1)}</code>;
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
