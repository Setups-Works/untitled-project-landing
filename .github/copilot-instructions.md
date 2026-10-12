# Copilot instructions

This repository's rules for **every** AI agent live in [`AGENTS.md`](../AGENTS.md) — read it first, then `docs/DESIGN_LANGUAGE.md` before you touch any UI, and the `AGENTS.md` of every folder you change.

Non-negotiable (checked by `npm run check:design`, the pre-commit hook and CI):

- No hard-coded colours, fonts, radii, shadows, URLs, keys or env reads. Use the design tokens, `at-<tint> tint`, `glass`, `src/config`, `qk`. Missing a token? Add it once in `:root` (`src/app/globals.css`) and `@theme` (`src/styles/tailwind.css`).
- Match the existing screens (`/dashboard/todo` is the reference): cream canvas, serif titles (Instrument Serif), Geist UI text, frosted-glass cards, pill buttons.
- No Tailwind default palette (`bg-gray-100`, `text-blue-500`), no native `alert/confirm/prompt`, no `<input type="date|time">`.
- Run `npx tsc --noEmit`, `npm test`, `npm run check:design` before you finish. Never use `--no-verify`.
