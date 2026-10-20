// design-ok-file: the welcome card's iridescent foil is art-directed; its colours come from @untitled/logic (the same spec the web draws), not from UI tokens.
import {
  GIFT_FACE,
  GIFT_H,
  GIFT_LAYERS,
  GIFT_RADIUS,
  GIFT_TEXT,
  GIFT_W,
  filmStops,
  giftNameSizeFor,
  giftNameSpacing,
  gradientLine,
  type GiftStop,
} from "@untitled/logic";
import { forwardRef } from "react";
import { View } from "react-native";
import Svg, { ClipPath, Defs, LinearGradient, RadialGradient, Rect, Stop, Text as SvgText, Circle } from "react-native-svg";

import { Font } from "@/constants/theme";

/** SVG stops take a colour and an opacity separately, so split the spec's "rgba(r,g,b,a)" strings. */
function parse(color: string) {
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return { color, opacity: 1 };
  const [r, g, b, a] = m[1].split(",").map((v) => Number(v.trim()));
  return { color: `rgb(${r},${g},${b})`, opacity: a ?? 1 };
}

function stopEls(stops: GiftStop[]) {
  return stops.map(([offset, c]) => {
    const { color, opacity } = parse(c);
    return <Stop key={`${offset}-${c}`} offset={offset} stopColor={color} stopOpacity={opacity} />;
  });
}

function Linear({ id, angle, stops }: { id: string; angle: number; stops: GiftStop[] }) {
  const { x1, y1, x2, y2 } = gradientLine(angle);
  return (
    <LinearGradient id={id} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
      {stopEls(stops)}
    </LinearGradient>
  );
}

/**
 * The welcome gift card: the same layers, wording and numbers as the web card (packages/logic/src/giftCard.ts), drawn as one
 * SVG in the card's own 1712 × 1080 space. The ref is the Svg, so the share action can turn exactly what is on screen into a PNG.
 */
export const GiftCard = forwardRef<Svg, { name: string }>(function GiftCard({ name }, ref) {
  const L = GIFT_LAYERS;
  const F = GIFT_FACE;
  const label = name.trim().toUpperCase() || "WELCOME";
  const size = giftNameSizeFor(label);
  const spacing = giftNameSpacing(size);
  const serif = Font.serif.fontFamily;
  const mono = Font.mono.fontFamily;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`Welcome gift card for ${name}`} style={{ aspectRatio: GIFT_W / GIFT_H, width: "100%" }}>
      <Svg ref={ref} width="100%" height="100%" viewBox={`0 0 ${GIFT_W} ${GIFT_H}`}>
        <Defs>
          <ClipPath id="card">
            <Rect width={GIFT_W} height={GIFT_H} rx={GIFT_RADIUS} ry={GIFT_RADIUS} />
          </ClipPath>
          <Linear id="base" angle={L.base.angle} stops={L.base.stops} />
          <Linear id="rainbow" angle={L.rainbow.angle} stops={L.rainbow.stops} />
          <Linear id="pearl" angle={L.pearl.angle} stops={L.pearl.stops} />
          <Linear id="sheen" angle={L.sheen.angle} stops={L.sheen.stops} />
          {L.film.map((f, i) => (
            <RadialGradient key={f.rgb} id={`film${i}`} gradientUnits="userSpaceOnUse" cx={f.x * GIFT_W} cy={f.y * GIFT_H} r={GIFT_W * 0.5}>
              {stopEls(filmStops(f.rgb))}
            </RadialGradient>
          ))}
          <RadialGradient id="glare" gradientUnits="userSpaceOnUse" cx={GIFT_W * L.glare.x} cy={GIFT_H * L.glare.y} r={GIFT_W * L.glare.r}>
            {stopEls(L.glare.stops)}
          </RadialGradient>
        </Defs>

        <Rect width={GIFT_W} height={GIFT_H} rx={GIFT_RADIUS} ry={GIFT_RADIUS} fill="url(#base)" />
        <Rect width={GIFT_W} height={GIFT_H} clipPath="url(#card)" fill="url(#rainbow)" />
        {L.film.map((f, i) => (
          <Rect key={f.rgb} width={GIFT_W} height={GIFT_H} clipPath="url(#card)" fill={`url(#film${i})`} />
        ))}
        <Rect width={GIFT_W} height={GIFT_H} clipPath="url(#card)" fill="url(#pearl)" />
        <Rect width={GIFT_W} height={GIFT_H} clipPath="url(#card)" fill="url(#sheen)" />
        <Rect width={GIFT_W} height={GIFT_H} clipPath="url(#card)" fill="url(#glare)" />

        <Circle cx={F.padX + 22} cy={F.top - 18} r={22} fill={F.dot} />
        <SvgText x={F.padX + 66} y={F.top} fill={F.ink} fontFamily={serif} fontSize={F.brandSize} letterSpacing={F.brandSpacing}>
          {GIFT_TEXT.brand}
        </SvgText>
        <SvgText x={GIFT_W - F.padX} y={F.top - 6} textAnchor="end" fill={F.inkSoft} fontFamily={mono} fontSize={F.smallSize} letterSpacing={F.smallSpacing}>
          {GIFT_TEXT.tag}
        </SvgText>
        <SvgText x={F.padX} y={F.footY} fill={F.inkSoft} fontFamily={mono} fontSize={F.smallSize} letterSpacing={F.smallSpacing}>
          {GIFT_TEXT.foot}
        </SvgText>

        {/* Engraved name: light lower edge, dark upper edge, then the core. */}
        <SvgText x={F.padX} y={F.nameY + F.engrave.offset} fill={F.engrave.light} fontFamily={serif} fontSize={size} letterSpacing={spacing}>
          {label}
        </SvgText>
        <SvgText x={F.padX} y={F.nameY - F.engrave.offset} fill={F.engrave.dark} fontFamily={serif} fontSize={size} letterSpacing={spacing}>
          {label}
        </SvgText>
        <SvgText x={F.padX} y={F.nameY} fill={F.engrave.core} fontFamily={serif} fontSize={size} letterSpacing={spacing}>
          {label}
        </SvgText>

        <Rect x={1.5} y={1.5} width={GIFT_W - 3} height={GIFT_H - 3} rx={GIFT_RADIUS} ry={GIFT_RADIUS} fill="none" stroke={F.rim} strokeWidth={3} />
      </Svg>
    </View>
  );
});

/** The card as a base64 PNG (no data-URL prefix), at the same 1712 × 1080 the web downloads. */
export function giftCardPng(svg: Svg): Promise<string> {
  return new Promise((resolve) => svg.toDataURL(resolve, { width: GIFT_W, height: GIFT_H }));
}
