import { HStack, Link, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import { containerBackground, font, foregroundStyle, lineLimit, padding } from "@expo/ui/swift-ui/modifiers";
import { WIDGET_NAMES, type WidgetProps } from "@untitled/logic";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

// See TasksWidget.tsx: everything this widget draws arrives in `props`.
const JournalWidget = (props: WidgetProps, environment: WidgetEnvironment) => {
  "widget";
  const { snapshot, theme, text, links, layout } = props;
  const tone = theme.tones.journal;
  const j = snapshot.journal;
  const streak = j.streak > 0 ? `${j.streak} ${text.streakOne}` : "";
  const lines = layout.lines[environment.widgetFamily as keyof typeof layout.lines] ?? layout.lines.systemMedium;

  return (
    <Link destination={links.journal} modifiers={[containerBackground(tone.bg, "widget")]}>
      <VStack alignment="leading" spacing={layout.gap} modifiers={[padding({ all: layout.pad })]}>
        <HStack>
          <Text modifiers={[font({ size: layout.type.title, weight: "semibold", design: "serif" }), foregroundStyle(tone.fg)]}>
            {text.journalTitle}
          </Text>
          <Spacer />
          <Text modifiers={[font({ size: layout.type.small, weight: "medium" }), foregroundStyle(theme.fgSubtle)]}>
            {snapshot.signedIn ? streak : ""}
          </Text>
        </HStack>
        {!snapshot.signedIn ? (
          <Text modifiers={[font({ size: layout.type.body }), foregroundStyle(theme.fgMuted)]}>{text.signIn}</Text>
        ) : j.latest ? (
          <VStack alignment="leading" spacing={layout.gap / 2}>
            <Text modifiers={[font({ size: layout.type.small }), foregroundStyle(theme.fgSubtle)]}>{j.latest.time}</Text>
            <Text modifiers={[font({ size: layout.type.body, design: "serif" }), foregroundStyle(theme.fg), lineLimit(lines)]}>
              {j.latest.text}
            </Text>
          </VStack>
        ) : (
          <Text modifiers={[font({ size: layout.type.body, design: "serif" }), foregroundStyle(theme.fgMuted)]}>{text.journalEmpty}</Text>
        )}
        <Spacer />
      </VStack>
    </Link>
  );
};

export default createWidget(WIDGET_NAMES.journal, JournalWidget);
