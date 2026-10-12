import { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { Link } from "expo-router";

import { AuthLink, AuthShell } from "@/features/auth/AuthShell";
import { ConfirmEmail } from "@/features/auth/ConfirmEmail";
import { GoogleButton, OrDivider } from "@/features/auth/GoogleButton";
import { useAuthConfig } from "@/features/auth/useAuthConfig";
import { AppText } from "@/components/ui/AppText";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Palette } from "@/constants/theme";
import { useAuth } from "@/providers/AppState";
import { firstError, friendlyAuthError, isEmail, loginSchema } from "@untitled/validation";

export default function LoginScreen() {
  const auth = useAuth();
  const config = useAuthConfig();
  const passwordRef = useRef<TextInput>(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");
  const [needsConfirm, setNeedsConfirm] = useState(false);

  async function submit() {
    setError("");
    const parsed = loginSchema.safeParse({ identifier, password });
    if (!parsed.success) return setError(firstError(parsed.error));
    if (config.data && !config.data.configured) return setError("The server isn’t configured yet.");

    setBusy(true);
    try {
      const id = parsed.data.identifier;
      const { error: err } = isEmail(id)
        ? await auth.signIn.email({ email: id, password })
        : await auth.signIn.username({ username: id, password });
      if (err) {
        // Unverified accounts get a fresh verification email from the server; show the "confirm" state like the web does.
        if (err.status === 403 && /verif/i.test(err.message ?? "")) return setNeedsConfirm(true);
        return setError(friendlyAuthError(err.message || "Invalid login"));
      }
      // Success: the session store updates and the root route guards swap in the app. Nothing to navigate to here.
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
      // The Expo client turns this into a deep link (untitled://) and runs the OAuth flow in a system browser session.
      const res = await auth.signIn.social({ provider: "google", callbackURL: "/" });
      if (res?.error) setError(friendlyAuthError(res.error.message ?? "Couldn’t start Google sign-in."));
    } catch {
      setError("Google sign-in was cancelled or couldn’t finish. Please try again.");
    } finally {
      setGoogleBusy(false);
    }
  }

  if (needsConfirm) return <ConfirmEmail email={identifier.trim()} />;

  const googleOn = config.data?.google === true;
  return (
    <AuthShell eyebrow="Welcome back" title="Log in to your" quiet="workspace." sub="Pick up where you left off.">
      {config.data && !config.data.configured ? (
        <Banner kind="info">The server isn’t connected yet. Start Docker and the web app, then try again.</Banner>
      ) : null}
      {config.isError ? <Banner kind="info">Can’t reach the server. Check EXPO_PUBLIC_API_URL and your connection.</Banner> : null}

      {googleOn ? (
        <>
          <GoogleButton onPress={() => void google()} busy={googleBusy} disabled={busy} />
          <OrDivider />
        </>
      ) : null}

      <View style={{ gap: 14 }}>
        <TextField
          label="Email or username"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          autoComplete="username"
          keyboardType="email-address"
          textContentType="username"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <TextField
          ref={passwordRef}
          label="Password"
          password
          value={password}
          onChangeText={setPassword}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
        />
        <Link href="/forgot-password" accessibilityRole="link" style={{ alignSelf: "flex-end" }}>
          <AppText variant="small" color={Palette.greenFg} style={{ fontWeight: "600" }}>
            Forgot password?
          </AppText>
        </Link>
      </View>

      {error ? <Banner kind="error">{error}</Banner> : null}
      <Button title="Log in" loading={busy} disabled={googleBusy} onPress={() => void submit()} />
      <AuthLink lead="New here?" label="Create an account" href="/signup" />
    </AuthShell>
  );
}
