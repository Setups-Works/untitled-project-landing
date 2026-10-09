/** Draws the welcome card to a PNG (same layers as GiftCard, flattened) and saves it. Browser only. */

const W = 1712; // 2x a credit card at 856 px wide, ratio 1.586
const H = 1080;

function linear(ctx: CanvasRenderingContext2D, angleDeg: number, stops: [number, string][], w = W, h = H) {
  const a = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
  const g = ctx.createLinearGradient(w / 2 - dx * half, h / 2 - dy * half, w / 2 + dx * half, h / 2 + dy * half);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

function radial(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, stops: [number, string][]) {
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

export async function downloadGiftCard(name: string, fonts: { serif: string; mono: string }) {
  await document.fonts?.ready;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  const r = 40;
  roundRect(ctx, 0, 0, W, H, r);
  ctx.clip();

  // Foil base, then the rainbow band, the colour film, the pearl highlight and the specular sheen.
  ctx.fillStyle = linear(ctx, 135, [[0, "#eeeeee"], [0.4, "#dcdcdc"], [0.72, "#c9c9c9"], [1, "#e8e8e8"]]);
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = linear(ctx, 112, [
    [0.3, "rgba(0,220,255,0)"], [0.38, "rgba(0,220,255,0.06)"], [0.46, "rgba(80,255,190,0.05)"], [0.54, "rgba(190,255,80,0.03)"],
    [0.62, "rgba(255,230,70,0.03)"], [0.7, "rgba(255,70,180,0.06)"], [0.8, "rgba(150,90,255,0.06)"], [0.9, "rgba(60,120,255,0.04)"], [1, "rgba(60,120,255,0)"],
  ]);
  ctx.fillRect(0, 0, W, H);

  ctx.globalCompositeOperation = "screen";
  const film: [number, number, string][] = [
    [0.16, 0.28, "255,70,180"],
    [0.66, 0.18, "0,220,255"],
    [0.78, 0.7, "80,255,190"],
    [0.38, 0.82, "150,90,255"],
  ];
  for (const [fx, fy, c] of film) {
    ctx.fillStyle = radial(ctx, fx * W, fy * H, W * 0.5, [[0, `rgba(${c},0.14)`], [0.4, `rgba(${c},0.05)`], [1, `rgba(${c},0)`]]);
    ctx.fillRect(0, 0, W, H);
  }

  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = linear(ctx, 112, [[0, "rgba(220,230,238,0.5)"], [0.3, "rgba(220,230,238,0)"], [0.5, "rgba(84,108,128,0.35)"], [0.72, "rgba(215,226,235,0.5)"], [1, "rgba(215,226,235,0.1)"]]);
  ctx.fillRect(0, 0, W, H);

  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = linear(ctx, 120, [
    [0, "rgba(220,230,238,0)"], [0.3, "rgba(226,235,242,0.42)"], [0.52, "rgba(37,52,66,0.2)"], [0.66, "rgba(0,124,255,0.04)"],
    [0.76, "rgba(255,0,147,0.04)"], [0.88, "rgba(223,232,239,0.28)"], [1, "rgba(220,230,238,0)"],
  ]);
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = radial(ctx, W * 0.62, H * 0.38, W * 0.4, [[0, "rgba(226,235,242,0.4)"], [0.25, "rgba(205,218,228,0.14)"], [1, "rgba(226,237,246,0)"]]);
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "source-over";

  // Logo (top left) and the small labels.
  const padX = W * 0.08;
  const top = H * 0.17;
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(255,255,255,0.7)";
  ctx.shadowOffsetY = 4;
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#1f6b4a";
  ctx.beginPath();
  ctx.arc(padX + 22, top - 18, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(27,28,20,0.78)";
  ctx.font = `90px ${fonts.serif}`;
  ctx.letterSpacing = "-0.9px";
  ctx.fillText("untitled project", padX + 66, top);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = "rgba(27,28,20,0.45)";
  ctx.font = `40px ${fonts.mono}`;
  const tag = "WELCOME GIFT";
  spaced(ctx, tag, W - padX - spacedWidth(ctx, tag, 7.2), top - 6, 7.2);
  spaced(ctx, "YOUR WORKSPACE, YOUR WAY", padX, H - H * 0.13, 7.2);

  // Engraved name: shrink to fit, a light lower edge and a dark upper edge make it look cut into the foil.
  const label = name.trim().toUpperCase();
  let size = 135;
  const maxW = W - padX * 2;
  const space = () => size * 0.06;
  ctx.font = `${size}px ${fonts.serif}`;
  while (size > 32 && spacedWidth(ctx, label, space()) > maxW) {
    size -= 2;
    ctx.font = `${size}px ${fonts.serif}`;
  }
  const y = H * 0.58;
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  spaced(ctx, label, padX, y + 4, space());
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  spaced(ctx, label, padX, y - 4, space());
  ctx.fillStyle = "rgba(36,46,58,0.66)";
  spaced(ctx, label, padX, y, space());

  // 1px rim, like the on-screen card's inset border.
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 3;
  roundRect(ctx, 1.5, 1.5, W - 3, H - 3, r);
  ctx.stroke();

  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "untitled-project-gift-card.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return true;
}
