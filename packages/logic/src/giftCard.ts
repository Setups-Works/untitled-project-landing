// design-ok-file: the welcome card's iridescent foil is art-directed (literal gradient stops, one source for web and mobile) — a material, not UI chrome.
/**
 * The welcome gift card, described once. The web draws it to a canvas, the mobile app to an SVG; both read the same
 * layers, numbers and wording from here, in the same 1712 × 1080 space (a credit card at 2×, ratio 1.586), so the two
 * can't drift apart. Nothing here touches a DOM or a native view.
 */

export type GiftStop = [offset: number, color: string];
export type GiftLinear = { angle: number; stops: GiftStop[] };

export const GIFT_W = 1712;
export const GIFT_H = 1080;
export const GIFT_RADIUS = 40;

export const GIFT_TEXT = {
  brand: "untitled project",
  tag: "WELCOME GIFT",
  foot: "YOUR WORKSPACE, YOUR WAY",
} as const;

/** The caption that goes with the card image when it is shared; the link is added when the app knows its address. */
export function giftShareText(name: string, link?: string) {
  const who = name.trim() || "Someone";
  return [`${who} just received a welcome gift from untitled project.`, "Notes, tasks, journal, chat, calendar and more in one workspace.", link]
    .filter(Boolean)
    .join("\n");
}

export const GIFT_FILE_NAME = "untitled-project-gift-card.png";

/** Start and end of a CSS-style gradient line at `angleDeg` that spans a w × h box (what a canvas or SVG gradient needs). */
export function gradientLine(angleDeg: number, w = GIFT_W, h = GIFT_H) {
  const a = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
  return { x1: w / 2 - dx * half, y1: h / 2 - dy * half, x2: w / 2 + dx * half, y2: h / 2 + dy * half };
}

export const GIFT_LAYERS: {
  base: GiftLinear;
  rainbow: GiftLinear;
  film: { x: number; y: number; rgb: string }[];
  pearl: GiftLinear;
  sheen: GiftLinear;
  glare: { x: number; y: number; r: number; stops: GiftStop[] };
} = {
  base: {
    angle: 135,
    stops: [
      [0, "#eeeeee"],
      [0.4, "#dcdcdc"],
      [0.72, "#c9c9c9"],
      [1, "#e8e8e8"],
    ],
  },
  rainbow: {
    angle: 112,
    stops: [
      [0.3, "rgba(0,220,255,0)"],
      [0.38, "rgba(0,220,255,0.06)"],
      [0.46, "rgba(80,255,190,0.05)"],
      [0.54, "rgba(190,255,80,0.03)"],
      [0.62, "rgba(255,230,70,0.03)"],
      [0.7, "rgba(255,70,180,0.06)"],
      [0.8, "rgba(150,90,255,0.06)"],
      [0.9, "rgba(60,120,255,0.04)"],
      [1, "rgba(60,120,255,0)"],
    ],
  },
  /** Soft colour blooms: centre as a share of the card, and the "r,g,b" of the bloom. */
  film: [
    { x: 0.16, y: 0.28, rgb: "255,70,180" },
    { x: 0.66, y: 0.18, rgb: "0,220,255" },
    { x: 0.78, y: 0.7, rgb: "80,255,190" },
    { x: 0.38, y: 0.82, rgb: "150,90,255" },
  ],
  pearl: {
    angle: 112,
    stops: [
      [0, "rgba(220,230,238,0.5)"],
      [0.3, "rgba(220,230,238,0)"],
      [0.5, "rgba(84,108,128,0.35)"],
      [0.72, "rgba(215,226,235,0.5)"],
      [1, "rgba(215,226,235,0.1)"],
    ],
  },
  sheen: {
    angle: 120,
    stops: [
      [0, "rgba(220,230,238,0)"],
      [0.3, "rgba(226,235,242,0.42)"],
      [0.52, "rgba(37,52,66,0.2)"],
      [0.66, "rgba(0,124,255,0.04)"],
      [0.76, "rgba(255,0,147,0.04)"],
      [0.88, "rgba(223,232,239,0.28)"],
      [1, "rgba(220,230,238,0)"],
    ],
  },
  glare: {
    x: 0.62,
    y: 0.38,
    r: 0.4,
    stops: [
      [0, "rgba(226,235,242,0.4)"],
      [0.25, "rgba(205,218,228,0.14)"],
      [1, "rgba(226,237,246,0)"],
    ],
  },
};

/** The bloom's stops for a given "r,g,b". */
export const filmStops = (rgb: string): GiftStop[] => [
  [0, `rgba(${rgb},0.14)`],
  [0.4, `rgba(${rgb},0.05)`],
  [1, `rgba(${rgb},0)`],
];

/** Where things sit on the card face. */
export const GIFT_FACE = {
  padX: GIFT_W * 0.08,
  top: GIFT_H * 0.17,
  nameY: GIFT_H * 0.58,
  footY: GIFT_H - GIFT_H * 0.13,
  maxNameWidth: GIFT_W - GIFT_W * 0.08 * 2,
  brandSize: 90,
  brandSpacing: -0.9,
  smallSize: 40,
  smallSpacing: 7.2,
  nameSize: 135,
  nameMinSize: 32,
  /** Engraving: light lower edge, dark upper edge, dark core. */
  engrave: { light: "rgba(255,255,255,0.85)", dark: "rgba(0,0,0,0.3)", core: "rgba(36,46,58,0.66)", offset: 4 },
  ink: "rgba(27,28,20,0.78)",
  inkSoft: "rgba(27,28,20,0.45)",
  dot: "#1f6b4a",
  rim: "rgba(255,255,255,0.5)",
} as const;

/** The name's letter spacing for a font size. */
export const giftNameSpacing = (size: number) => size * 0.06;

/**
 * A font size that fits `label` on one line when text can't be measured (SVG on a phone): an uppercase serif letter plus its
 * spacing is about 0.74 of the size wide. The web measures the real width instead and shrinks until it fits.
 */
export function giftNameSizeFor(label: string) {
  const n = Math.max(label.length, 1);
  return Math.max(GIFT_FACE.nameMinSize, Math.min(GIFT_FACE.nameSize, Math.floor(GIFT_FACE.maxNameWidth / (n * 0.74))));
}
