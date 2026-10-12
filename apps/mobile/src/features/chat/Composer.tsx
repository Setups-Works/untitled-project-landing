import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { pickFiles, type PendingFile } from "./files";
import type { AiProvider } from "./types";
import { useRecorder } from "./useRecorder";
import { AppText } from "@/components/ui/AppText";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { Font, Palette, Radius } from "@/constants/theme";

type Props = {
  busy: boolean;
  /** Every AI choice (the server decides which are available). */
  providers: AiProvider[];
  /** Id of the selected provider. */
  provider: string;
  onProvider: (id: string) => void;
  /** Send the message. Call `saved()` as soon as it is stored so the box can be emptied; resolve false if sending failed. */
  onSend: (text: string, files: PendingFile[], saved: () => void) => Promise<boolean>;
  onError: (message: string) => void;
  /** Extra space under the card (the iOS tab bar floats over this screen). */
  bottomInset: number;
};

/** The chat composer, laid out like the web's: input on top; attach, AI picker, voice and send underneath. */
export function Composer({ busy, providers, provider, onProvider, onSend, onError, bottomInset }: Props) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [menu, setMenu] = useState(false);
  const rec = useRecorder((f) => setFiles((x) => [...x, f]), onError);
  const current = providers.find((p) => p.id === provider) ?? providers[0];
  const canSend = (text.trim().length > 0 || files.length > 0) && !busy;

  async function attach() {
    try {
      const { files: picked, tooBig } = await pickFiles();
      if (tooBig) onError("Files can be up to 10 MB.");
      if (picked.length) setFiles((x) => [...x, ...picked]);
    } catch {
      onError("Couldn’t open your files.");
    }
  }

  function saved() {
    setText("");
    setFiles([]);
  }

  async function submit() {
    if (!canSend) return;
    const ok = await onSend(text.trim(), files, saved);
    if (ok) saved();
  }

  return (
    <View style={[styles.wrap, { paddingBottom: bottomInset }]}>
      <GlassSurface tone="violet" style={styles.card}>
        {files.length ? (
          <View style={styles.files}>
            {files.map((f, i) => (
              <View key={`${f.uri}-${i}`} style={styles.file}>
                <Icon
                  name={f.type.startsWith("audio/") ? "microphone" : f.type.startsWith("image/") ? "image" : "paperclip"}
                  size={12}
                  color={Palette.greenFg}
                />
                <AppText variant="small" color={Palette.fg} numberOfLines={1} style={styles.fileName}>
                  {f.name}
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${f.name}`}
                  hitSlop={8}
                  onPress={() => setFiles((x) => x.filter((_, j) => j !== i))}
                >
                  <Icon name="xmark" size={12} color={Palette.fgSubtle} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <TextInput
          accessibilityLabel="Message"
          value={text}
          onChangeText={setText}
          placeholder="Ask anything…"
          placeholderTextColor={Palette.fgFaint}
          selectionColor={Palette.greenFg}
          multiline
          maxLength={20000}
          style={styles.input}
        />

        <View style={styles.bar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Attach files"
            hitSlop={8}
            onPress={() => void attach()}
            style={styles.iconBtn}
          >
            <Icon name="paperclip" size={18} color={Palette.fgMuted} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Choose AI. Current: ${current?.label}`}
            onPress={() => setMenu(true)}
            style={styles.model}
          >
            <AppText variant="bodyStrong" color={Palette.fgMuted}>
              {current?.label}
            </AppText>
            <Icon name="chevron-down" size={11} color={Palette.fgMuted} />
          </Pressable>

          <View style={styles.spacer} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={rec.recording ? "Stop recording" : "Record a voice note"}
            hitSlop={8}
            onPress={() => void rec.toggle()}
            style={[styles.iconBtn, rec.recording ? styles.recording : null]}
          >
            <Icon name={rec.recording ? "stop" : "microphone"} size={17} color={rec.recording ? Palette.rec : Palette.fgMuted} />
          </Pressable>
          {rec.recording ? (
            <AppText variant="small" color={Palette.rec}>
              {Math.floor(rec.secs / 60)}:{String(rec.secs % 60).padStart(2, "0")}
            </AppText>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !canSend }}
            disabled={!canSend}
            onPress={() => void submit()}
            style={[styles.send, canSend ? styles.sendOn : null]}
          >
            <Icon name="arrow-up" size={18} color={canSend ? Palette.onDark : Palette.fgFaint} />
          </Pressable>
        </View>
      </GlassSurface>

      <Sheet visible={menu} onClose={() => setMenu(false)} title="AI">
        {providers.map((p) => {
          const on = p.id === provider;
          return (
            <Pressable
              key={p.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: on, disabled: !p.available }}
              disabled={!p.available}
              onPress={() => {
                onProvider(p.id);
                setMenu(false);
              }}
              style={[styles.option, on ? { backgroundColor: Palette.greenBg } : null, { opacity: p.available ? 1 : 0.5 }]}
            >
              <View style={styles.optionText}>
                <AppText variant="bodyStrong">{p.label}</AppText>
                <AppText variant="small">{p.available ? p.note : "Not connected yet"}</AppText>
              </View>
              {on ? <Icon name="check" size={14} color={Palette.greenFg} /> : null}
            </Pressable>
          );
        })}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingTop: 8 },
  card: {
    borderRadius: Radius.r4,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
  },
  input: {
    ...Font.sans,
    fontSize: 17,
    lineHeight: 24,
    color: Palette.fg,
    minHeight: 28,
    maxHeight: 160,
    paddingVertical: 4,
    paddingHorizontal: 0,
    textAlignVertical: "top",
  },
  bar: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: Radius.pill, alignItems: "center", justifyContent: "center" },
  recording: { backgroundColor: Palette.clayBg },
  model: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 38, paddingHorizontal: 10 },
  spacer: { flex: 1 },
  send: {
    width: 46,
    height: 46,
    borderRadius: Radius.pill,
    backgroundColor: Palette.glassHi,
    alignItems: "center",
    justifyContent: "center",
  },
  sendOn: { backgroundColor: Palette.fillDark },
  files: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  file: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "100%",
    paddingHorizontal: 10,
    minHeight: 32,
    borderRadius: Radius.pill,
    backgroundColor: Palette.greenBg,
  },
  fileName: { flexShrink: 1 },
  option: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingHorizontal: 14, borderRadius: Radius.r2 },
  optionText: { flex: 1, gap: 2 },
});
