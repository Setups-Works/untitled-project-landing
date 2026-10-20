import { HStack, Link, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import { containerBackground, font, foregroundStyle, padding } from "@expo/ui/swift-ui/modifiers";
import { WIDGET_NAMES, type WidgetProps } from "@untitled/logic";
import { createWidget } from "expo-widgets";

// See TasksWidget.tsx: everything this widget draws arrives in `props`.
const QuickWidget = (props: WidgetProps) => {
  "widget";
  const { snapshot, theme, text, links, layout } = props;
  const tone = theme.tones.quick;
  const actions = [
    { label: text.newEntry, href: links.newEntry },
    { label: text.newNote, href: links.newNote },
    { label: text.newTask, href: links.newTask },
  ];

  return (
    <VStack alignment="leading" spacing={layout.gap} modifiers={[padding({ all: layout.pad }), containerBackground(tone.bg, "widget")]}>
      <Text modifiers={[font({ size: layout.type.title, weight: "semibold", design: "serif" }), foregroundStyle(tone.fg)]}>
        {text.quickTitle}
      </Text>
      {snapshot.signedIn ? (
        <HStack spacing={layout.gap}>
          {actions.map((a) => (
            <Link key={a.label} destination={a.href}>
              <VStack spacing={layout.gap / 2}>
                <Text modifiers={[font({ size: layout.type.big, weight: "light" }), foregroundStyle(theme.onAccent)]}>+</Text>
                <Text modifiers={[font({ size: layout.type.small, weight: "medium" }), foregroundStyle(theme.onAccent)]}>{a.label}</Text>
              </VStack>
            </Link>
          ))}
        </HStack>
      ) : (
        <Text modifiers={[font({ size: layout.type.body }), foregroundStyle(theme.fgMuted)]}>{text.signIn}</Text>
      )}
      <Spacer />
    </VStack>
  );
};

export default createWidget(WIDGET_NAMES.quick, QuickWidget);
