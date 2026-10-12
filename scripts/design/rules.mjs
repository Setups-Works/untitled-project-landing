/**
 * The rules behind `npm run check:design`. Pure functions (no git, no fs) so they can be unit-tested.
 * Each rule says what is wrong AND what to use instead — the message is read by AI agents, so it has to be actionable.
 * Escape hatch for a genuine exception: put `design-ok: <reason>` in a comment on the same line or the line above.
 */

const UI = /^src\/(?!server\/).*\.(tsx|ts)$/; // UI code: server code (emails, images) has its own needs
const CSS = /^src\/(?!app\/globals\.css$|styles\/tailwind\.css$).*\.css$/; // new stylesheets; the two token files are the source of truth
const SRC = /^src\/.*\.(tsx|ts)$/;

const PALETTE = "slate|gray|zinc|neutral|stone|red|orange|yellow|lime|emerald|teal|cyan|sky|indigo|purple|fuchsia|pink|rose";
// Our own tints are named amber/green/blue/violet/clay/sand + -bg/-fg, so only the numbered default shades (…-500) are foreign.
const SHADES = `(?:${PALETTE}|amber|green|blue|violet)-(?:50|[1-9]00|950)`;

export const RULES = [
  {
    id: "hex-colour",
    files: [UI, CSS],
    re: /[\s"'`(:\[,_]#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_-])/,
    message:
      "Hard-coded hex colour. Use a token: text-fg / text-fg-muted / bg-surface / bg-surface-muted / text-green-fg …, a tint (`at-<tint> tint`), or `bg-(--abf)`. Missing a colour? Add a token to :root in globals.css and to @theme in tailwind.css — don't inline it.",
  },
  {
    id: "rgb-colour",
    files: [UI, CSS],
    re: /\b(?:rgba?|hsla?|oklch|oklab)\(/,
    message: "Hard-coded rgb()/hsl() colour. Use a token or the `glass` / `tint` utilities (docs/DESIGN_LANGUAGE.md §3–4).",
  },
  {
    id: "default-palette",
    files: [UI],
    re: new RegExp(`\\b(?:bg|text|border|ring|from|to|via|fill|stroke|divide|outline|decoration|accent|caret|placeholder)-${SHADES}\\b`),
    message:
      "Tailwind's default palette (bg-gray-100, text-blue-500…) isn't our theme. Use bg-surface-muted, text-fg-muted, text-green-fg, `at-<tint> tint`…",
  },
  {
    id: "black",
    files: [UI],
    re: /\b(?:bg|text|border|ring|fill|stroke)-black\b/,
    message: "Pure black isn't in the theme. Ink is `text-fg`; the dark fill is `bg-fill-dark text-on-dark`.",
  },
  {
    id: "default-shadow-radius",
    files: [UI],
    re: /\b(?:shadow-(?:sm|md|lg|xl|2xl|inner)|rounded(?:-[trbl]{1,2})?-(?:sm|md|lg|xl|2xl|3xl))\b/,
    message:
      "Default Tailwind shadow/radius. Use shadow-e1…e4 and rounded-r1…r5 / rounded-pill (the `glass` utility already includes the ring).",
  },
  {
    id: "tiny-text",
    files: [UI],
    re: /\btext-\[(?:[0-9]|10)(?:\.\d+)?px\]/,
    skipLine: /<FA\b|<i\b|icon=/, // glyph sizes are fine; this is about readable text
    message: "Text under 11px is unreadable. Smallest allowed is 11px (labels); body 13.5–15px.",
  },
  {
    id: "font-literal",
    files: [UI],
    re: /\bfontFamily\b|font-family\s*:|\bfont-\[(?:['"]|[a-zA-Z])/,
    message: "Don't set fonts by hand. Display = `font-serif` (Instrument Serif), UI = default Geist, numbers/code = `font-mono`.",
  },
  {
    id: "inline-style-literal",
    files: [UI],
    re: /style=\{\{[^}]*\b(?:color|background(?:Color)?|boxShadow|borderRadius|fontSize|fontFamily|border)\s*:\s*["'`](?!var\()/,
    message:
      "Literal visual values in an inline style. Use utilities/tokens; inline style is only for computed geometry (top, height, width, CSS variables).",
  },
  {
    id: "native-dialog",
    files: [SRC],
    re: /(?<![\w.$])(?:alert|confirm|prompt)\(|\bwindow\.(?:alert|confirm|prompt)\(/,
    skipFile: /\buse(?:Confirm|Prompt)\b/, // `prompt(…)` is the hook's own function there
    message: "No native alert/confirm/prompt. Use useConfirm() / usePrompt() from components/ui/Confirm.",
  },
  {
    id: "native-date-time",
    files: [UI],
    re: /type=["'{`]*(?:date|time|datetime-local|month|week)["'}`]*/,
    message:
      "Native date/time pickers look foreign. Use JournalCalendar (dates) and a `tf-pill` <select> (times) — see features/calendar/components/EventDialog.tsx.",
  },
  {
    id: "env-direct",
    files: [/^src\/(?!config\/|server\/|instrumentation).*\.(tsx|ts)$/],
    re: /\bprocess\.env\.(?!NODE_ENV\b|NEXT_PUBLIC_)/,
    message: "Read configuration through src/config (serverEnv()), not process.env. Secrets never go in client code.",
  },
  {
    id: "public-secret",
    files: [SRC, /^\.env\.example$/],
    re: /NEXT_PUBLIC_(?!\w*(?:POSTHOG|PUBLISHABLE|SITE_KEY|ANON)\w*)\w*(?:KEY|SECRET|TOKEN|PASSWORD|PRIVATE)\w*/,
    message: "NEXT_PUBLIC_* is shipped to the browser. Secrets (AI/Composio/Stripe keys) must never use it.",
  },
  {
    id: "secret-literal",
    files: [/^src\/.*\.(tsx|ts)$/, /^scripts\/.*\.mjs$/],
    re: /\b(?:sk-[A-Za-z0-9_-]{20,}|gsk_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|eyJhbGciOi[A-Za-z0-9_-]{20,})/,
    message: "Looks like a committed secret. Remove it, rotate the key, load it from the environment.",
  },
  {
    id: "hard-coded-host",
    files: [/^src\/(?!config\/).*\.(tsx|ts)$/],
    re: /["'`]https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)[:/"'`]/,
    message: "Hard-coded localhost URL. Use a relative URL (/api/v1/…) or the configured base URL from src/config.",
  },
  {
    id: "any-type",
    files: [SRC],
    re: /:\s*any\b(?!\w)|\bas any\b|<any>|\bany\[\]/,
    message: "No `any`. Use `unknown` and narrow, or a real type.",
  },
];

const OK = /design-ok\s*:/;
const OK_FILE = /design-ok-file\s*:/; // a whole file that is deliberately literal (brand marks, art-directed material); say why

/**
 * @param {string} file repo-relative path with forward slashes
 * @param {{ n: number; text: string }[]} lines the lines to check (only the added ones, normally)
 * @param {string[]} [allLines] the whole file, so `design-ok` on the previous line is honoured
 * @returns {{ file: string; line: number; id: string; message: string; text: string }[]}
 */
export function checkLines(file, lines, allLines) {
  const out = [];
  const rules = RULES.filter((r) => r.files.some((f) => f.test(file)));
  if (!rules.length) return out;
  const whole = allLines ? allLines.join("\n") : "";
  if (OK_FILE.test(whole)) return out;
  for (const { n, text } of lines) {
    if (OK.test(text) || (allLines && OK.test(allLines[n - 2] ?? ""))) continue;
    for (const r of rules) {
      if (r.skipLine?.test(text) || (r.skipFile && whole && r.skipFile.test(whole))) continue;
      if (r.re.test(text)) out.push({ file, line: n, id: r.id, message: r.message, text: text.trim().slice(0, 140) });
    }
  }
  return out;
}
