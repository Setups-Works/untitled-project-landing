import { useRef, useState } from "react";
import { Linking, StyleSheet, TextInput, View } from "react-native";

import { AuthLink, AuthShell } from "@/features/auth/AuthShell";
import { ConfirmEmail } from "@/features/auth/ConfirmEmail";
import { GoogleButton, OrDivider } from "@/features/auth/GoogleButton";
import { useAuthConfig } from "@/features/auth/useAuthConfig";
import { AppText } from "@/components/ui/AppText";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Palette, Radius } from "@/constants/theme";
import { mobileEnv } from "@/config/env";
import { useAuth } from "@/providers/AppState";
import { firstError, friendlyAuthError, PASSWORD_STRENGTH_LABELS, passwordStrength, signupSchema } from "@untitled/validation";

export default function SignupScreen() {
  const auth = useAuth();
  const config = useAuthConfig();
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmFor, setConfirmFor] = useState<string | null>(null);
  const score = passwordStrength(password);

  async function submit() {
    setError("");
    const parsed = signupSchema.safeParse({ name, username, email, password });
    if (!parsed.success) return setError(firstError(parsed.error));
    if (config.data && !config.data.configured) return setError("The server isn’t configured yet.");

    setBusy(true);
    try {
      const { data, error: err } = await auth.signUp.email({ ...parsed.data });
      if (err) return setError(friendlyAuthError(err.message || "Couldn’t create the account."));
      // With email verification on (the default) there is no session yet: ask the user to confirm first. Otherwise the
      // session store updates and the route guards take over.
      if (!data?.token) setConfirmFor(parsed.data.email);
    } catch {
      setError("Couldn’t connect. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError("");
    setGoogleBusy(true);
    try {
      const res = await auth.signIn.social({ provider: "google", callbackURL: "/" });
      if (res?.error) setError(friendlyAuthError(res.error.message ?? "Couldn’t start Google sign-in."));
    } catch {
      setError("Google sign-in was cancelled or couldn’t finish. Please try again.");
    } finally {
      setGoogleBusy(false);
    }
  }

  if (confirmFor) return <ConfirmEmail email={confirmFor} />;

  return (
    <AuthShell eyebrow="Create your account" title="Start your" quiet="workspace." sub="One place for notes, tasks and your journal.">
      {config.data?.google ? (
        <>
          <GoogleButton onPress={() => void google()} busy={googleBusy} disabled={busy} />
          <OrDivider />
        </>
      ) : null}

      <View style={{ gap: 14 }}>
        <TextField
          label="Full name"
          value={name}
          onChangeText={setName}
          maxLength={80}
          autoComplete="name"
          textContentType="name"
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => usernameRef.current?.focus()}
        />
        <TextField
          ref={usernameRef}
          label="Username"
          value={username}
          onChangeText={setUsername}
          maxLength={30}
          autoCapitalize="none"
          autoComplete="username-new"
          textContentType="username"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        <TextField
          ref={emailRef}
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <TextField
          ref={passwordRef}
          label="Password"
          password
          value={password}
          onChangeText={setPassword}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
        />
        {password ? (
          <View style={styles.meter} accessibilityLabel={`Password strength: ${PASSWORD_STRENGTH_LABELS[score]}`}>
            <View style={styles.bars}>
              {[1, 2, 3, 4].map((n) => (
                <View key={n} style={[styles.bar, n <= score ? { backgroundColor: Palette.greenFg } : null]} />
              ))}
            </View>
            <AppText variant="small">{PASSWORD_STRENGTH_LABELS[score]}</AppText>
          </View>
        ) : null}
      </View>

      {error ? <Banner kind="error">{error}</Banner> : null}
      <Button title="Create account" loading={busy} disabled={googleBusy} onPress={() => void submit()} />

      {mobileEnv.privacyUrl ? (
        <AppText variant="small" align="center">
          By continuing you agree to how we handle your data, described in{" "}
          <AppText
            variant="small"
            color={Palette.greenFg}
            style={{ fontWeight: "600" }}
            accessibilityRole="link"
            onPress={() => void Linking.openURL(mobileEnv.privacyUrl ?? "")}
          >
            Privacy & security
          </AppText>
          .
        </AppText>
      ) : null}
      <AuthLink lead="Already have an account?" label="Log in" href="/login" />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  meter: { flexDirection: "row", alignItems: "center", gap: 10, marginLeft: 4 },
  bars: { flexDirection: "row", gap: 4, flex: 1 },
  bar: { flex: 1, height: 4, borderRadius: Radius.pill, backgroundColor: Palette.line },
});
