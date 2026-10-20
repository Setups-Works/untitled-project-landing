import { HStack, Link, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import { containerBackground, font, foregroundStyle, lineLimit, padding } from "@expo/ui/swift-ui/modifiers";
import { WIDGET_NAMES, type WidgetProps } from "@untitled/logic";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

// A widget runs in its own runtime and can't see anything outside this function: every colour, word, size and count comes in through
// `props` (built once in features/widgets/sync.ts from the app's tokens and @untitled/logic), so nothing is written twice or hard-coded here.
const TasksWidget = (props: WidgetProps, environment: WidgetEnvironment) => {
  "widget";
  const { snapshot, theme, text, links, layout } = props;
  const tone = theme.tones.tasks;
  const family = environment.widgetFamily as keyof typeof layout.rows;
  const items = snapshot.tasks.items.slice(0, layout.rows[family] ?? layout.rows.systemMedium);
  const count = snapshot.tasks.overdue + snapshot.tasks.dueToday;

  return (
    <Link destination={links.tasks} modifiers={[containerBackground(tone.bg, "widget")]}>
      <VStack alignment="leading" spacing={layout.gap} modifiers={[padding({ all: layout.pad })]}>
        <HStack>
          <Text modifiers={[font({ size: layout.type.title, weight: "semibold", design: "serif" }), foregroundStyle(tone.fg)]}>
            {text.tasksTitle}
          </Text>
          <Spacer />
          <Text modifiers={[font({ size: layout.type.title, weight: "bold" }), foregroundStyle(theme.fg)]}>
            {snapshot.signedIn ? String(count) : ""}
          </Text>
        </HStack>
        {!snapshot.signedIn ? (
          <Text modifiers={[font({ size: layout.type.body }), foregroundStyle(theme.fgMuted)]}>{text.signIn}</Text>
        ) : items.length === 0 ? (
          <Text modifiers={[font({ size: layout.type.body }), foregroundStyle(theme.fgMuted)]}>{text.tasksEmpty}</Text>
        ) : (
          items.map((task) => (
            <Text
              key={task.id}
              modifiers={[
                font({ size: layout.type.body }),
                foregroundStyle(task.overdue ? theme.tones.journal.fg : theme.fg),
                lineLimit(1),
              ]}
            >
              {`${task.overdue ? "! " : "• "}${task.title}`}
            </Text>
          ))
        )}
        <Spacer />
      </VStack>
    </Link>
  );
};

export default createWidget(WIDGET_NAMES.tasks, TasksWidget);
