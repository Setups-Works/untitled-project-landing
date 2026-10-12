import { FontAwesome6 } from "@expo/vector-icons";
import type { ComponentProps } from "react";

import { Palette } from "@/constants/theme";

export type IconName = ComponentProps<typeof FontAwesome6>["name"];

/** Font Awesome Free (solid), the same icon family as the web app. */
export function Icon({ name, size = 18, color = Palette.fg }: { name: IconName; size?: number; color?: string }) {
  return <FontAwesome6 name={name} size={size} color={color} solid />;
}
