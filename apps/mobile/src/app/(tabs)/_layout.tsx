import { FontAwesome6 } from "@expo/vector-icons";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import type { ComponentProps } from "react";
import { Platform, type ImageSourcePropType } from "react-native";

import { Font, Palette, Tints } from "@/constants/theme";

type SF = "house.fill" | "checklist" | "note.text" | "book.fill";
type FA = ComponentProps<typeof FontAwesome6>["name"];

// `sf` is the iOS SF Symbol and `fa` the Android icon. A tab with an `image` (Chat) uses that single-colour glyph on both, tinted like the other icons.
const TABS: { name: string; title: string; sf?: SF; fa: FA; image?: ImageSourcePropType }[] = [
  { name: "home", title: "Home", sf: "house.fill", fa: "house" },
  { name: "todo", title: "To-do", sf: "checklist", fa: "list-check" },
  { name: "notes", title: "Notes", sf: "note.text", fa: "note-sticky" },
  { name: "journal", title: "Journal", sf: "book.fill", fa: "book-open" },
  { name: "chat", title: "Chat", fa: "comments", image: require("../../../assets/images/chat-sparkle.png") as ImageSourcePropType },
];

/**
 * Native bottom tabs (UITabBarController on iOS, BottomNavigationView on Android) through Expo Router's wrapper of
 * react-native-screens, the same primitive as React Navigation's native bottom tab navigator. iOS uses SF Symbols;
 * Android draws the same Font Awesome icons the rest of the app uses. Android allows at most 5 tabs, so Profile lives behind the avatar on Home.
 */
export default function TabsLayout() {
  return (
    <NativeTabs
      tintColor={Palette.greenFg}
      iconColor={Palette.fgFaint}
      backgroundColor={Palette.page}
      indicatorColor={Tints.green.bg}
      rippleColor={Tints.green.line}
      labelStyle={{ ...Font.sansMedium, fontSize: 11 }}
    >
      {TABS.map((t) => (
        // Chat takes the `search` role: on iOS 26 the system draws it as the separate round button beside the tab bar.
        <NativeTabs.Trigger key={t.name} name={t.name} role={t.name === "chat" ? "search" : undefined}>
          <NativeTabs.Trigger.Label>{t.title}</NativeTabs.Trigger.Label>
          {t.image ? (
            <NativeTabs.Trigger.Icon src={t.image} renderingMode="template" />
          ) : Platform.OS === "ios" && t.sf ? (
            <NativeTabs.Trigger.Icon sf={t.sf} />
          ) : (
            <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={FontAwesome6} name={t.fa} />} />
          )}
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
