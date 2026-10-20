/** Toolbar edits for the journal editor. They only produce syntax the app's Markdown dialect draws (see packages/logic/src/markdown.ts). */
export type Selection = { start: number; end: number };
export type Edit = { text: string; selection: Selection };

/** Wraps the selected words in `mark` (or toggles it off when already wrapped); with nothing selected it leaves the caret between the marks. */
export function wrapSelection(text: string, sel: Selection, mark: string): Edit {
  const { start, end } = sel;
  const before = text.slice(0, start);
  const chosen = text.slice(start, end);
  const after = text.slice(end);
  if (before.endsWith(mark) && after.startsWith(mark))
    return { text: before.slice(0, -mark.length) + chosen + after.slice(mark.length), selection: { start: start - mark.length, end: end - mark.length } };
  return { text: before + mark + chosen + mark + after, selection: { start: start + mark.length, end: end + mark.length } };
}

/** Adds `prefix` to every line the selection touches, or removes it when they all have it already. */
export function prefixLines(text: string, sel: Selection, prefix: string): Edit {
  const from = text.lastIndexOf("\n", sel.start - 1) + 1;
  const nl = text.indexOf("\n", sel.end);
  const to = nl === -1 ? text.length : nl;
  const lines = text.slice(from, to).split("\n");
  const all = lines.every((line) => line.startsWith(prefix));
  const next = lines.map((line) => (all ? line.slice(prefix.length) : prefix + line)).join("\n");
  const delta = next.length - (to - from);
  return { text: text.slice(0, from) + next + text.slice(to), selection: { start: Math.max(from, sel.start + (all ? -prefix.length : prefix.length)), end: sel.end + delta } };
}
