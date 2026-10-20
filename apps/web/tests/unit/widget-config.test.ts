import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { WIDGET_LAYOUT, WIDGET_LINKS, WIDGET_NAMES } from "@untitled/logic";

/**
 * The widgets are registered by name in apps/mobile/app.json (for WidgetKit and for Android) and drawn by name in code. If the two ever
 * disagree a widget silently never appears, so this test fails first.
 */
const app = JSON.parse(readFileSync(new URL("../../../mobile/app.json", import.meta.url), "utf8")) as {
  expo: { scheme: string; plugins: (string | [string, { widgets?: { name: string; ios?: { supportedFamilies: string[] } }[] }])[] };
};
const widgetsOf = (plugin: string) => {
  const entry = app.expo.plugins.find((p) => Array.isArray(p) && p[0] === plugin);
  return (Array.isArray(entry) ? (entry[1].widgets ?? []) : []).map((w) => w.name).sort();
};
const names = Object.values(WIDGET_NAMES).sort();

describe("home-screen widget configuration", () => {
  it("registers the same widgets on iOS and Android as the code draws", () => {
    expect(widgetsOf("expo-widgets")).toEqual(names);
    expect(widgetsOf("react-native-android-widget")).toEqual(names);
  });

  it("only declares iOS sizes the layout has rows for", () => {
    const entry = app.expo.plugins.find((p) => Array.isArray(p) && p[0] === "expo-widgets");
    const sizes = new Set(Object.keys(WIDGET_LAYOUT.rows));
    for (const w of Array.isArray(entry) ? (entry[1].widgets ?? []) : []) {
      for (const family of w.ios?.supportedFamilies ?? []) expect(sizes.has(family)).toBe(true);
    }
  });

  it("points every tap at the app's own scheme", () => {
    for (const link of Object.values(WIDGET_LINKS)) expect(link.startsWith(`${app.expo.scheme}://`)).toBe(true);
  });
});
