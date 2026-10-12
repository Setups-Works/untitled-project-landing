import { forwardRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { AppText } from "./AppText";
import { Icon } from "./Icon";
import { Font, Palette, Radius } from "@/constants/theme";

type Props = Omit<TextInputProps, "style"> & {
  label: string;
  error?: string | null;
  /** Adds the show/hide eye and hides the text. */
  password?: boolean;
  multiline?: boolean;
  minHeight?: number;
};

export const TextField = forwardRef<TextInput, Props>(function TextField({ label, error, password, multiline, minHeight, ...rest }, ref) {
  const [shown, setShown] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <AppText variant="small" color={Palette.fgMuted} style={styles.label}>
        {label}
      </AppText>
      <View
        style={[
          styles.box,
          { borderColor: error ? Palette.clayFg : focused ? Palette.greenFg : Palette.line },
          multiline ? { minHeight: minHeight ?? 120, alignItems: "flex-start" } : null,
        ]}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={Palette.fgFaint}
          selectionColor={Palette.greenFg}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          secureTextEntry={password && !shown}
          autoCapitalize={password ? "none" : rest.autoCapitalize}
          autoCorrect={password ? false : rest.autoCorrect}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[styles.input, multiline ? styles.inputMulti : null]}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={shown ? "Hide password" : "Show password"}
            hitSlop={10}
            onPress={() => setShown((s) => !s)}
            style={styles.eye}
          >
            <Icon name={shown ? "eye-slash" : "eye"} size={16} color={Palette.fgSubtle} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="small" color={Palette.clayFg} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { marginLeft: 4 },
  box: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 50,
    borderRadius: Radius.r2,
    borderWidth: 1,
    backgroundColor: Palette.glassHi,
    paddingHorizontal: 16,
  },
  input: { flex: 1, ...Font.sans, fontSize: 16, color: Palette.fg, paddingVertical: 12 },
  inputMulti: { paddingTop: 14 },
  eye: { paddingLeft: 10 },
});
