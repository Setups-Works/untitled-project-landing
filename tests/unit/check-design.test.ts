import { describe, expect, it } from "vitest";
import { checkLines } from "../../scripts/design/rules.mjs";

const run = (file: string, ...src: string[]) => {
  const lines = src.map((text, i) => ({ n: i + 1, text }));
  return checkLines(file, lines, src).map((v) => v.id);
};
const TSX = "src/features/x/components/X.tsx";

describe("design rules", () => {
  it("flags hard-coded colours but not tokens or tints", () => {
    expect(run(TSX, `<div className="bg-[#c26a1a] text-fg" />`)).toEqual(["hex-colour"]);
    expect(run(TSX, `<div style={{ color: "#fff" }} />`)).toContain("hex-colour");
    expect(run(TSX, `const c = "rgba(0,0,0,.4)";`)).toEqual(["rgb-colour"]);
    expect(run(TSX, `<div className="at-blue tint bg-surface-muted text-amber-fg bg-white/60 text-fg-muted" />`)).toEqual([]);
    expect(run(TSX, `<a href="#main">skip</a>`)).toEqual([]);
  });

  it("flags Tailwind's default palette, black, and default shadow/radius", () => {
    expect(run(TSX, `<p className="text-gray-500 bg-blue-100" />`)).toEqual(["default-palette"]);
    expect(run(TSX, `<p className="bg-black/40" />`)).toEqual(["black"]);
    expect(run(TSX, `<p className="rounded-md shadow-lg" />`)).toEqual(["default-shadow-radius"]);
    expect(run(TSX, `<p className="rounded-r3 shadow-e2 rounded-pill rounded-full" />`)).toEqual([]);
  });

  it("flags tiny text but allows tiny icons", () => {
    expect(run(TSX, `<span className="text-[9px]">x</span>`)).toEqual(["tiny-text"]);
    expect(run(TSX, `<FA icon={faCheck} className="text-[9px]" />`)).toEqual([]);
    expect(run(TSX, `<span className="text-[11px]">x</span>`)).toEqual([]);
  });

  it("flags native dialogs and date/time inputs", () => {
    expect(run(TSX, `if (window.confirm("sure?")) go();`)).toEqual(["native-dialog"]);
    expect(run(TSX, `alert("hi");`)).toEqual(["native-dialog"]);
    expect(run(TSX, `const { prompt } = usePrompt();`, `const v = await prompt({ title: "x" });`)).toEqual([]);
    expect(run(TSX, `<input type="date" />`)).toEqual(["native-date-time"]);
    expect(run(TSX, `<input type="text" />`)).toEqual([]);
  });

  it("flags config and secret mistakes outside src/config", () => {
    expect(run(TSX, `const k = process.env.GROQ_API_KEY;`)).toEqual(["env-direct"]);
    expect(run("src/config/env.ts", `const k = process.env.GROQ_API_KEY;`)).toEqual([]);
    expect(run(TSX, `const k = process.env.NODE_ENV;`)).toEqual([]);
    expect(run(TSX, `NEXT_PUBLIC_GROQ_API_KEY`)).toContain("public-secret");
    expect(run(TSX, `NEXT_PUBLIC_POSTHOG_KEY`)).toEqual([]);
    expect(run(TSX, `fetch("http://localhost:3000/api/v1/x")`)).toEqual(["hard-coded-host"]);
    expect(run(TSX, `const t: any = 1;`)).toEqual(["any-type"]);
  });

  it("honours design-ok on the same line or the line above", () => {
    expect(run(TSX, `const c = "#1f5d49"; // design-ok: canvas needs a literal`)).toEqual([]);
    expect(run(TSX, `// design-ok: brand mark`, `const c = "#1f5d49";`)).toEqual([]);
    expect(run(TSX, `const c = "#1f5d49";`)).toEqual(["hex-colour"]);
  });

  it("allows var() tokens in inline styles and skips files marked design-ok-file", () => {
    expect(run(TSX, "<i style={{ background: `var(--${tone}-bg)` }} />")).toEqual([]);
    expect(run(TSX, `<i style={{ background: "red" }} />`)).toEqual(["inline-style-literal"]);
    expect(run(TSX, `// design-ok-file: brand colours`, `<path fill="#EA4335" />`)).toEqual([]);
    expect(run(TSX, `className="shadow-[inset_0_1px_0_#fff]"`)).toEqual(["hex-colour"]);
  });

  it("leaves server code, the token files and unrelated paths alone", () => {
    expect(run("src/server/email/template.ts", `const c = "#1f5d49";`)).toEqual([]);
    expect(run("src/app/globals.css", `--x: #1f5d49;`)).toEqual([]);
    expect(run("src/styles/tailwind.css", `--x: #1f5d49;`)).toEqual([]);
    expect(run("src/features/x/x.module.css", `a { color: #1f5d49; }`)).toEqual(["hex-colour"]);
    expect(run("docs/readme.md", `#1f5d49`)).toEqual([]);
  });
});
