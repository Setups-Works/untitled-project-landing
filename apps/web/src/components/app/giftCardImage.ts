// design-ok-file: flattens the art-directed foil card (same literal gradients as GiftCard.module.css) to a PNG — a canvas, not UI chrome.
/** Draws the welcome card to a PNG (same layers as GiftCard, flattened) and saves it. Browser only. */

import { GIFT_FACE, GIFT_FILE_NAME, GIFT_H, GIFT_LAYERS, GIFT_RADIUS, GIFT_TEXT, GIFT_W, filmStops, giftNameSpacing, gradientLine, type GiftStop } from "@untitled/logic";

const W = GIFT_W;
const H = GIFT_H;

function linear(ctx: CanvasRenderingContext2D, angleDeg: number, stops: GiftStop[]) {
  const { x1, y1, x2, y2 } = gradientLine(angleDeg, W, H);
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

function radial(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, stops: GiftStop[]) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const nativeSpacing = typeof CanvasRenderingContext2D !== "undefined" && "letterSpacing" in CanvasRenderingContext2D.prototype;

/** Text with letter spacing. Native `letterSpacing` keeps the font's kerning; the glyph loop is only a fallback. */
function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  if (nativeSpacing) {
    ctx.letterSpacing = `${spacing}px`;
    ctx.fillText(text, x, y);
    ctx.letterSpacing = "0px";
    return;
  }
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
}

function spacedWidth(ctx: CanvasRenderingContext2D, text: string, spacing: number) {
  if (nativeSpacing) {
    ctx.letterSpacing = `${spacing}px`;
    const w = ctx.measureText(text).width - spacing;
    ctx.letterSpacing = "0px";
    return w;
  }
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width + spacing;
  return w - spacing;
}

/** Draws the card (layers from @untitled/logic) onto a canvas and returns it. */
export async function renderGiftCard(name: string, fonts: { serif: string; mono: string }) {
  await document.fonts?.ready;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  roundRect(ctx, 0, 0, W, H, GIFT_RADIUS);
  ctx.clip();
  const L = GIFT_LAYERS;

  // Foil base, then the rainbow band, the colour film, the pearl highlight and the specular sheen.
  ctx.fillStyle = linear(ctx, L.base.angle, L.base.stops);
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = linear(ctx, L.rainbow.angle, L.rainbow.stops);
  ctx.fillRect(0, 0, W, H);

  ctx.globalCompositeOperation = "screen";
  for (const f of L.film) {
    ctx.fillStyle = radial(ctx, f.x * W, f.y * H, W * 0.5, filmStops(f.rgb));
    ctx.fillRect(0, 0, W, H);
  }

  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = linear(ctx, L.pearl.angle, L.pearl.stops);
  ctx.fillRect(0, 0, W, H);

  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = linear(ctx, L.sheen.angle, L.sheen.stops);
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = radial(ctx, W * L.glare.x, H * L.glare.y, W * L.glare.r, L.glare.stops);
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "source-over";

  // Logo (top left) and the small labels.
  const F = GIFT_FACE;
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(255,255,255,0.7)";
  ctx.shadowOffsetY = 4;
  ctx.shadowBlur = 0;
  ctx.fillStyle = F.dot;
  ctx.beginPath();
  ctx.arc(F.padX + 22, F.top - 18, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = F.ink;
  ctx.font = `${F.brandSize}px ${fonts.serif}`;
  ctx.letterSpacing = `${F.brandSpacing}px`;
  ctx.fillText(GIFT_TEXT.brand, F.padX + 66, F.top);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = F.inkSoft;
  ctx.font = `${F.smallSize}px ${fonts.mono}`;
  spaced(ctx, GIFT_TEXT.tag, W - F.padX - spacedWidth(ctx, GIFT_TEXT.tag, F.smallSpacing), F.top - 6, F.smallSpacing);
  spaced(ctx, GIFT_TEXT.foot, F.padX, F.footY, F.smallSpacing);

  // Engraved name: shrink to fit, a light lower edge and a dark upper edge make it look cut into the foil.
  const label = name.trim().toUpperCase();
  let size: number = F.nameSize;
  ctx.font = `${size}px ${fonts.serif}`;
  while (size > F.nameMinSize && spacedWidth(ctx, label, giftNameSpacing(size)) > F.maxNameWidth) {
    size -= 2;
    ctx.font = `${size}px ${fonts.serif}`;
  }
  const space = giftNameSpacing(size);
  ctx.shadowColor = "transparent";
  ctx.fillStyle = F.engrave.light;
  spaced(ctx, label, F.padX, F.nameY + F.engrave.offset, space);
  ctx.fillStyle = F.engrave.dark;
  spaced(ctx, label, F.padX, F.nameY - F.engrave.offset, space);
  ctx.fillStyle = F.engrave.core;
  spaced(ctx, label, F.padX, F.nameY, space);

  // 1px rim, like the on-screen card's inset border.
  ctx.strokeStyle = F.rim;
  ctx.lineWidth = 3;
  roundRect(ctx, 1.5, 1.5, W - 3, H - 3, GIFT_RADIUS);
  ctx.stroke();
  return canvas;
}

/** The card as a PNG file, ready to download or share. */
export async function giftCardBlob(name: string, fonts: { serif: string; mono: string }) {
  const canvas = await renderGiftCard(name, fonts);
  if (!canvas) return null;
  return new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
}

export async function downloadGiftCard(name: string, fonts: { serif: string; mono: string }) {
  const blob = await giftCardBlob(name, fonts);
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = GIFT_FILE_NAME;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return true;
}
