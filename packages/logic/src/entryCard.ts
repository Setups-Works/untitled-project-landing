import { parseInline, parseMarkdown, type Block } from "./markdown";

/**
 * The picture card of a journal entry ("share as image"), described once for the web (drawn on a canvas) and the app (drawn with native
 * views): the same numbers, the same plain text, the same wrapping rule. Nothing here touches a DOM or a native view.
 */
export const ENTRY_CARD = {
  /** Card width in pixels; the height follows the text. 1080 is what social apps expect. */
  width: 1080,
  padding: 88,
  dateSize: 34,
  timeSize: 76,
  bodySize: 44,
  /** Line height as a multiple of the text size. */
  lineHeight: 1.45,
  /** Longest text the card shows; the rest becomes an ellipsis so the picture stays a sensible size. */
  maxLines: 22,
  brand: "untitled project",
  brandSize: 30,
} as const;

const inlineText = (text: string) =>
  parseInline(text)
    .map((p) => p.text)
    .join("");

function blockText(b: Block): string {
  switch (b.type) {
    case "heading":
    case "quote":
    case "p":
      return inlineText(b.text);
    case "list":
      return b.items.map((i) => `${b.check ? (i.done ? "☑" : "☐") : "•"} ${inlineText(i.text)}`).join("\n");
    case "code":
      return b.source;
    case "table":
      return [b.headers, ...b.rows].map((r) => r.map(inlineText).join(" · ")).join("\n");
    case "hr":
      return "";
  }
}

/** An entry's Markdown as plain text with its line breaks kept: no asterisks, hashes or link syntax on the picture. */
export function plainEntryText(markdown: string): string {
  let blocks: Block[];
  try {
    blocks = parseMarkdown(markdown);
  } catch {
    return markdown.trim();
  }
  return blocks
    .map(blockText)
    .filter((t) => t !== "")
    .join("\n\n")
    .trim();
}

/**
 * Breaks text into lines no wider than `maxWidth`, measuring with the caller's own function (a canvas, or an estimate). Paragraph
 * breaks stay; a word longer than a line is split. When there are more than `maxLines`, the last line ends with an ellipsis.
 */
export function wrapLines(
  text: string,
  maxWidth: number,
  measure: (s: string) => number,
  maxLines: number = ENTRY_CARD.maxLines,
): string[] {
  const out: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (!paragraph.trim()) {
      out.push("");
      continue;
    }
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (measure(next) <= maxWidth) {
        line = next;
        continue;
      }
      if (line) out.push(line);
      line = "";
      let rest = word;
      while (measure(rest) > maxWidth && rest.length > 1) {
        let cut = rest.length - 1;
        while (cut > 1 && measure(rest.slice(0, cut)) > maxWidth) cut--;
        out.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      line = rest;
    }
    if (line) out.push(line);
  }
  while (out.length && out[out.length - 1] === "") out.pop();
  if (out.length <= maxLines) return out;
  const kept = out.slice(0, maxLines);
  kept[maxLines - 1] = `${kept[maxLines - 1]!.replace(/[\s.,;:!?-]+$/, "")}…`;
  return kept;
}
