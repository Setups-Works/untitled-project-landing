import Link from "next/link";
import type { ReactNode } from "react";
import { parseInline, parseMarkdown, type Inline } from "@untitled/logic/markdown";
import HtmlPreview, { looksLikeHtml } from "../ui/HtmlPreview";

/** A link into the app with a small card on hover or keyboard focus that says what it points to. */
function ItemLink({ href, text, tip }: { href: string; text: string; tip?: string }) {
  const [kind, title, ...rest] = (tip ?? "").split(" · ");
  return (
    <span className="group/item relative inline-block">
      <Link
        href={href}
        className="rounded-r1 font-medium text-green-fg underline decoration-green-fg/50 decoration-dotted decoration-2 underline-offset-4 transition-colors hover:decoration-solid focus-visible:outline-2 focus-visible:outline-violet-fg"
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

/** Tiny, safe markdown renderer (headings, lists, checklists, quotes, code, bold, links). Never uses innerHTML. Parsing is shared with the mobile app. */
function inline(text: string): ReactNode[] {
  return parseInline(text).map((p: Inline, i) => {
    if (p.type === "strong") return <strong key={i}>{p.text}</strong>;
    if (p.type === "code") return <code key={i}>{p.text}</code>;
    if (p.type === "item") return <ItemLink key={i} text={p.text} href={p.href} tip={p.tip} />;
    if (p.type === "link")
      return (
        <a key={i} href={p.href} target="_blank" rel="noopener noreferrer">
          {p.text}
        </a>
      );
    return p.text;
  });
}

export default function Markdown({ text }: { text: string }) {
  const out: ReactNode[] = parseMarkdown(text).map((b, i) => {
    switch (b.type) {
      case "code":
        // A web page in a code block can be switched between its code and a live preview.
        return looksLikeHtml(b.lang, b.source) ? (
          <HtmlPreview key={i} code={b.source} />
        ) : (
          <pre key={i}>
            <code>{b.source}</code>
          </pre>
        );
      case "table":
        return (
          <div className="md-table-wrap" key={`table${i}`} role="region" aria-label="Table" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  {b.headers.map((header, column) => (
                    <th key={column} scope="col" style={{ textAlign: b.aligns[column] }}>
                      {inline(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((value, column) => (
                      <td key={column} style={{ textAlign: b.aligns[column] }}>
                        {inline(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "list":
        return (
          <ul key={`l${i}`} data-check={b.check}>
            {b.items.map((it, j) => (
              <li key={j} data-done={it.done}>
                {b.check && <i aria-hidden>{it.done ? "☑" : "☐"}</i>}
                {inline(it.text)}
              </li>
            ))}
          </ul>
        );
      case "heading":
        return (
          <p key={i} className={`md-h md-h${b.level}`}>
            {inline(b.text)}
          </p>
        );
      case "quote":
        return <blockquote key={i}>{inline(b.text)}</blockquote>;
      case "hr":
        return <hr key={i} />;
      default:
        return <p key={i}>{inline(b.text)}</p>;
    }
  });
  return <div className="md">{out}</div>;
}
