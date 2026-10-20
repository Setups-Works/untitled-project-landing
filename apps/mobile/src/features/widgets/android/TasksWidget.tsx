import type { WidgetProps } from "@untitled/logic";
import { FlexWidget } from "react-native-android-widget";

import { Card, Label, type WidgetSize } from "./primitives";

/** Today's open to-dos with a count; as many rows as the widget's height allows. */
export function TasksWidget({ props, size }: { props: WidgetProps; size: WidgetSize }) {
  const { snapshot, theme, text, links, layout } = props;
  const tone = theme.tones.tasks;
  const rows = Math.max(1, Math.floor((size.height - layout.headerDp) / layout.rowDp));
  const items = snapshot.tasks.items.slice(0, rows);
  const count = snapshot.tasks.overdue + snapshot.tasks.dueToday;

  return (
    <Card props={props} tone={tone} href={links.tasks}>
      <FlexWidget style={{ width: "match_parent", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Label text={text.tasksTitle} size={layout.type.title} color={tone.fg} bold />
        <Label text={snapshot.signedIn ? String(count) : ""} size={layout.type.title} color={theme.fg} bold />
      </FlexWidget>
      {!snapshot.signedIn ? (
        <Label text={text.signIn} size={layout.type.body} color={theme.fgMuted} />
      ) : items.length === 0 ? (
        <Label text={text.tasksEmpty} size={layout.type.body} color={theme.fgMuted} />
      ) : (
        items.map((task) => (
          <Label
            key={task.id}
            text={`${task.overdue ? "! " : "• "}${task.title}`}
            size={layout.type.body}
            color={task.overdue ? theme.tones.journal.fg : theme.fg}
            maxLines={1}
            grow
          />
        ))
      )}
    </Card>
  );
}
