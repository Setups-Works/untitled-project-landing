import type { WidgetProps, WidgetTone } from "@untitled/logic";
import { FlexWidget, TextWidget, type ColorProp, type HexColor } from "react-native-android-widget";
import type { ReactNode } from "react";

/** Widget colours are the app's hex design tokens (see ../theme.ts); the library just wants them typed as hex. */
export const hex = (color: string) => color as HexColor;

/** The size the platform gave this widget instance, in dp. */
export type WidgetSize = { width: number; height: number };

/** The widget's card: the tone's background, the shared radius and padding, and a tap that opens `href` in the app. */
export function Card({ props, tone, href, children }: { props: WidgetProps; tone: WidgetTone; href: string; children: ReactNode }) {
  const { layout } = props;
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: href }}
      style={{
        width: "match_parent",
        height: "match_parent",
        backgroundColor: hex(tone.bg),
        borderRadius: layout.radius,
        padding: layout.pad,
        flexDirection: "column",
        flexGap: layout.gap,
      }}
    >
      {children}
    </FlexWidget>
  );
}

export function Label({
  text,
  size,
  color,
  bold = false,
  maxLines,
  grow = false,
}: {
  text: string;
  size: number;
  color: string;
  bold?: boolean;
  maxLines?: number;
  grow?: boolean;
}) {
  return (
    <TextWidget
      text={text}
      maxLines={maxLines}
      truncate="END"
      style={{
        fontSize: size,
        color: hex(color),
        fontWeight: bold ? "bold" : "normal",
        ...(grow ? { width: "match_parent" as const } : {}),
      }}
    />
  );
}

export type { ColorProp };
