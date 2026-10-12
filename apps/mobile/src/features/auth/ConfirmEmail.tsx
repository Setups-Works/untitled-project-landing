import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AuthLink, AuthShell } from "./AuthShell";
import { AppText } from "@/components/ui/AppText";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Palette, Radius } from "@/constants/theme";
import { useAuth } from "@/providers/AppState";
import { friendlyAuthError } from "@untitled/validation";

/** "Check your inbox" state shown after sign-up, and when an unverified account tries to sign in. */
export function ConfirmEmail({ email }: { email: string }) {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  async function resend() {
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await auth.sendVerificationEmail({ email });
      setMsg(
        error
          ? { kind: "error", text: friendlyAuthError(error.message ?? "") || "Couldn’t send the email." }
          : { kind: "success", text: "Sent. Check your inbox." },
      );
    } catch {
      setMsg({ kind: "error", text: "Couldn’t connect. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Almost there"
      title="Confirm your"
      quiet="email."
      sub="Open the link we sent to activate your account, then come back and log in."
    >
      <View style={styles.badge}>
        <Icon name="envelope-open-text" size={22} color={Palette.greenFg} />
      </View>
      <AppText variant="body">
        We sent a confirmation link to <AppText variant="bodyStrong">{email}</AppText>.
      </AppText>
      {msg ? <Banner kind={msg.kind}>{msg.text}</Banner> : null}
      <Button title="Resend email" kind="secondary" loading={busy} onPress={() => void resend()} />
      <AuthLink label="Back to log in" href="/login" />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Palette.greenBg,
    alignItems: "center",
    justifyContent: "center",
  },
});
