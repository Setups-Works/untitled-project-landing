import { HStack, Link, ProgressView, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import { containerBackground, font, foregroundStyle, padding } from "@expo/ui/swift-ui/modifiers";
import { WIDGET_NAMES, type WidgetProps } from "@untitled/logic";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

// See TasksWidget.tsx: everything this widget draws arrives in `props`.
const HealthWidget = (props: WidgetProps, environment: WidgetEnvironment) => {
  "widget";
  const { snapshot, theme, text, links, layout } = props;
  const tone = theme.tones.health;
  const h = snapshot.health;
  const wide = environment.widgetFamily !== "systemSmall";
  const stats: { label: string; value: string }[] = [];
  if (h?.distance) stats.push({ label: text.distance, value: h.distance });
  if (h && h.activeKcal !== null) stats.push({ label: text.energy, value: `${h.activeKcal} ${text.kcal}` });
  if (h?.sleep) stats.push({ label: text.sleep, value: h.sleep });

  return (
    <Link destination={links.health} modifiers={[containerBackground(tone.bg, "widget")]}>
      <VStack alignment="leading" spacing={layout.gap} modifiers={[padding({ all: layout.pad })]}>
        <Text modifiers={[font({ size: layout.type.title, weight: "semibold", design: "serif" }), foregroundStyle(tone.fg)]}>
          {text.healthTitle}
        </Text>
        {!snapshot.signedIn ? (
          <Text modifiers={[font({ size: layout.type.body }), foregroundStyle(theme.fgMuted)]}>{text.signIn}</Text>
        ) : !h || h.steps === null ? (
          <Text modifiers={[font({ size: layout.type.body }), foregroundStyle(theme.fgMuted)]}>{text.healthEmpty}</Text>
        ) : (
          <VStack alignment="leading" spacing={layout.gap / 2}>
            <Text modifiers={[font({ size: layout.type.big, weight: "bold" }), foregroundStyle(theme.fg)]}>{h.steps.toLocaleString()}</Text>
            <ProgressView value={h.stepsRatio} />
            <Text
              modifiers={[font({ size: layout.type.small }), foregroundStyle(theme.fgSubtle)]}
            >{`${text.stepsOf} ${h.stepsGoal.toLocaleString()}`}</Text>
            {wide ? (
              <HStack spacing={layout.gap}>
                {stats.map((s) => (
                  <VStack key={s.label} alignment="leading">
                    <Text modifiers={[font({ size: layout.type.small }), foregroundStyle(theme.fgSubtle)]}>{s.label}</Text>
                    <Text modifiers={[font({ size: layout.type.body, weight: "semibold" }), foregroundStyle(theme.fg)]}>{s.value}</Text>
                  </VStack>
                ))}
              </HStack>
            ) : null}
          </VStack>
        )}
        <Spacer />
      </VStack>
    </Link>
  );
};

export default createWidget(WIDGET_NAMES.health, HealthWidget);
