import * as Haptics from "expo-haptics";
import { FontAwesome6 } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import type { ComponentProps } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Font, Palette, Radius, Tints } from "@/constants/theme";

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];
type SF = "house.fill" | "checklist" | "book.fill" | "heart.fill";
type FA = ComponentProps<typeof FontAwesome6>["name"];

const TABS: { name: string; title: string; sf?: SF; fa: FA; image?: ImageSourcePropType }[] = [
  { name: "home", title: "Home", sf: "house.fill", fa: "house" },
  { name: "todo", title: "Plan", sf: "checklist", fa: "list-check" },
  { name: "journal", title: "Journal", sf: "book.fill", fa: "book-open" },
  { name: "health", title: "Health", sf: "heart.fill", fa: "heart-pulse" },
  { name: "chat", title: "Chat", fa: "comments", image: require("../../../assets/images/chat-sparkle.png") as ImageSourcePropType },
];

/** iOS: native liquid-glass UITabBarController with SF Symbols and search-role chat */
function IosNativeTabs() {
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

/** Android: floating pill navbar with capsule active indicator + split standalone round black Chat button */
function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const mainRoutes = state.routes.filter((r) => r.name !== "chat");
  const chatRoute = state.routes.find((r) => r.name === "chat");

  return (
    <View
      style={[
        styles.barWrapper,
        { paddingBottom: Math.max(insets.bottom + 8, 16) },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.contentRow}>
        {/* Main tabs capsule pill */}
        <View style={styles.pillContainer}>
          {mainRoutes.map((route) => {
            const index = state.routes.indexOf(route);
            const isFocused = state.index === index;
            const tabConfig = TABS.find((t) => t.name === route.name);
            const label = tabConfig?.title ?? route.name;

            const onPress = () => {
              void Haptics.selectionAsync().catch(() => undefined);
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            const iconColor = isFocused ? Palette.fg : Palette.fgMuted;

            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel={label}
                onPress={onPress}
                onLongPress={onLongPress}
                style={({ pressed }) => [
                  styles.tabItem,
                  isFocused ? styles.tabItemActive : styles.tabItemInactive,
                  pressed ? styles.tabItemPressed : null,
                ]}
              >
                {tabConfig?.fa ? (
                  <FontAwesome6
                    name={tabConfig.fa}
                    size={19}
                    color={iconColor}
                    solid
                  />
                ) : null}

                <Text
                  numberOfLines={1}
                  style={[
                    styles.tabLabel,
                    isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Split standalone round chat button with black background */}
        {chatRoute ? (() => {
          const chatIndex = state.routes.indexOf(chatRoute);
          const isChatFocused = state.index === chatIndex;
          const chatConfig = TABS.find((t) => t.name === "chat");

          const onChatPress = () => {
            void Haptics.selectionAsync().catch(() => undefined);
            const event = navigation.emit({
              type: "tabPress",
              target: chatRoute.key,
              canPreventDefault: true,
            });

            if (!isChatFocused && !event.defaultPrevented) {
              navigation.navigate(chatRoute.name);
            }
          };

          const onChatLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: chatRoute.key,
            });
          };

          return (
            <Pressable
              key={chatRoute.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isChatFocused }}
              accessibilityLabel="Chat"
              onPress={onChatPress}
              onLongPress={onChatLongPress}
              style={({ pressed }) => [
                styles.chatButton,
                isChatFocused ? styles.chatButtonActive : null,
                pressed ? styles.chatButtonPressed : null,
              ]}
            >
              {chatConfig?.image ? (
                <Image
                  source={chatConfig.image}
                  style={styles.chatIconImage}
                  resizeMode="contain"
                />
              ) : (
                <FontAwesome6 name="comments" size={20} color={Palette.onDark} solid />
              )}
            </Pressable>
          );
        })() : null}
      </View>
    </View>
  );
}

function AndroidTabs() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { position: "absolute" },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="todo" options={{ title: "Plan" }} />
      <Tabs.Screen name="journal" options={{ title: "Journal" }} />
      <Tabs.Screen name="health" options={{ title: "Health" }} />
      <Tabs.Screen name="chat" options={{ title: "Chat" }} />
    </Tabs>
  );
}

export default function TabsLayout() {
  if (Platform.OS === "ios") {
    return <IosNativeTabs />;
  }
  return <AndroidTabs />;
}

const styles = StyleSheet.create({
  barWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 420,
    gap: 10,
  },
  pillContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Palette.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Palette.line,
    height: 58,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    paddingHorizontal: 2,
    height: 48,
    borderRadius: Radius.pill,
  },
  tabItemActive: {
    backgroundColor: Palette.activeTabPill,
  },
  tabItemInactive: {
    backgroundColor: "transparent",
  },
  tabItemPressed: {
    opacity: 0.75,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
    textAlign: "center",
  },
  tabLabelActive: {
    ...Font.sansSemi,
    color: Palette.fg,
  },
  tabLabelInactive: {
    ...Font.sansMedium,
    color: Palette.fgMuted,
  },
  chatButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Palette.fillDark,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Palette.lineStrong,
    overflow: "hidden",
  },
  chatButtonActive: {
    borderColor: Palette.fg,
    borderWidth: 1.5,
  },
  chatButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  chatIconImage: {
    width: 21,
    height: 21,
    tintColor: Palette.onDark,
  },
});
