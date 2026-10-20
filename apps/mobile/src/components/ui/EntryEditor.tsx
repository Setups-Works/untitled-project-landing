import { appLinkShortcuts, isLinkAddress, linkMarkdown } from "@untitled/logic";
import type { Tone } from "@untitled/types";
import { useRef, useState, type ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, Pattern, Rect } from "react-native-svg";

import { prefixLines, wrapSelection, type Edit, type Selection } from "@/features/journal/format";
import type { PendingFile } from "@/features/chat/files";
import { AppText } from "./AppText";
import { Banner } from "./Banner";
import { Button } from "./Button";
import { FilePreviewList } from "./FilePreviewList";
import { Icon, type IconName } from "./Icon";
import { RecordButton } from "./RecordButton";
import { Sheet } from "./Sheet";
import { TextField } from "./TextField";
import { Font, Palette, Radius, Space, Tints } from "@/constants/theme";
import { isoDate } from "@/lib/dates";

const DOT_GAP = 21;
const DEFAULT_MAX_LENGTH = 50_000;

type Tool = {
  icon: IconName;
  label: string;
  run: (text: string, sel: Selection) => Edit;
  /** Opens the Add link sheet instead of editing the text directly. */ opensLink?: boolean;
};
const noEdit = (text: string, selection: Selection): Edit => ({ text, selection });
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
  [{ icon: "link", label: "Link", run: noEdit, opensLink: true }],
];

type Props = {
  /** Draws the page inside the current screen instead of in its own modal (for a route that is already a sheet or page). */
  embedded?: boolean;
  visible?: boolean;
  /** The small line at the top: "Today · Saturday, Oct 17", "New note", "Editing · …". */
  label: string;
  draft: string;
  onDraft: (text: string) => void;
  /** A title above the text (notes). Leave out for entries, which have none. */
  title?: { value: string; onChange: (text: string) => void; placeholder?: string; maxLength?: number };
  /** Tints the paper with a note colour. */
  tone?: Tone | null;
  inputLabel?: string;
  placeholder?: string;
  maxLength?: number;
  /** Anything that belongs under the title: colour, category, existing attachments… */
  options?: ReactNode;
  /** Adds a "more" button at the end of the formatting row; the screen shows its own sheet. */
  onMore?: () => void;
  /** Sheets and dialogs the screen opens from here must render inside this page, so they sit on top of it. */
  children?: ReactNode;
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
  saveLabel?: string;
  error: string;
  onSave: () => void;
  onClose: () => void;
};

/**
 * The one writing page of the app: dotted paper, an optional title, record / photos / attach beside Save, and a formatting row above
 * the keyboard. Journal entries, shared-journal entries and notes all open in it, so writing feels the same everywhere.
 */
export function EntryEditor(p: Props) {
  const [sel, setSel] = useState<Selection>({ start: 0, end: 0 });
  const history = useRef<string[]>([]);

  function apply(tool: Tool) {
    if (tool.opensLink) return openLink();
    const edit = tool.run(p.draft, sel);
    history.current.push(p.draft);
    p.onDraft(edit.text);
    setSel(edit.selection);
  }

  // Add link: the words to show (from the selection) and the address, with ready-made links to the app's own pages.
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  function openLink() {
    setLinkText(p.draft.slice(sel.start, sel.end));
    setLinkUrl("");
    setLinkOpen(true);
  }

  function addLink() {
    const markdown = linkMarkdown(linkText, linkUrl);
    history.current.push(p.draft);
    p.onDraft(p.draft.slice(0, sel.start) + markdown + p.draft.slice(sel.end));
    const caret = sel.start + markdown.length;
    setSel({ start: caret, end: caret });
    setLinkOpen(false);
  }

  function undo() {
    const last = history.current.pop();
    if (last !== undefined) p.onDraft(last);
  }

  const tint = p.tone ? Tints[p.tone] : null;
  const page = (
    <SafeAreaView style={[styles.root, tint ? { backgroundColor: tint.bg } : null]} edges={p.embedded ? ["top", "bottom"] : ["bottom"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.grabWrap}>
          {/* Embedded in a route that is already a sheet, the system draws the grabber; a second one would double it. */}
          {p.embedded ? null : (
            <Pressable accessibilityRole="button" accessibilityLabel="Close editor" onPress={p.onClose} hitSlop={16} style={styles.grab} />
          )}
          <AppText variant="label">{p.label}</AppText>
        </View>

        {p.title ? (
          <TextInput
            accessibilityLabel="Title"
            value={p.title.value}
            onChangeText={p.title.onChange}
            maxLength={p.title.maxLength ?? 200}
            placeholder={p.title.placeholder ?? "Title"}
            placeholderTextColor={Palette.fgFaint}
            selectionColor={Palette.greenFg}
            returnKeyType="next"
            editable={!p.saving}
            style={styles.title}
          />
        ) : null}
        {p.options ? <View style={styles.options}>{p.options}</View> : null}

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
            accessibilityLabel={p.inputLabel ?? "Entry"}
            value={p.draft}
            onChangeText={p.onDraft}
            selection={sel}
            onSelectionChange={(e) => setSel(e.nativeEvent.selection)}
            multiline
            autoFocus
            maxLength={p.maxLength ?? DEFAULT_MAX_LENGTH}
            placeholder={p.placeholder ?? "Start writing…"}
            placeholderTextColor={Palette.fgFaint}
            selectionColor={Palette.greenFg}
            textAlignVertical="top"
            editable={!p.saving}
            style={styles.input}
          />
        </View>

        {p.recording ? (
          <AppText variant="small" color={Palette.rec} style={styles.note}>
            Stop recording to attach the audio.
          </AppText>
        ) : null}
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
          <Button title={p.saveLabel ?? "Save"} loading={p.saving} disabled={!p.canSave} onPress={p.onSave} style={styles.save} />
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
                <Pressable
                  key={tool.label}
                  accessibilityRole="button"
                  accessibilityLabel={tool.label}
                  onPress={() => apply(tool)}
                  style={styles.tool}
                >
                  <Icon name={tool.icon} size={16} color={Palette.fgMuted} />
                </Pressable>
              ))}
            </View>
          ))}
          <View style={styles.group}>
            <Pressable accessibilityRole="button" accessibilityLabel="Undo formatting" onPress={undo} style={styles.tool}>
              <Icon name="rotate-left" size={16} color={Palette.fgMuted} />
            </Pressable>
            {p.onMore ? (
              <Pressable accessibilityRole="button" accessibilityLabel="More options" onPress={p.onMore} style={styles.tool}>
                <Icon name="ellipsis-vertical" size={16} color={Palette.fgMuted} />
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {p.children}
      <Sheet visible={linkOpen} onClose={() => setLinkOpen(false)} title="Add a link">
        <TextField label="Link text" value={linkText} onChangeText={setLinkText} placeholder="What to show" />
        <TextField
          label="Address"
          value={linkUrl}
          onChangeText={setLinkUrl}
          placeholder="https://example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          error={linkUrl && !isLinkAddress(linkUrl) ? "Use a web address that starts with https://, or one of the shortcuts below." : null}
        />
        <AppText variant="label">LINK TO THIS APP</AppText>
        <View style={styles.shortcuts}>
          {appLinkShortcuts(isoDate()).map((shortcut) => (
            <Button
              key={shortcut.label}
              title={shortcut.label}
              kind="secondary"
              onPress={() => {
                setLinkUrl(shortcut.href);
                if (!linkText.trim()) setLinkText(shortcut.label);
              }}
              style={styles.shortcut}
            />
          ))}
        </View>
        <Button title="Add link" disabled={!isLinkAddress(linkUrl)} onPress={addLink} />
      </Sheet>
    </SafeAreaView>
  );

  if (p.embedded) return page;
  return (
    <Modal visible={p.visible ?? false} animationType="slide" presentationStyle="pageSheet" onRequestClose={p.onClose}>
      <SafeAreaProvider>{page}</SafeAreaProvider>
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
  grabWrap: { alignItems: "center", gap: Space.sm, paddingTop: Space.lg, paddingBottom: Space.md, flexShrink: 0 },
  grab: { width: 44, height: 5, borderRadius: 2.5, backgroundColor: Palette.fg },
  title: {
    ...Font.serif,
    fontSize: 30,
    lineHeight: 36,
    color: Palette.fg,
    paddingHorizontal: Space.xl,
    paddingTop: Space.xs,
    paddingBottom: Space.sm,
    flexShrink: 0,
  },
  options: { paddingHorizontal: Space.xl, paddingBottom: Space.md, gap: Space.sm, flexShrink: 0 },
  shortcuts: { flexDirection: "row", gap: Space.sm },
  shortcut: { flex: 1 },
  paper: { flex: 1 },
  input: { flex: 1, ...Font.serif, fontSize: 22, lineHeight: 30, color: Palette.fg, paddingHorizontal: Space.xl, paddingTop: Space.sm },
  note: { paddingHorizontal: Space.lg, paddingVertical: Space.sm },
  // Capped so a few attachments never push the writing area away; more than that scroll.
  attachments: { flexGrow: 0, maxHeight: 220 },
  attachmentsContent: { paddingHorizontal: Space.lg, paddingVertical: Space.sm },
  actions: { flexDirection: "row", alignItems: "center", gap: Space.md, paddingHorizontal: Space.lg, paddingVertical: Space.md },
  round: {
    width: ROUND,
    height: ROUND,
    borderRadius: ROUND / 2,
    borderWidth: 1,
    borderColor: Palette.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.glassHi,
  },
  save: { minWidth: 112 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: Palette.lineStrong, marginHorizontal: Space.lg },
  toolbar: { gap: Space.md, paddingHorizontal: Space.lg, paddingVertical: Space.md },
  group: { flexDirection: "row", gap: Space.xs, backgroundColor: Palette.surfaceSunken, borderRadius: Radius.r3, padding: Space.xs },
  tool: { width: 48, height: 48, borderRadius: Radius.r2, alignItems: "center", justifyContent: "center" },
});
