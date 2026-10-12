import { useRef, useState } from "react";
import { TextInput, View } from "react-native";

import { AuthLink, AuthShell } from "@/features/auth/AuthShell";
import { AppText } from "@/components/ui/AppText";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { TextField } from "@/components/ui/TextField";
import { Palette } from "@/constants/theme";
import { useAuth } from "@/providers/AppState";
import { firstError, forgotPasswordSchema, friendlyAuthError, resetPasswordSchema } from "@untitled/validation";

type Step = "request" | "reset" | "done";

export default function ForgotPasswordScreen() {
  const auth = useAuth();
  const codeRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function requestCode() {
    setError("");
    setNotice("");
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) return setError(firstError(parsed.error));
    setBusy(true);
    try {
      const { error: err } = await auth.emailOtp.requestPasswordReset({ email: parsed.data.email });
      if (err) return setError(friendlyAuthError(err.message || "Couldn’t send the email."));
      // Always the same outcome, whether or not the address has an account (the server answers generically too).
      setStep("reset");
    } catch {
      setError("Couldn’t connect. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const { error: err } = await auth.emailOtp.requestPasswordReset({ email: email.trim() });
      if (err) setError(friendlyAuthError(err.message || "Couldn’t send the email."));
      else setNotice("If an account exists for that email, a new code is on its way.");
    } catch {
      setError("Couldn’t connect. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setError("");
    setNotice("");
    const parsed = resetPasswordSchema.safeParse({ email, otp, password, confirmPassword });
    if (!parsed.success) return setError(firstError(parsed.error));
    setBusy(true);
    try {
      const { error: err } = await auth.emailOtp.resetPassword({
        email: parsed.data.email,
        otp: parsed.data.otp,
        password: parsed.data.password,
      });
      if (err) return setError(friendlyAuthError(err.message || "Couldn’t update the password."));
      setStep("done");
    } catch {
      setError("Couldn’t connect. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (step === "done")
    return (
      <AuthShell eyebrow="All set" title="Password" quiet="updated." sub="You can now log in with your new password.">
        <View style={{ alignItems: "flex-start" }}>
          <Icon name="circle-check" size={34} color={Palette.greenFg} />
        </View>
        <AuthLink label="Back to log in" href="/login" />
      </AuthShell>
    );

  if (step === "reset")
    return (
      <AuthShell
        eyebrow="New password"
        title="Choose a new"
        quiet="password."
        sub={`If an account exists for ${email.trim()}, a code is on its way. Enter it below to set a new password.`}
      >
        <View style={{ gap: 14 }}>
          <TextField
            ref={codeRef}
            label="6-digit code"
            value={otp}
            onChangeText={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          <TextField
            ref={passwordRef}
            label="New password"
            password
            value={password}
            onChangeText={setPassword}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
          />
          <TextField
            ref={confirmRef}
            label="Confirm new password"
            password
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={() => void reset()}
          />
        </View>
        {error ? <Banner kind="error">{error}</Banner> : null}
        {notice ? <Banner kind="success">{notice}</Banner> : null}
        <Button title="Update password" loading={busy} onPress={() => void reset()} />
        <Button title="Resend code" kind="ghost" disabled={busy} onPress={() => void resend()} />
        <AuthLink label="Back to log in" href="/login" />
      </AuthShell>
    );

  return (
    <AuthShell
      eyebrow="Forgot password"
      title="Reset your"
      quiet="password."
      sub="Enter your email and we’ll send you a one-time reset code."
    >
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="go"
        onSubmitEditing={() => void requestCode()}
      />
      {error ? <Banner kind="error">{error}</Banner> : null}
      <Button title="Send reset code" loading={busy} onPress={() => void requestCode()} />
      <AppText variant="small" align="center">
        The code expires in 5 minutes.
      </AppText>
      <AuthLink label="Back to log in" href="/login" />
    </AuthShell>
  );
}
