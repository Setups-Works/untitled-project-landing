import { useRef, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, Pattern, Rect } from "react-native-svg";

import { insertLink, prefixLines, wrapSelection, type Edit, type Selection } from "./format";
import type { PendingFile } from "@/features/chat/files";
import { AppText } from "@/components/ui/AppText";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { FilePreviewList } from "@/components/ui/FilePreviewList";
import { Icon, type IconName } from "@/components/ui/Icon";
import { RecordButton } from "@/components/ui/RecordButton";
import { Font, Palette, Radius, Space } from "@/constants/theme";

const DOT_GAP = 21;
const MAX_LENGTH = 50_000;

type Tool = { icon: IconName; label: string; run: (text: string, sel: Selection) => Edit };
/** Groups of formatting buttons. Only syntax the app's Markdown dialect can draw. */
const TOOLS: Tool[][] = [
  [
    { icon: "bold", label: "Bold", run: (t, s) => wrapSelection(t, s, "**") },
    { icon: "code", label: "Code", run: (t, s) => wrapSelection(t, s, "`") },
    { icon: "heading", label: "Heading", run: (t, s) => prefixLines(t, s, "## ") },
    { icon: "quote-left", label: "Quote", run: (t, s) => prefixLines(t, s, "> ") },
  ],
  [
    { icon: "list-ul", label: "Bulleted list", run: (t, s) => prefixLines(t, s, "- ") },
    { icon: "square-check", label: "Checklist", run: (t, s) => prefixLines(t, s, "- [ ] ") },
  ],
  [{ icon: "link", label: "Link", run: insertLink }],
];

type Props = {
  visible: boolean;
  /** "Today · Saturday, Oct 17": which day the entry will be written on. */
  dayLabel: string;
  draft: string;
  onDraft: (text: string) => void;
  /** Everything about files and voice is optional: leave it out (editing an existing entry) and those buttons are not shown. */
  files?: PendingFile[];
  onRemoveFile?: (index: number) => void;
  recording?: boolean;
  recordingSecs?: number;
  onToggleRecording?: () => void;
  onPickImages?: () => void;
  onPickFiles?: () => void;
  canSave: boolean;
  saving: boolean;
  error: string;
  onSave: () => void;
  onClose: () => void;
};

/** Full-screen writing page: dotted paper, record / photos / attach beside Save, and a formatting row above the keyboard. */
export function EntryEditor(p: Props) {
  const [sel, setSel] = useState<Selection>({ start: 0, end: 0 });
  const history = useRef<string[]>([]);

  function apply(tool: Tool) {
    const edit = tool.run(p.draft, sel);
    history.current.push(p.draft);
    p.onDraft(edit.text);
    setSel(edit.selection);
  }

  function undo() {
    const last = history.current.pop();
    if (last !== undefined) p.onDraft(last);
  }

  return (
    <Modal visible={p.visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={p.onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.root} edges={["bottom"]}>
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={styles.grabWrap}>
              <Pressable accessibilityRole="button" accessibilityLabel="Close editor" onPress={p.onClose} hitSlop={16} style={styles.grab} />
              <AppText variant="label">{p.dayLabel}</AppText>
            </View>

            <View style={styles.paper}>
              <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                <Defs>
                  <Pattern id="dots" width={DOT_GAP} height={DOT_GAP} patternUnits="userSpaceOnUse">
                    <Circle cx={DOT_GAP / 2} cy={DOT_GAP / 2} r={1.1} fill={Palette.lineStrong} />
                  </Pattern>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#dots)" />
              </Svg>
              <TextInput
                accessibilityLabel="Journal entry"
                value={p.draft}
                onChangeText={p.onDraft}
                selection={sel}
                onSelectionChange={(e) => setSel(e.nativeEvent.selection)}
                multiline
                autoFocus
                maxLength={MAX_LENGTH}
                placeholder="Start writing…"
                placeholderTextColor={Palette.fgFaint}
                selectionColor={Palette.greenFg}
                textAlignVertical="top"
                editable={!p.saving}
                style={styles.input}
              />
            </View>

            {p.recording ? <AppText variant="small" color={Palette.rec} style={styles.note}>Stop recording to attach the audio.</AppText> : null}
            {p.files?.length && p.onRemoveFile ? (
              <ScrollView style={styles.attachments} contentContainerStyle={styles.attachmentsContent} keyboardShouldPersistTaps="handled">
                <FilePreviewList files={p.files} onRemove={p.onRemoveFile} />
              </ScrollView>
            ) : null}
            {p.error ? (
              <View style={styles.note}>
                <Banner kind="error">{p.error}</Banner>
              </View>
            ) : null}

            <View style={styles.actions}>
              {p.onToggleRecording ? (
                <RecordButton recording={!!p.recording} secs={p.recordingSecs ?? 0} onToggle={p.onToggleRecording} idleStyle={styles.round} />
              ) : null}
              {p.onPickImages ? <RoundButton icon="image" label="Add photos" onPress={p.onPickImages} /> : null}
              {p.onPickFiles ? <RoundButton icon="paperclip" label="Attach files" onPress={p.onPickFiles} /> : null}
              <View style={styles.flex} />
              <Button title="Save" loading={p.saving} disabled={!p.canSave} onPress={p.onSave} style={styles.save} />
            </View>

            <View style={styles.rule} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              style={styles.row}
              contentContainerStyle={styles.toolbar}
            >
              {TOOLS.map((group, g) => (
                <View key={g} style={styles.group}>
                  {group.map((tool) => (
                    <Pressable key={tool.label} accessibilityRole="button" accessibilityLabel={tool.label} onPress={() => apply(tool)} style={styles.tool}>
                      <Icon name={tool.icon} size={16} color={Palette.fgMuted} />
                    </Pressable>
                  ))}
                </View>
              ))}
              <View style={styles.group}>
                <Pressable accessibilityRole="button" accessibilityLabel="Undo formatting" onPress={undo} style={styles.tool}>
                  <Icon name="rotate-left" size={16} color={Palette.fgMuted} />
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

function RoundButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.round}>
      <Icon name={icon} size={17} color={Palette.fg} />
    </Pressable>
  );
}

// Round buttons use an exact half-size radius: Android draws a filled background square when the radius is far larger than the view.
const ROUND = 52;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // A horizontal ScrollView grows to fill a column by default; these rows must stay as tall as their content.
  row: { flexGrow: 0 },
  root: { flex: 1, backgroundColor: Palette.page },
  grabWrap: { alignItems: "center", gap: Space.sm, paddingTop: Space.sm, paddingBottom: Space.md },
  grab: { width: 44, height: 5, borderRadius: 2.5, backgroundColor: Palette.fg },
  paper: { flex: 1 },
  input: { flex: 1, ...Font.serif, fontSize: 22, lineHeight: 30, color: Palette.fg, paddingHorizontal: Space.xl, paddingTop: Space.sm },
  note: { paddingHorizontal: Space.lg, paddingVertical: Space.sm },
  // Capped so a few attachments never push the writing area away; more than that scroll.
  attachments: { flexGrow: 0, maxHeight: 220 },
  attachmentsContent: { paddingHorizontal: Space.lg, paddingVertical: Space.sm },
  actions: { flexDirection: "row", alignItems: "center", gap: Space.md, paddingHorizontal: Space.lg, paddingVertical: Space.md },
  round: { width: ROUND, height: ROUND, borderRadius: ROUND / 2, borderWidth: 1, borderColor: Palette.line, alignItems: "center", justifyContent: "center", backgroundColor: Palette.glassHi },
  save: { minWidth: 112 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: Palette.lineStrong, marginHorizontal: Space.lg },
  toolbar: { gap: Space.md, paddingHorizontal: Space.lg, paddingVertical: Space.md },
  group: { flexDirection: "row", gap: Space.xs, backgroundColor: Palette.surfaceSunken, borderRadius: Radius.r3, padding: Space.xs },
  tool: { width: 48, height: 48, borderRadius: Radius.r2, alignItems: "center", justifyContent: "center" },
});
