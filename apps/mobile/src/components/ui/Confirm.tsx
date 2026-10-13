"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "./AppText";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { Font, Palette, Radius, Shadow, Tints } from "@/constants/theme";
import { useRuntimePrefs } from "@/lib/preferences";

/*
 * Promise-based replacements for Alert.alert / prompt, matching the web's `.cd` confirm dialog (apps/web/src/components/ui/Confirm.tsx):
 *   const { ask, dialog } = useConfirm();     // render {dialog} once, then: if (!(await ask({ title, body, danger }))) return;
 *   const { prompt, dialog } = usePrompt();   // render {dialog} once, then: const value = await prompt({ title, label, validate });
 */

type Options = { title: string; body?: ReactNode; confirmLabel?: string; danger?: boolean };
type Pending = Options & { resolve: (ok: boolean) => void };

function ConfirmDialog({
  title,
  body,
  confirmLabel = "Confirm",
  danger = false,
  resolve,
}: Pending) {
  const preferences = useRuntimePrefs();
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const scale = useRef(new Animated.Value(0.97)).current;

  // Run the pop-in on mount, matching web cdPop: translateY(10px) scale(0.97) cdFade: 0.16s
  useEffect(() => {
    if (preferences.reduceMotion) {
      scrimOpacity.setValue(1);
      translateY.setValue(0);
      scale.setValue(1);
      return;
    }
    Animated.parallel([
      Animated.timing(scrimOpacity, { toValue: 1, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [preferences.reduceMotion, scale, scrimOpacity, translateY]);

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={() => resolve(false)}>
      <Body
        scrimOpacity={scrimOpacity}
        translateY={translateY}
        scale={scale}
        title={title}
        body={body}
        confirmLabel={confirmLabel}
        danger={danger}
        resolve={resolve}
      />
    </Modal>
  );
}

function Body({
  scrimOpacity,
  translateY,
  scale,
  title,
  body,
  confirmLabel,
  danger,
  resolve,
}: {
  scrimOpacity: Animated.Value;
  translateY: Animated.Value;
  scale: Animated.Value;
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  danger: boolean;
  resolve: (ok: boolean) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Scrim — translucent cream backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: scrimOpacity }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          style={StyleSheet.absoluteFill}
          onPress={() => resolve(false)}
        />
      </Animated.View>

      {/* Dialog panel — web: .cd white surface, r4 (28px), inset 1px ring, --e4 shadow */}
      <Animated.View
        style={[
          styles.card,
          { marginBottom: Math.max(insets.bottom, 16) },
          { transform: [{ translateY }, { scale }] },
        ]}
      >
        {/* Icon badge — web: 48×48 amber (warning) or clay (danger) squircle */}
        <View style={[styles.badge, danger ? styles.badgeDanger : styles.badgeWarning]}>
          <Icon
            name={danger ? "trash" : "triangle-exclamation"}
            size={18}
            color={danger ? Palette.clayFg : Tints.amber.fg}
          />
        </View>

        <AppText variant="heading" style={styles.titleText}>
          {title}
        </AppText>

        {body ? (
          typeof body === "string" ? (
            <AppText variant="body" color={Palette.fgMuted} style={styles.bodyText}>
              {body}
            </AppText>
          ) : (
            body
          )
        ) : null}

        {/* Actions — web on mobile: column-reverse full-width buttons */}
        <View style={styles.actions}>
          <Button title="Cancel" kind="secondary" onPress={() => resolve(false)} style={styles.btn} />
          <Button
            title={confirmLabel}
            kind={danger ? "dangerSolid" : "primary"}
            onPress={() => resolve(true)}
            style={styles.btn}
          />
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

/**
 * Drop-in replacement for `Alert.alert` confirm dialogs, styled like the web's `.cd` confirm dialog.
 *
 * ```tsx
 * const { ask, dialog } = useConfirm();
 * // render {dialog} in JSX once, then:
 * if (!(await ask({ title: "Delete?", danger: true }))) return;
 * ```
 */
export function useConfirm() {
  const [pending, setPending] = useState<Pending | null>(null);

  const ask = useCallback(
    (opts: Options) =>
      new Promise<boolean>((resolve) => setPending({ ...opts, resolve })),
    [],
  );

  const settle = useCallback((ok: boolean) => {
    setPending((p) => {
      p?.resolve(ok);
      return null;
    });
  }, []);

  const dialog = pending ? (
    <ConfirmDialog
      title={pending.title}
      body={pending.body}
      confirmLabel={pending.confirmLabel}
      danger={pending.danger}
      resolve={settle}
    />
  ) : null;

  return { ask, dialog };
}

// ----------------- Prompt Dialog -----------------

type PromptOptions = {
  title: string;
  body?: ReactNode;
  label: string;
  placeholder?: string;
  initial?: string;
  confirmLabel?: string;
  /** Return an error message to keep the dialog open, or null when the value is fine. */
  validate?: (value: string) => string | null;
};
type PromptPending = PromptOptions & { resolve: (value: string | null) => void };

function PromptDialog({
  title,
  body,
  label,
  placeholder,
  initial = "",
  confirmLabel = "OK",
  validate,
  resolve,
}: PromptPending) {
  const [value, setValue] = useState(initial);
  const [err, setErr] = useState("");
  const preferences = useRuntimePrefs();
  const insets = useSafeAreaInsets();

  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const scale = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    if (preferences.reduceMotion) {
      scrimOpacity.setValue(1);
      translateY.setValue(0);
      scale.setValue(1);
      return;
    }
    Animated.parallel([
      Animated.timing(scrimOpacity, { toValue: 1, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [preferences.reduceMotion, scale, scrimOpacity, translateY]);

  function submit() {
    const v = value.trim();
    const problem = validate?.(v) ?? (v ? null : "Please enter a value.");
    if (problem) return setErr(problem);
    resolve(v);
  }

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={() => resolve(null)}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: scrimOpacity }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            style={StyleSheet.absoluteFill}
            onPress={() => resolve(null)}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            { marginBottom: Math.max(insets.bottom, 16) },
            { transform: [{ translateY }, { scale }] },
          ]}
        >
          <AppText variant="heading" style={styles.titleText}>
            {title}
          </AppText>

          {body ? (
            typeof body === "string" ? (
              <AppText variant="body" color={Palette.fgMuted} style={styles.bodyText}>
                {body}
              </AppText>
            ) : (
              body
            )
          ) : null}

          <View style={styles.fieldContainer}>
            <AppText variant="small" style={styles.fieldLabel}>
              {label}
            </AppText>
            <TextInput
              autoFocus
              value={value}
              onChangeText={(text) => {
                setValue(text);
                setErr("");
              }}
              placeholder={placeholder}
              placeholderTextColor={Palette.fgFaint}
              style={[styles.input, err ? styles.inputError : null]}
              returnKeyType="done"
              onSubmitEditing={submit}
            />
            {err ? (
              <AppText variant="small" color={Palette.clayFg} style={styles.errorText}>
                {err}
              </AppText>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Button title="Cancel" kind="secondary" onPress={() => resolve(null)} style={styles.btn} />
            <Button title={confirmLabel} kind="primary" onPress={submit} style={styles.btn} />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** `const { prompt, dialog } = usePrompt()` — render {dialog} once, then `const v = await prompt({...})` (null if cancelled). */
export function usePrompt() {
  const [pending, setPending] = useState<PromptPending | null>(null);

  const prompt = useCallback(
    (opts: PromptOptions) =>
      new Promise<string | null>((resolve) => setPending({ ...opts, resolve })),
    [],
  );

  const settle = useCallback((v: string | null) => {
    setPending((p) => {
      p?.resolve(v);
      return null;
    });
  }, []);

  const dialog = pending ? <PromptDialog {...pending} resolve={settle} /> : null;

  return { prompt, dialog };
}

// ---------- styles ----------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  scrim: { backgroundColor: Palette.scrimLight },

  // Web .cd: surface, r4 radius, inset 1px ring, --e4 deep shadow, 24px padding.
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: Palette.surface,
    borderRadius: Radius.r4,
    padding: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: Palette.line,
    ...Shadow.e2,
  },

  // Web .cd-ico: 48×48 squircle with tint bg+fg.
  badge: {
    width: 48,
    height: 48,
    borderRadius: Radius.r3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  badgeWarning: { backgroundColor: Tints.amber.bg },
  badgeDanger: { backgroundColor: Tints.clay.bg },

  titleText: { marginTop: 0 },
  bodyText: { fontSize: 14.5, lineHeight: 21 },

  fieldContainer: {
    gap: 6,
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 13,
    ...Font.sansMedium,
    color: Palette.fgMuted,
  },
  input: {
    height: 48,
    paddingHorizontal: 18,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.lineStrong,
    fontSize: 16,
    color: Palette.fg,
    ...Font.sans,
  },
  inputError: {
    borderColor: Palette.clayFg,
  },
  errorText: {
    marginTop: 2,
  },

  // Full-width stacked for mobile thumb reach (column-reverse = confirm on top, matching destructive-last convention).
  actions: { flexDirection: "column-reverse", gap: 10, marginTop: 8 },
  btn: { alignSelf: "stretch" },
});
