import { itemTarget, parseInline, parseMarkdown, type Align, type Block, type Inline } from "@untitled/logic";
import { router } from "expo-router";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppText } from "./AppText";
import { Font, Palette, Radius } from "@/constants/theme";

/** Opens a web link in the browser, and an in-app item link (to-do, note, journal day) on the matching mobile screen. */
function openItem(href: string) {
  const t = itemTarget(href);
  if (!t) return;
  if (t.kind === "task") router.push({ pathname: "/task/[id]", params: { id: t.id } });
  else if (t.kind === "note") router.push({ pathname: "/note/[id]", params: { id: t.id } });
  else router.navigate("/journal");
}

function InlineText({ text, color }: { text: string; color: string }) {
  return (
    <>
      {parseInline(text).map((p: Inline, i) => {
        if (p.type === "strong")
          return (
            <Text key={i} style={styles.strong}>
              {p.text}
            </Text>
          );
        if (p.type === "code")
          return (
            <Text key={i} style={styles.inlineCode}>
              {p.text}
            </Text>
          );
        if (p.type === "link" || p.type === "item")
          return (
            <Text
              key={i}
              accessibilityRole="link"
              style={styles.link}
              onPress={() => (p.type === "link" ? void Linking.openURL(p.href) : openItem(p.href))}
            >
              {p.text}
            </Text>
          );
        return (
          <Text key={i} style={{ color }}>
            {p.text}
          </Text>
        );
      })}
    </>
  );
}

const textAlign = (a: Align) => a;

function BlockView({ b, color }: { b: Block; color: string }) {
  switch (b.type) {
    case "heading":
      return (
        <AppText
          variant={b.level === 1 ? "title" : "heading"}
          color={color}
          accessibilityRole="header"
          style={b.level === 3 ? styles.h3 : null}
        >
          <InlineText text={b.text} color={color} />
        </AppText>
      );
    case "quote":
      return (
        <View style={styles.quote}>
          <AppText variant="body" color={Palette.fgMuted}>
            <InlineText text={b.text} color={Palette.fgMuted} />
          </AppText>
        </View>
      );
    case "hr":
      return <View style={styles.hr} />;
    case "code":
      return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.codeBox}>
          <Text selectable style={styles.codeText}>
            {b.source}
          </Text>
        </ScrollView>
      );
    case "list":
      return (
        <View style={styles.list}>
          {b.items.map((it, j) => (
            <View key={j} style={styles.item}>
              <AppText variant="body" color={Palette.fgSubtle} style={styles.bullet}>
                {b.check ? (it.done ? "☑" : "☐") : "•"}
              </AppText>
              <AppText variant="body" color={it.done ? Palette.fgFaint : color} style={[styles.itemText, it.done ? styles.struck : null]}>
                <InlineText text={it.text} color={it.done ? Palette.fgFaint : color} />
              </AppText>
            </View>
          ))}
        </View>
      );
    case "table":
      return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.table}>
          <View>
            <View style={[styles.row, styles.headRow]}>
              {b.headers.map((h, c) => (
                <View key={c} style={styles.cell}>
                  <AppText variant="small" color={Palette.fg} style={[styles.headText, { textAlign: textAlign(b.aligns[c] ?? "left") }]}>
                    <InlineText text={h} color={Palette.fg} />
                  </AppText>
                </View>
              ))}
            </View>
            {b.rows.map((r, ri) => (
              <View key={ri} style={styles.row}>
                {r.map((v, c) => (
                  <View key={c} style={styles.cell}>
                    <AppText variant="small" color={Palette.fgMuted} style={{ textAlign: textAlign(b.aligns[c] ?? "left") }}>
                      <InlineText text={v} color={Palette.fgMuted} />
                    </AppText>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      );
    default:
      return (
        <AppText variant="body" color={color} selectable>
          <InlineText text={b.text} color={color} />
        </AppText>
      );
  }
}

/** A parser failure must never take a screen down: fall back to the plain text. */
function safeParse(text: string): Block[] {
  try {
    return parseMarkdown(text);
  } catch {
    return [{ type: "p", text }];
  }
}

/** The web's Markdown dialect, drawn with native views. Parsing is shared with the web app (`@untitled/logic`). */
export function Markdown({ text, color = Palette.fg }: { text: string; color?: string }) {
  return (
    <View style={styles.wrap}>
      {safeParse(text).map((b, i) => (
        <BlockView key={i} b={b} color={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  strong: { ...Font.sansSemi },
  inlineCode: { ...Font.mono, fontSize: 13, backgroundColor: Palette.surfaceSunken },
  link: { color: Palette.greenFg, textDecorationLine: "underline", ...Font.sansMedium },
  h3: { fontSize: 20, lineHeight: 24 },
  quote: { borderLeftWidth: 3, borderLeftColor: Palette.greenLine, paddingLeft: 12 },
  hr: { height: StyleSheet.hairlineWidth, backgroundColor: Palette.lineStrong, marginVertical: 4 },
  codeBox: { backgroundColor: Palette.surfaceSunken, borderRadius: Radius.r1, padding: 12 },
  codeText: { ...Font.mono, fontSize: 13, color: Palette.fg },
  list: { gap: 4 },
  item: { flexDirection: "row", gap: 8 },
  bullet: { width: 18 },
  itemText: { flex: 1 },
  struck: { textDecorationLine: "line-through" },
  table: { borderWidth: 1, borderColor: Palette.line, borderRadius: Radius.r1 },
  row: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Palette.line },
  headRow: { backgroundColor: Palette.surfaceMuted, borderTopWidth: 0 },
  cell: { width: 150, padding: 8 },
  headText: { ...Font.sansSemi },
});
