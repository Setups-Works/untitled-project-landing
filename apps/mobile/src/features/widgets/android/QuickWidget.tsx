import type { WidgetProps } from "@untitled/logic";
import { FlexWidget } from "react-native-android-widget";

import { Card, Label, hex, type WidgetSize } from "./primitives";

/** One-tap buttons that open a new journal entry, note or task in the app. */
export function QuickWidget({ props }: { props: WidgetProps; size: WidgetSize }) {
  const { snapshot, theme, text, links, layout } = props;
  const tone = theme.tones.quick;
  const actions = [
    { label: text.newEntry, href: links.newEntry },
    { label: text.newNote, href: links.newNote },
    { label: text.newTask, href: links.newTask },
  ];

  return (
    <Card props={props} tone={tone} href={links.journal}>
      <Label text={text.quickTitle} size={layout.type.title} color={tone.fg} bold />
      {snapshot.signedIn ? (
        <FlexWidget style={{ width: "match_parent", flexDirection: "row", flexGap: layout.gap, alignItems: "center" }}>
          {actions.map((a) => (
            <FlexWidget
              key={a.label}
              clickAction="OPEN_URI"
              clickActionData={{ uri: a.href }}
              style={{
                flex: 1,
                backgroundColor: hex(theme.accent),
                borderRadius: layout.radius / 2,
                paddingVertical: layout.pad,
                alignItems: "center",
                flexDirection: "column",
              }}
            >
              <Label text="+" size={layout.type.big} color={theme.onAccent} />
              <Label text={a.label} size={layout.type.small} color={theme.onAccent} />
            </FlexWidget>
          ))}
        </FlexWidget>
      ) : (
        <Label text={text.signIn} size={layout.type.body} color={theme.fgMuted} />
      )}
    </Card>
  );
}
