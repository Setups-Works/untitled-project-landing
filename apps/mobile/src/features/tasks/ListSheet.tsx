import { LIST_TONES } from "@untitled/logic";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { TextField } from "@/components/ui/TextField";
import { Palette, Radius, Tints } from "@/constants/theme";

type Props = {
  visible: boolean;
  title: string;
  initialName?: string;
  initialColor?: string;
  onSubmit: (name: string, color: string) => void;
  onClose: () => void;
  onDelete?: () => void;
};

/** Create or edit a list: a name and one of the app's tints (the web's list colour choices). */
export function ListSheet({ visible, onClose, ...rest }: Props) {
  return (
    <Sheet visible={visible} onClose={onClose} title={rest.title}>
      {visible ? <Form {...rest} /> : null}
    </Sheet>
  );
}

function Form({ initialName = "", initialColor = LIST_TONES[0], onSubmit, onDelete }: Omit<Props, "visible" | "title" | "onClose">) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState<string>(initialColor);
  return (
    <View style={styles.gap}>
      <TextField label="List name" value={name} onChangeText={setName} maxLength={60} autoFocus returnKeyType="done" />
      <AppText variant="label">Colour</AppText>
      <View style={styles.colors} accessibilityRole="radiogroup">
        {LIST_TONES.map((t) => (
          <Pressable
            key={t}
            accessibilityRole="radio"
            accessibilityLabel={t}
            accessibilityState={{ selected: color === t }}
            hitSlop={6}
            onPress={() => setColor(t)}
            style={[
              styles.dot,
              { backgroundColor: Tints[t].bg, borderColor: color === t ? Tints[t].fg : Palette.line, borderWidth: color === t ? 2 : 1 },
            ]}
          />
        ))}
      </View>
      <Button title="Save list" disabled={!name.trim()} onPress={() => onSubmit(name.trim(), color)} />
      {onDelete ? <Button title="Delete list" kind="danger" icon="trash" onPress={onDelete} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { gap: 14, paddingBottom: 8 },
  colors: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  dot: { width: 34, height: 34, borderRadius: Radius.pill },
});
