import type { WidgetProps } from "@untitled/logic";
import { FlexWidget } from "react-native-android-widget";

import { Card, Label, type WidgetSize } from "./primitives";

/** The latest entry written today and the writing streak. */
export function JournalWidget({ props, size }: { props: WidgetProps; size: WidgetSize }) {
  const { snapshot, theme, text, links, layout } = props;
  const tone = theme.tones.journal;
  const j = snapshot.journal;
  const lines = Math.max(1, Math.floor((size.height - layout.headerDp) / layout.rowDp));
  const streak = j.streak > 0 ? `${j.streak} ${text.streakOne}` : "";

  return (
    <Card props={props} tone={tone} href={links.journal}>
      <FlexWidget style={{ width: "match_parent", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Label text={text.journalTitle} size={layout.type.title} color={tone.fg} bold />
        <Label text={snapshot.signedIn ? streak : ""} size={layout.type.small} color={theme.fgSubtle} />
      </FlexWidget>
      {!snapshot.signedIn ? (
        <Label text={text.signIn} size={layout.type.body} color={theme.fgMuted} />
      ) : j.latest ? (
        <>
          <Label text={j.latest.time} size={layout.type.small} color={theme.fgSubtle} />
          <Label text={j.latest.text} size={layout.type.body} color={theme.fg} maxLines={lines} grow />
        </>
      ) : (
        <Label text={text.journalEmpty} size={layout.type.body} color={theme.fgMuted} />
      )}
    </Card>
  );
}
