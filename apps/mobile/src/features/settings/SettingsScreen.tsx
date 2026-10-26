import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { giftShareText } from "@untitled/logic";
import { Pressable, ScrollView, Share, StyleSheet, Switch, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DeleteSheet } from "@/components/ui/DeleteSheet";
import { GiftCard, captureGiftCard } from "@/components/ui/GiftCard";
import { Icon } from "@/components/ui/Icon";
import { Screen } from "@/components/ui/Screen";
import { Sheet } from "@/components/ui/Sheet";
import { TextField } from "@/components/ui/TextField";
import { Palette, Radius, Tints } from "@/constants/theme";
import { mobileEnv } from "@/config/env";
import { dbQuery } from "@/features/chat/db";
import { BillingSection } from "@/features/billing/BillingSection";
import { useAccountSettings } from "./queries";
import { SETTINGS_SECTIONS, type SettingsPrefs, type SettingsSection } from "./types";
import { useUpdate } from "@/features/updates/UpdateProvider";
import { useAppState, useAuth } from "@/providers/AppState";
import { shareImageWithText } from "@/lib/shareImage";
import { createUploadId } from "@/lib/uploadId";
import { api, errorMessage } from "@/lib/api";
import { NOTE_CATEGORIES } from "@/lib/preferences";

type Notice = { kind: "success" | "error" | "info"; text: string } | null;
type TableRow = Record<string, unknown>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const csvCell = (value: unknown) => {
  let text = Array.isArray(value) ? value.join("; ") : String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export function SettingsScreen() {
  const { user, signOut, preferences: prefs, setPreferences } = useAppState();
  const auth = useAuth();
  const settingsQ = useAccountSettings();
  const update = useUpdate();
  const [section, setSection] = useState<SettingsSection>("profile");
  const [busy, setBusy] = useState("");
  const giftRef = useRef<View>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const account = settingsQ.data;
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [usernameDraft, setUsernameDraft] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [avatarDraft, setAvatarDraft] = useState<string | null | undefined>(undefined);
  const [avatarCookie, setAvatarCookie] = useState<string | null>(null);
  const name = nameDraft ?? account?.name ?? user?.name ?? "";
  const username = usernameDraft ?? account?.displayUsername ?? account?.username ?? user?.username ?? "";
  const email = emailDraft ?? account?.email ?? user?.email ?? "";
  const avatar = avatarDraft !== undefined ? avatarDraft : account?.image ?? user?.image ?? null;
  const [prefSaving, setPrefSaving] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [dangerReview, setDangerReview] = useState<{ action: "reset-workspace" | "delete-account"; confirmation: string } | null>(null);
  const [globalSignOutReview, setGlobalSignOutReview] = useState(false);
  const [choice, setChoice] = useState<"timeFormat" | "defaultCategory" | "weekStart" | "todoView" | null>(null);

  useEffect(() => {
    let active = true;
    void auth.getCookie().then((cookie) => {
      if (active) setAvatarCookie(cookie);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [auth, user?.id]);

  const createdLabel = account?.createdAt ? new Date(account.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "—";

  async function perform(key: string, action: () => Promise<void>) {
    setBusy(key);
    setNotice(null);
    try {
      await action();
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error) });
    } finally {
      setBusy("");
    }
  }

  async function savePreferences(patch: Partial<SettingsPrefs>) {
    if (!user) return;
    const next = { ...prefs, ...patch };
    setPreferences(next);
    setPrefSaving(true);
    setNotice(null);
    try {
      const result = await dbQuery<{ user_id: string }[]>({
        table: "profiles",
        op: "update",
        values: { preferences: next },
        filters: [{ column: "user_id", op: "eq", value: user.id }],
        returning: "user_id",
      });
      if (!result?.length) throw new Error("Couldn’t save that preference.");
      setNotice({ kind: "success", text: "Preference saved." });
      await settingsQ.refetch();
    } catch {
      setPreferences(prefs);
      setNotice({ kind: "error", text: "Couldn’t save that preference." });
    } finally {
      setPrefSaving(false);
    }
  }

  /** Shares the card as an image with a short message (react-native-share sends both on iOS and Android). */
  async function shareGift() {
    const card = giftRef.current;
    if (!card) return;
    setBusy("gift");
    try {
      const imageUri = await captureGiftCard(card);
      const { textShared } = await shareImageWithText({
        title: "Welcome to untitled project",
        message: giftShareText(name || email, mobileEnv.apiBaseUrl),
        imageUri,
      });
      if (!textShared) setNotice({ kind: "info", text: "The card image was shared. Adding the message too needs the installed app build, not Expo Go." });
    } catch (e) {
      setNotice({ kind: "error", text: errorMessage(e) });
    } finally {
      setBusy("");
    }
  }

  async function saveName() {
    const value = name.trim();
    if (!value) return setNotice({ kind: "error", text: "Please enter your name." });
    await perform("name", async () => {
      const { error } = await auth.updateUser({ name: value });
      if (error) throw new Error(error.message || "Couldn’t update your name.");
      setNotice({ kind: "success", text: "Name updated." });
      await settingsQ.refetch();
    });
  }

  async function saveUsername() {
    const value = username.trim();
    if (!/^[A-Za-z0-9_.]{3,30}$/.test(value)) return setNotice({ kind: "error", text: "Use 3–30 letters, numbers, dots or underscores." });
    await perform("username", async () => {
      const { error } = await auth.updateUser({ username: value, displayUsername: value });
      if (error) throw new Error(error.message || "Couldn’t update your username.");
      setNotice({ kind: "success", text: "Username updated." });
      await settingsQ.refetch();
    });
  }

  async function saveEmail() {
    const value = email.trim().toLowerCase();
    if (!emailPattern.test(value)) return setNotice({ kind: "error", text: "Please enter a valid email address." });
    if (value === (account?.email ?? user?.email ?? "").toLowerCase()) return setNotice({ kind: "error", text: "That’s already your email." });
    await perform("email", async () => {
      const { error } = await auth.changeEmail({ newEmail: value, callbackURL: `${mobileEnv.apiBaseUrl}/dashboard` });
      if (error) throw new Error(error.message || "Couldn’t change your email.");
      setNotice({ kind: "info", text: "Check your inbox to confirm the email change. Your current email stays active until then." });
    });
  }

  function objectPathFromAvatar(url: string | null) {
    const marker = "/api/v1/storage/o/avatars/";
    const tail = url?.split(marker)[1]?.split("?")[0];
    return tail ? tail.split("/").map(decodeURIComponent).join("/") : null;
  }

  async function deleteAvatarObject(url: string | null) {
    const path = objectPathFromAvatar(url);
    if (!path || !mobileEnv.apiBaseUrl) return;
    const cookie = await auth.getCookie();
    await fetch(`${mobileEnv.apiBaseUrl}/api/v1/storage/o/avatars/${path.split("/").map(encodeURIComponent).join("/")}`, {
      method: "DELETE",
      headers: cookie ? { Cookie: cookie } : {},
      credentials: "omit",
    });
  }

  async function pickAvatar() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["image/png", "image/jpeg", "image/webp", "image/gif"], copyToCacheDirectory: true });
      if (result.canceled) return;
      const file = result.assets[0];
      if (!file) return;
      const type = (file.mimeType ?? "").toLowerCase();
      if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(type)) return setNotice({ kind: "error", text: "Choose a PNG, JPG, WebP or GIF image." });
      if ((file.size ?? 0) > 2 * 1024 * 1024) return setNotice({ kind: "error", text: "Pictures can be up to 2 MB." });
      await perform("avatar", async () => {
        const extension = type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
        const path = `${user?.id}/avatar-${createUploadId()}.${extension}`;
        const body = await (await fetch(file.uri)).blob();
        const cookie = await auth.getCookie();
        const response = await fetch(`${mobileEnv.apiBaseUrl}/api/v1/storage/o/avatars/${path.split("/").map(encodeURIComponent).join("/")}`, {
          method: "PUT",
          headers: { "content-type": type, ...(cookie ? { Cookie: cookie } : {}) },
          credentials: "omit",
          body,
        });
        if (!response.ok) throw new Error("Couldn’t upload that picture.");
        const url = `${mobileEnv.apiBaseUrl}/api/v1/storage/o/avatars/${path.split("/").map(encodeURIComponent).join("/")}`;
        const { error } = await auth.updateUser({ image: url });
        if (error) throw new Error(error.message || "Couldn’t update your picture.");
        await deleteAvatarObject(avatar);
        setAvatarDraft(url);
        setNotice({ kind: "success", text: "Profile picture updated." });
        await settingsQ.refetch();
      });
    } catch {
      setNotice({ kind: "error", text: "Couldn’t open that picture." });
    }
  }

  async function removeAvatar() {
    await perform("avatar", async () => {
      const { error } = await auth.updateUser({ image: null });
      if (error) throw new Error(error.message || "Couldn’t remove your picture.");
      await deleteAvatarObject(avatar);
      setAvatarDraft(null);
      setNotice({ kind: "success", text: "Profile picture removed." });
      await settingsQ.refetch();
    });
  }

  async function updatePassword() {
    if (!oldPassword) return setNotice({ kind: "error", text: "Enter your current password." });
    if (newPassword.length < 8) return setNotice({ kind: "error", text: "Your password needs at least 8 characters." });
    if (newPassword !== confirmPassword) return setNotice({ kind: "error", text: "The two passwords don’t match." });
    await perform("password", async () => {
      const { error } = await auth.changePassword({ currentPassword: oldPassword, newPassword, revokeOtherSessions: true });
      if (error) throw new Error(/invalid/i.test(error.message ?? "") ? "Your current password isn’t right." : error.message || "Couldn’t update your password.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice({ kind: "success", text: "Password updated." });
    });
  }

  async function signOutOthers() {
    await perform("others", async () => {
      const { error } = await auth.revokeOtherSessions();
      if (error) throw new Error(error.message || "Couldn’t sign out other devices.");
      setNotice({ kind: "success", text: "Signed out of all your other devices." });
    });
  }

  async function clearJournalDrafts() {
    if (!user) return;
    const keys = await AsyncStorage.getAllKeys();
    const prefix = `journal:`;
    await AsyncStorage.multiRemove(keys.filter((key) => key.startsWith(prefix) && key.includes(`:${user.id}:`)));
  }

  async function signOutEverywhere() {
    await perform("global", async () => {
      const { error } = await auth.revokeSessions();
      if (error) throw new Error(error.message || "Couldn’t sign out all devices.");
      await clearJournalDrafts();
      await signOut();
      router.replace("/(auth)/login");
    });
    setGlobalSignOutReview(false);
  }

  async function fetchAll(table: string): Promise<TableRow[]> {
    const rows: TableRow[] = [];
    for (let offset = 0; ; offset += 5000) {
      const page = await dbQuery<TableRow[]>({ table, op: "select", columns: "*", order: [], range: [offset, offset + 4999] });
      rows.push(...(page ?? []));
      if (!page || page.length < 5000) return rows;
    }
  }

  async function shareExport(title: string, content: string) {
    await Share.share({ title, message: content });
  }

  async function exportEverything() {
    await perform("export", async () => {
      const [tasks, journal, notes, chats, chatMessages] = await Promise.all([
        fetchAll("tasks"), fetchAll("journal_entries"), fetchAll("notes"), fetchAll("chats"), fetchAll("chat_messages"),
      ]);
      const data = { exportedAt: new Date().toISOString(), account: { email: account?.email ?? user?.email, name: account?.name ?? user?.name }, tasks, journal, notes, chats, chatMessages };
      await shareExport(`untitled-project-export-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2));
      setNotice({ kind: "success", text: "Your data is ready to share." });
    });
  }

  async function exportTasksCsv() {
    await perform("csv", async () => {
      const tasks = await fetchAll("tasks");
      const cols = ["title", "description", "priority", "due_date", "done", "cancelled", "archived", "recurrence", "created_at"];
      const text = [cols.join(","), ...tasks.map((row) => cols.map((column) => csvCell(row[column])).join(","))].join("\n");
      await shareExport("tasks.csv", text);
      setNotice({ kind: "success", text: `Ready to share ${tasks.length} tasks as CSV.` });
    });
  }

  async function exportNotesMarkdown() {
    await perform("markdown", async () => {
      const notes = await fetchAll("notes");
      const text = notes.map((note) => `# ${String(note.title || "Untitled")}\n\n_${String(note.category)} · ${new Date(String(note.updated_at)).toLocaleDateString()}_\n\n${String(note.body ?? "")}\n`).join("\n---\n\n");
      await shareExport("notes.md", text || "No notes yet.\n");
      setNotice({ kind: "success", text: `Ready to share ${notes.length} notes as Markdown.` });
    });
  }

  async function runAccountAction(action: "reset-workspace" | "delete-account", confirmation: string) {
    await perform(action, async () => {
      await api.post<{ data: { ok: true } }>("/api/v1/account/actions", { action, confirmation });
      if (action === "reset-workspace") {
        setResetConfirmation("");
        setNotice({ kind: "success", text: "Your workspace is empty again." });
        return;
      }
      await clearJournalDrafts();
      await auth.signOut();
      router.replace("/(auth)/login");
    });
  }

  const sections = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionNav} accessibilityLabel="Settings sections">
      {SETTINGS_SECTIONS.map((item) => (
        <Pressable
          key={item.key}
          accessibilityRole="button"
          accessibilityState={{ selected: section === item.key }}
          onPress={() => { setSection(item.key); setNotice(null); }}
          style={[styles.sectionPill, section === item.key ? styles.sectionPillActive : null]}
        >
          <Icon name={item.icon} size={14} color={section === item.key ? Palette.onDark : item.key === "danger" ? Palette.clayFg : Palette.fgMuted} />
          <AppText variant="small" color={section === item.key ? Palette.onDark : item.key === "danger" ? Palette.clayFg : Palette.fgMuted}>{item.title}</AppText>
        </Pressable>
      ))}
    </ScrollView>
  );

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">Settings</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Close settings" hitSlop={12} onPress={() => router.back()}>
          <AppText variant="bodyStrong" color={Palette.fgMuted}>Close</AppText>
        </Pressable>
      </View>
      {sections}
      {settingsQ.isPending ? <AppText variant="small">Loading account settings…</AppText> : null}
      {settingsQ.isError ? <Banner kind="error">Couldn’t load all account details. You can still update your profile.</Banner> : null}
      {notice ? <Banner kind={notice.kind}>{notice.text}</Banner> : null}

      {section === "profile" ? (
        <Card tone="violet" style={styles.card}>
          <SectionHeading title="Profile" />
          <View style={styles.avatarRow}>
            {avatar ? <Image source={{ uri: avatar, ...(avatarCookie ? { headers: { Cookie: avatarCookie } } : {}) }} contentFit="cover" style={styles.avatar} /> : <View style={styles.avatarFallback}><AppText variant="heading" color={Palette.onDark}>{(name || email || "?")[0]?.toUpperCase()}</AppText></View>}
            <View style={styles.flex}>
              <AppText variant="bodyStrong">Profile picture</AppText>
              <AppText variant="small" color={Palette.fgSubtle}>PNG, JPG, WebP or GIF · up to 2 MB</AppText>
              <View style={styles.buttonRow}>
                <Button title={busy === "avatar" ? "Uploading…" : avatar ? "Change" : "Upload"} kind="secondary" icon="image" disabled={busy === "avatar"} onPress={() => void pickAvatar()} />
                {avatar ? <Button title="Remove" kind="secondary" disabled={busy === "avatar"} onPress={() => void removeAvatar()} /> : null}
              </View>
            </View>
          </View>
          <TextField label="Full name" value={name} onChangeText={setNameDraft} maxLength={80} autoComplete="name" />
          <Button title="Save name" loading={busy === "name"} disabled={!name.trim() || name.trim() === (account?.name ?? user?.name)} onPress={() => void saveName()} />
          <TextField label="Username" value={username} onChangeText={setUsernameDraft} maxLength={30} autoCapitalize="none" autoCorrect={false} placeholder="ada.lovelace" />
          <AppText variant="small" color={Palette.fgSubtle}>Use 3–30 letters, numbers, dots or underscores.</AppText>
          <Button title="Save username" kind="secondary" loading={busy === "username"} onPress={() => void saveUsername()} />
          <TextField label="Email" value={email} onChangeText={setEmailDraft} maxLength={254} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <Button title="Change email" kind="secondary" loading={busy === "email"} onPress={() => void saveEmail()} />
          <AppText variant="small" color={Palette.fgSubtle}>Sign-in method: {(account?.providers ?? []).map(providerName).join(", ") || "—"}</AppText>
          <View style={styles.divider} />
          <AppText variant="bodyStrong">Welcome gift card</AppText>
          <AppText variant="small" color={Palette.fgSubtle}>Your account has been part of your workspace since {createdLabel}.</AppText>
          <GiftCard ref={giftRef} name={name || email || "Your name"} />
          <Button title="Share card" kind="secondary" icon="gift" loading={busy === "gift"} onPress={() => void shareGift()} />
        </Card>
      ) : null}

      {section === "prefs" ? (
        <Card tone="blue" style={styles.card}>
          <SectionHeading title="Preferences" />
          <ChoiceField label="Time format" value={prefs.timeFormat === "12h" ? "12-hour (9:46 pm)" : "24-hour (21:46)"} onPress={() => setChoice("timeFormat")} />
          <ChoiceField label="Default category for new notes" value={prefs.defaultCategory} onPress={() => setChoice("defaultCategory")} />
          <ChoiceField label="Week starts on" value={prefs.weekStart === "mon" ? "Monday" : "Sunday"} onPress={() => setChoice("weekStart")} />
          <ChoiceField label="Open the To-do page on" value={prefs.todoView[0]!.toUpperCase() + prefs.todoView.slice(1)} onPress={() => setChoice("todoView")} />
          {prefSaving ? <AppText variant="small" color={Palette.fgSubtle}>Saving…</AppText> : null}
        </Card>
      ) : null}

      {section === "appearance" ? (
        <Card tone="violet" style={styles.card}>
          <SectionHeading title="Appearance" />
          <AppText variant="bodyStrong">Density</AppText>
          <AppText variant="small" color={Palette.fgSubtle}>Compact fits more tasks, notes and entries on screen.</AppText>
          <View style={styles.segment}>
            {(["comfortable", "compact"] as const).map((density) => (
              <Pressable key={density} accessibilityRole="radio" accessibilityState={{ selected: prefs.density === density }} onPress={() => void savePreferences({ density })} style={[styles.segmentItem, prefs.density === density ? styles.segmentItemActive : null]}>
                <AppText variant="small" color={prefs.density === density ? Palette.fg : Palette.fgMuted}>{density === "comfortable" ? "Comfortable" : "Compact"}</AppText>
              </Pressable>
            ))}
          </View>
          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <AppText variant="bodyStrong">Reduce motion</AppText>
              <AppText variant="small" color={Palette.fgSubtle}>Turns off animations and transitions where supported.</AppText>
            </View>
            <Switch value={prefs.reduceMotion} onValueChange={(reduceMotion) => void savePreferences({ reduceMotion })} trackColor={{ false: Palette.lineStrong, true: Tints.green.fg }} thumbColor={Palette.surface} />
          </View>
        </Card>
      ) : null}

      {section === "billing" ? <BillingSection /> : null}

      {section === "security" ? (
        <Card tone="mint" style={styles.card}>
          <SectionHeading title="Security" />
          {account?.hasPassword ? (
            <>
              <TextField label="Current password" value={oldPassword} onChangeText={setOldPassword} password autoComplete="current-password" />
              <TextField label="New password" value={newPassword} onChangeText={setNewPassword} password autoComplete="new-password" placeholder="At least 8 characters" />
              <TextField label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} password autoComplete="new-password" />
              <Button title="Update password" loading={busy === "password"} disabled={!newPassword} onPress={() => void updatePassword()} />
            </>
          ) : <AppText variant="body" color={Palette.fgMuted}>You sign in with {(account?.providers ?? []).map(providerName).join(", ")}; there’s no password to manage here.</AppText>}
          <View style={styles.divider} />
          <Fact label="Last sign-in" value={account?.lastSignIn ? new Date(account.lastSignIn).toLocaleString() : "—"} />
          <Fact label="Account created" value={createdLabel} />
          <Fact label="Sign-in methods" value={(account?.providers ?? []).map(providerName).join(", ") || "—"} />
          <Button title="Sign out other devices" kind="secondary" loading={busy === "others"} onPress={() => void signOutOthers()} />
          <Button title="Sign out everywhere" kind="secondary" icon="right-from-bracket" loading={busy === "global"} onPress={() => setGlobalSignOutReview(true)} />
        </Card>
      ) : null}

      {section === "data" ? (
        <Card tone="amber" style={styles.card}>
          <SectionHeading title="Your data" />
          <AppText variant="body" color={Palette.fgMuted}>Share everything you’ve saved — tasks, journal, notes and chats — as JSON.</AppText>
          <Button title="Everything (JSON)" kind="secondary" icon="download" loading={busy === "export"} onPress={() => void exportEverything()} />
          <Button title="Tasks (CSV)" kind="secondary" icon="table" loading={busy === "csv"} onPress={() => void exportTasksCsv()} />
          <Button title="Notes (Markdown)" kind="secondary" icon="file-lines" loading={busy === "markdown"} onPress={() => void exportNotesMarkdown()} />
        </Card>
      ) : null}

      {section === "about" ? (
        <Card tone="blue" style={styles.card}>
          <SectionHeading title="About and updates" />
          <Fact label="Version" value={update.version} />
          {update.supported ? (
            <>
              <Button
                title={update.state.phase === "checking" ? "Checking…" : "Check for updates"}
                kind="secondary"
                icon="rotate"
                loading={update.state.phase === "checking"}
                onPress={() => void update.check()}
              />
              {update.state.phase === "upToDate" ? <Banner kind="success">You’re on the latest version.</Banner> : null}
              {update.state.phase === "error" && !update.state.release ? <Banner kind="error">{update.state.message}</Banner> : null}
            </>
          ) : (
            <AppText variant="small" color={Palette.fgSubtle}>Updates for this app come from the store on your phone.</AppText>
          )}
        </Card>
      ) : null}

      {section === "danger" ? (
        <>
          <Card tone="gold" style={styles.card}>
            <SectionHeading title="Reset workspace" />
            <AppText variant="body" color={Palette.fgMuted}>Permanently delete your notes, tasks, lists, journal entries, chats and attached files. Your account stays.</AppText>
            <TextField label="Type reset to confirm" value={resetConfirmation} onChangeText={setResetConfirmation} autoCapitalize="none" autoCorrect={false} />
            <Button title="Delete all my content" kind="danger" icon="broom" loading={busy === "reset-workspace"} disabled={resetConfirmation.trim().toLowerCase() !== "reset"} onPress={() => setDangerReview({ action: "reset-workspace", confirmation: resetConfirmation })} />
          </Card>
          <Card tone="clay" style={styles.card}>
            <SectionHeading title="Delete account" />
            <AppText variant="body" color={Palette.fgMuted}>Permanently delete your account and everything in it. Export your data first if you want a copy.</AppText>
            <TextField label={`Type ${account?.email ?? user?.email ?? "your email"} to confirm`} value={deleteConfirmation} onChangeText={setDeleteConfirmation} autoCapitalize="none" autoCorrect={false} />
            <Button title="Delete my account" kind="danger" icon="trash" loading={busy === "delete-account"} disabled={deleteConfirmation.trim().toLowerCase() !== (account?.email ?? user?.email ?? "").toLowerCase()} onPress={() => setDangerReview({ action: "delete-account", confirmation: deleteConfirmation })} />
          </Card>
        </>
      ) : null}

      <ChoiceSheet
        type={choice}
        onClose={() => setChoice(null)}
        onChoose={(value) => {
          setChoice(null);
          if (choice === "timeFormat") void savePreferences({ timeFormat: value as SettingsPrefs["timeFormat"] });
          if (choice === "defaultCategory") void savePreferences({ defaultCategory: value });
          if (choice === "weekStart") void savePreferences({ weekStart: value as SettingsPrefs["weekStart"] });
          if (choice === "todoView") void savePreferences({ todoView: value as SettingsPrefs["todoView"] });
        }}
      />
      <DeleteSheet
        visible={dangerReview !== null}
        title={dangerReview?.action === "delete-account" ? "Delete your account?" : "Reset your workspace?"}
        message={
          dangerReview?.action === "delete-account"
            ? "Your account and all its content will be permanently deleted. This cannot be undone."
            : "Your notes, tasks, lists, journal entries, chats and attached files will be permanently deleted. Your account stays."
        }
        confirmLabel={dangerReview?.action === "delete-account" ? "Permanently delete account" : "Delete everything"}
        loading={busy === dangerReview?.action}
        onConfirm={() => {
          if (!dangerReview) return;
          const review = dangerReview;
          setDangerReview(null);
          void runAccountAction(review.action, review.confirmation);
        }}
        onClose={() => setDangerReview(null)}
      />
      <Sheet visible={globalSignOutReview} title="Sign out everywhere?" onClose={() => setGlobalSignOutReview(false)}>
        <AppText variant="body" color={Palette.fgMuted}>You’ll be signed out on this device and every other device. You can log back in any time.</AppText>
        <Button title="Sign out everywhere" kind="secondary" loading={busy === "global"} onPress={() => void signOutEverywhere()} />
        <Button title="Cancel" kind="secondary" onPress={() => setGlobalSignOutReview(false)} />
      </Sheet>
    </Screen>
  );
}

function providerName(provider: string) {
  return provider === "email" ? "Email & password" : provider ? provider[0]!.toUpperCase() + provider.slice(1) : "";
}

function SectionHeading({ title }: { title: string }) {
  return <AppText variant="heading" accessibilityRole="header">{title}</AppText>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return <View style={styles.fact}><AppText variant="small" color={Palette.fgSubtle}>{label}</AppText><AppText variant="small" color={Palette.fg} style={styles.factValue}>{value}</AppText></View>;
}

function ChoiceField({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <View style={styles.choiceWrap}>
      <AppText variant="small" color={Palette.fgMuted}>{label}</AppText>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} onPress={onPress} style={styles.choiceButton}>
        <AppText variant="body" style={styles.flex}>{value}</AppText><Icon name="chevron-down" size={14} color={Palette.fgMuted} />
      </Pressable>
    </View>
  );
}

function ChoiceSheet({ type, onClose, onChoose }: { type: "timeFormat" | "defaultCategory" | "weekStart" | "todoView" | null; onClose: () => void; onChoose: (value: string) => void }) {
  const values = type === "timeFormat" ? [["12h", "12-hour (9:46 pm)"], ["24h", "24-hour (21:46)"]] :
    type === "defaultCategory" ? NOTE_CATEGORIES.map((value) => [value, value]) :
      type === "weekStart" ? [["mon", "Monday"], ["sun", "Sunday"]] :
        type === "todoView" ? [["today", "Today"], ["inbox", "Inbox"], ["upcoming", "Upcoming"]] : [];
  return (
    <Sheet visible={type !== null} onClose={onClose} title={type ? { timeFormat: "Time format", defaultCategory: "Default note category", weekStart: "Week starts on", todoView: "To-do start page" }[type] : undefined}>
      {values.map(([value, label]) => (
        <Pressable key={value} accessibilityRole="button" onPress={() => onChoose(value)} style={styles.option}>
          <AppText variant="body">{label}</AppText><Icon name="chevron-right" size={14} color={Palette.fgFaint} />
        </Pressable>
      ))}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionNav: { gap: 8, paddingVertical: 2 },
  sectionPill: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 13, borderRadius: Radius.pill, borderWidth: 1, borderColor: Palette.glassRing, backgroundColor: Palette.glassHi },
  sectionPillActive: { borderColor: Palette.fillDark, backgroundColor: Palette.fillDark },
  card: { gap: 12 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: Radius.pill, backgroundColor: Palette.surfaceSunken },
  avatarFallback: { width: 64, height: 64, borderRadius: Radius.pill, backgroundColor: Palette.fillDark, alignItems: "center", justifyContent: "center" },
  flex: { flex: 1 },
  buttonRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  divider: { height: 1, backgroundColor: Palette.line, marginVertical: 4 },
  segment: { flexDirection: "row", gap: 6, padding: 4, borderRadius: Radius.pill, backgroundColor: Palette.surfaceSunken },
  segmentItem: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 40, borderRadius: Radius.pill },
  segmentItemActive: { backgroundColor: Palette.surface },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 8 },
  fact: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
  factValue: { flexShrink: 1, textAlign: "right" },
  choiceWrap: { gap: 6 },
  choiceButton: { minHeight: 50, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, borderRadius: Radius.r2, borderWidth: 1, borderColor: Palette.line, backgroundColor: Palette.glassHi },
  option: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
});
