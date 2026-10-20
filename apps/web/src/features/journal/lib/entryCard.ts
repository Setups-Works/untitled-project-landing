import { ENTRY_CARD as C, plainEntryText, wrapLines } from "@untitled/logic";
import { tokenColor } from "../../../lib/cssVar";

export type CardFonts = { serif: string; sans: string; mono: string };

/** The resolved font stack for a CSS variable (a canvas cannot read `var(--x)` itself). */
function fontStack(variable: string, fallback: string) {
  const probe = document.createElement("span");
  probe.style.fontFamily = `var(${variable})`; // design-ok: resolving a font token for canvas, not choosing a font
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).fontFamily; // design-ok: reads the resolved token
  probe.remove();
  return resolved || fallback;
}

export const cardFonts = (): CardFonts => ({
  serif: fontStack("--serif", "Georgia, serif"),
  sans: fontStack("--sans", "sans-serif"),
  mono: fontStack("--mono", "monospace"),
});

/**
 * Draws a journal entry as a picture: a violet card with the day, the time in the serif, the text and the app's name. Layout numbers and
 * the plain text come from @untitled/logic, the same the app uses; colours are design tokens resolved from the page.
 */
export async function renderEntryCard(entry: { dayLabel: string; timeLabel: string; body: string }, fonts: CardFonts = cardFonts()) {
  await document.fonts?.ready;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const bodyFont = `${C.bodySize}px ${fonts.serif}`;
  ctx.font = bodyFont;
  const lines = wrapLines(plainEntryText(entry.body), C.width - C.padding * 2, (s) => ctx.measureText(s).width);
  const lineH = C.bodySize * C.lineHeight;
  const headH = C.dateSize * 1.5 + C.timeSize * 1.3;
  const height = Math.round(
    C.padding + headH + C.padding / 2 + Math.max(lines.length, 1) * lineH + C.padding * 0.9 + C.brandSize + C.padding * 0.7,
  );

  canvas.width = C.width;
  canvas.height = height;
  const ink = tokenColor("var(--fg)");
  const soft = tokenColor("var(--fg-subtle)");
  const rule = tokenColor("var(--violet-fg)");

  ctx.fillStyle = tokenColor("var(--violet-bg)");
  ctx.fillRect(0, 0, C.width, height);
  ctx.textBaseline = "alphabetic";

  let y = C.padding + C.dateSize;
  ctx.fillStyle = soft;
  ctx.font = `${C.dateSize}px ${fonts.sans}`;
  ctx.fillText(entry.dayLabel, C.padding, y);

  y += C.timeSize * 1.1;
  ctx.fillStyle = ink;
  ctx.font = `${C.timeSize}px ${fonts.serif}`;
  ctx.fillText(entry.timeLabel, C.padding, y);
  // The hairline after the time, as on the app's feed.
  const after = C.padding + ctx.measureText(entry.timeLabel).width + 28;
  ctx.strokeStyle = rule;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(after, y - C.timeSize * 0.3);
  ctx.lineTo(C.width - C.padding, y - C.timeSize * 0.3);
  ctx.stroke();
  ctx.globalAlpha = 1;

  y += C.padding / 2 + C.bodySize;
  ctx.fillStyle = ink;
  ctx.font = bodyFont;
  for (const line of lines) {
    ctx.fillText(line, C.padding, y);
    y += lineH;
  }

  ctx.fillStyle = soft;
  ctx.font = `${C.brandSize}px ${fonts.mono}`;
  ctx.fillText(C.brand, C.padding, height - C.padding * 0.7);

  return new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
}
