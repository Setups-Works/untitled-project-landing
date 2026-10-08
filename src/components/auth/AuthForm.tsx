"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faCircleCheck,
  faEnvelopeOpenText,
  faEye,
  faEyeSlash,
  faSpinner,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { authClient, oneTapAuthClient } from "../../lib/auth/client";
import { EMAIL_RE } from "../../lib/validate";
import { safeNext } from "../../lib/auth/redirect";

type Mode = "login" | "signup" | "forgot" | "reset";

const COPY: Record<Mode, { eyebrow: string; title: string; quiet: string; sub: string; cta: string }> = {
  login: { eyebrow: "Welcome back", title: "Log in to your", quiet: "workspace.", sub: "Pick up where you left off.", cta: "Log in" },
  signup: {
    eyebrow: "Create your account",
    title: "Start your",
    quiet: "workspace.",
    sub: "One place for notes, mail, calendar and meetings.",
    cta: "Create account",
  },
  forgot: {
    eyebrow: "Forgot password",
    title: "Reset your",
    quiet: "password.",
    sub: "Enter your email and we’ll send you a one-time reset code.",
    cta: "Send reset code",
  },
  reset: {
    eyebrow: "New password",
    title: "Choose a new",
    quiet: "password.",
    sub: "Make it at least 8 characters.",
    cta: "Update password",
  },
};

function strength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 14) s++;
  return s;
}
const LABELS = ["Too short", "Weak", "Okay", "Good", "Strong"];
const USERNAME_RE = /^[A-Za-z0-9_.]{3,30}$/;

function friendly(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid email or password")) return "That email and password don’t match.";
  if (m.includes("invalid username or password")) return "That email or username and password don’t match.";
  if (m.includes("username_is_already_taken") || m.includes("username already taken")) return "That username is already in use. Choose another one.";
  if (m.includes("not verified") || m.includes("not confirmed")) return "Please confirm your email first — check your inbox.";
  if (m.includes("already exists") || m.includes("already registered")) return "An account with this email already exists. Try logging in.";
  if (m.includes("suspended")) return "This account has been suspended. Contact support if you think this is a mistake.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a minute and try again.";
  if (m.includes("password should be")) return "Choose a stronger password (at least 8 characters).";
  return msg;
}

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const c = COPY[mode];
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [err, setErr] = useState(params.get("error") === "link" ? "That link has expired or was already used. Please try again." : "");
  const [done, setDone] = useState<null | "confirm" | "reset">(null);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [show, setShow] = useState(false);
  const [lastUsedMethod, setLastUsedMethod] = useState<string | null>(null);
  const [cfg, setCfg] = useState<{ google: boolean; googleClientId: string | null; configured: boolean } | null>(null);
  const score = useMemo(() => strength(pw), [pw]);
  // Google One Tap: the small "Continue as …" prompt that appears on its own when the visitor is signed in to Google in this browser.
  // The Sign-in button below stays as the fallback if the prompt is dismissed or the browser blocks it.
  useEffect(() => {
    setLastUsedMethod(authClient.getLastUsedLoginMethod());
  }, []);
  useEffect(() => {
    if (!cfg?.googleClientId || (mode !== "login" && mode !== "signup")) return;
    void oneTapAuthClient(cfg.googleClientId)
      .oneTap({
        callbackURL: next,
        // Wording of the prompt: "Sign in with Google" on the login page, "Sign up with Google" on the signup page.
        context: mode === "signup" ? "signup" : "signin",
        // Keep the upgraded One Tap experience on Safari/Firefox (they block third-party cookies via ITP).
        additionalOptions: { itp_support: true },
        // We never sign in silently: the visitor always taps "Continue as …" first.
        autoSelect: false,
        fetchOptions: { onSuccess: () => window.location.assign(next) },
      })
      .catch(() => undefined);
  }, [cfg, mode, next]);
  useEffect(() => {
    fetch("/api/v1/auth-config")
      .then((r) => r.json())
      .then(setCfg)
      .catch(() => setCfg(null));
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") || "").trim();
    const username = String(f.get("username") || "").trim();
    if (mode === "login" && !EMAIL_RE.test(email.trim()) && !USERNAME_RE.test(email.trim()))
      return setErr("Enter a valid email address or a username with 3–30 letters, numbers, dots or underscores.");
    if ((mode === "signup" || (mode === "forgot" && !otpSent)) && !EMAIL_RE.test(email.trim())) return setErr("Please enter a valid email address.");
    const resettingWithOtp = mode === "forgot" && otpSent;
    if ((mode === "signup" || mode === "reset" || resettingWithOtp) && pw.length < 8) return setErr("Your password needs at least 8 characters.");
    if (resettingWithOtp && !/^\d{6}$/.test(otp.trim())) return setErr("Enter the 6-digit code from your email.");
    if (resettingWithOtp && pw !== confirmPw) return setErr("Your passwords don’t match.");
    if (mode === "signup" && !name) return setErr("Please tell us your name.");
    if (mode === "signup" && !USERNAME_RE.test(username))
      return setErr("Choose a username with 3–30 letters, numbers, dots or underscores.");
    if (cfg && !cfg.configured) return setErr("The server isn’t configured yet. Start Docker and copy .env.example to .env.local.");

    setBusy(true);
    try {
      if (mode === "login") {
        const identifier = email.trim();
        const { error } = EMAIL_RE.test(identifier)
          ? await authClient.signIn.email({ email: identifier, password: pw })
          : await authClient.signIn.username({ username: identifier, password: pw });
        if (error) {
          // Unverified accounts get a fresh verification email automatically; show the "confirm" screen.
          if (error.status === 403 && /verif/i.test(error.message ?? "")) return setDone("confirm");
          throw new Error(error.message || "Invalid login");
        }
        router.push(next);
        router.refresh();
        return;
      }
      if (mode === "signup") {
        const { data, error } = await authClient.signUp.email({ email: email.trim(), password: pw, name, username, callbackURL: "/dashboard" });
        if (error) throw new Error(error.message || "Couldn’t create the account.");
        if (data?.token) {
          router.push("/dashboard");
          router.refresh();
        } else setDone("confirm");
        return;
      }
      if (mode === "forgot") {
        if (!otpSent) {
          const { error } = await authClient.emailOtp.requestPasswordReset({ email: email.trim() });
          if (error) throw new Error(error.message || "Couldn’t send the email.");
          setOtpSent(true);
          return;
        }
        const { error } = await authClient.emailOtp.resetPassword({ email: email.trim(), otp: otp.trim(), password: pw });
        if (error) throw new Error(error.message || "Couldn’t update the password.");
        setDone("reset");
        return;
      }
      const token = params.get("token");
      if (!token) throw new Error("That link has expired or was already used. Please request a new one.");
      const { error } = await authClient.resetPassword({ newPassword: pw, token });
      if (error) throw new Error(error.message || "Couldn’t update the password.");
      router.push("/login");
      router.refresh();
    } catch (x) {
      setErr(friendly(x instanceof Error ? x.message : "Something went wrong."));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setErr("");
    setGoogleBusy(true);
    try {
      const { error } = await authClient.signIn.social({ provider: "google", callbackURL: next });
      if (error) setErr(friendly(error.message ?? "Couldn’t start Google sign-in."));
    } catch (x) {
      setErr(friendly(x instanceof Error ? x.message : "Couldn’t start Google sign-in."));
    } finally {
      setGoogleBusy(false);
    }
  }

  async function signInWithPasskey() {
    setErr("");
    setPasskeyBusy(true);
    try {
      const { error } = await authClient.signIn.passkey();
      if (error) throw new Error(error.message || "Couldn’t sign in with that passkey.");
      window.location.assign(next);
    } catch (x) {
      setErr(friendly(x instanceof Error ? x.message : "Couldn’t sign in with that passkey."));
    } finally {
      setPasskeyBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    const { error } = await authClient.sendVerificationEmail({ email: email.trim(), callbackURL: "/dashboard" });
    setBusy(false);
    setErr(error ? friendly(error.message ?? "") : "");
  }

  async function resendResetCode() {
    setBusy(true);
    const { error } = await authClient.emailOtp.requestPasswordReset({ email: email.trim() });
    setBusy(false);
    setErr(error ? friendly(error.message ?? "") : "");
  }

  if (done)
    return (
      <div className="au-done" role="status">
        <span className="au-ico">
          <FA icon={done === "confirm" ? faEnvelopeOpenText : faCircleCheck} />
        </span>
        <h2 className="h3">{done === "reset" ? "Password updated" : "Confirm your email"}</h2>
        <p className="body">
          {done === "reset" ? "You can now log in with your new password." : (
            <>
              We sent a confirmation link to <b>{email}</b>. Open it to activate your account.
            </>
          )}
        </p>
        {done === "confirm" && (
          <button className="btn btn-secondary btn-sm" onClick={resend} disabled={busy}>
            Resend email
          </button>
        )}
        {err && (
          <p className="form-err" role="alert">
            {err}
          </p>
        )}
        <Link className="au-link" href="/login">
          Back to log in
        </Link>
      </div>
    );

  return (
    <div className="au-card-in">
      <div className="eyebrow">{c.eyebrow}</div>
      <h1 className="h2">
        {c.title} <span className="quiet">{c.quiet}</span>
      </h1>
      <p className="body">{mode === "forgot" && otpSent ? `If an account exists for ${email}, a code is on its way. Enter it below to set a new password.` : c.sub}</p>

      {cfg && !cfg.configured && (
        <p className="au-note" role="note">
          <FA icon={faTriangleExclamation} />{" "}
          <span>
            The server isn’t connected yet. Run <code>docker compose up -d</code>, then copy <code>.env.example</code> to{" "}
            <code>.env.local</code>.
          </span>
        </p>
      )}

      {cfg?.google && (mode === "login" || mode === "signup") && (
        <>
          <button type="button" className="au-google" onClick={google} disabled={busy || googleBusy || passkeyBusy}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
              <path
                fill="#EA4335"
                d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z"
              />
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" />
              <path
                fill="#FBBC05"
                d="M10.5 28.7A14.5 14.5 0 019.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 000 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
              />
            </svg>
            {googleBusy ? (
              <>
                <FA icon={faSpinner} spin /> Connecting to Google…
              </>
            ) : (
              <>
                Continue with Google
                {lastUsedMethod === "google" && <small className="au-last-used">Last used</small>}
              </>
            )}
          </button>
          {mode === "login" && (
            <button
              className="btn btn-secondary au-passkey"
              type="button"
              onClick={signInWithPasskey}
              disabled={busy || googleBusy || passkeyBusy}
            >
              {passkeyBusy ? <FA icon={faSpinner} spin /> : <Image src="/passkey-icon.png" alt="" width={18} height={18} />}
              Continue with a passkey
              {lastUsedMethod === "passkey" && <small className="au-last-used">Last used</small>}
            </button>
          )}
          <div className="au-or">
            <span>or</span>
          </div>
        </>
      )}

      <form className="wl-form au-form" onSubmit={submit} noValidate>
        {mode === "signup" && (
          <label>
            <span>Full name</span>
            <input name="name" autoComplete="name" maxLength={80} placeholder="Ada Lovelace" />
          </label>
        )}
        {mode === "signup" && (
          <label>
            <span>Username</span>
            <input
              name="username"
              autoComplete="username"
              minLength={3}
              maxLength={30}
              pattern="[A-Za-z0-9_.]{3,30}"
              required
              placeholder="ada.lovelace"
            />
            <small className="meta">You can use this with your password to log in.</small>
          </label>
        )}
        {mode !== "reset" && !(mode === "forgot" && otpSent) && (
          <label>
            <span className="au-pwrow">
              <span>{mode === "login" ? "Email or username" : "Email"}</span>
              {mode === "login" && (lastUsedMethod === "email" || lastUsedMethod === "username") && (
                <small className="au-last-used">Last used</small>
              )}
            </span>
            <input
              type={mode === "login" ? "text" : "email"}
              autoComplete={mode === "login" ? "username" : "email"}
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={mode === "login" ? "you@example.com or username" : "you@example.com"}
            />
          </label>
        )}
        {mode === "forgot" && otpSent && (
          <>
            <div className="meta">Reset code sent to <b>{email}</b> · <button className="au-link" type="button" onClick={() => { setOtpSent(false); setOtp(""); setPw(""); setConfirmPw(""); }}>Change email</button></div>
            <label>
              <span>6-digit code</span>
              <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" />
            </label>
          </>
        )}
        {(mode !== "forgot" || otpSent) && (
          <label>
            <span className="au-pwrow">
              {mode === "reset" || mode === "forgot" ? "New password" : "Password"}
              {mode === "login" && (
                <Link href="/forgot-password" className="au-link">
                  Forgot password?
                </Link>
              )}
            </span>
            <span className="au-pw">
              <input
                type={show ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder={mode === "login" ? "Your password" : "At least 8 characters"}
              />
              <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}>
                <FA icon={show ? faEyeSlash : faEye} />
              </button>
            </span>
            {(mode === "signup" || mode === "reset" || (mode === "forgot" && otpSent)) && pw && (
              <span className="au-meter" data-s={score}>
                <i />
                <i />
                <i />
                <i />
                <small>{LABELS[score]}</small>
              </span>
            )}
          </label>
        )}
        {mode === "forgot" && otpSent && (
          <>
            <label>
              <span>Confirm new password</span>
              <input type="password" autoComplete="new-password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Enter it again" />
            </label>
            <button className="au-link" type="button" onClick={resendResetCode} disabled={busy}>Resend code</button>
          </>
        )}
        {err && (
          <p className="form-err" role="alert">
            {err}
          </p>
        )}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? (
            <>
              <FA icon={faSpinner} spin /> Please wait…
            </>
          ) : (
            <>
              {mode === "forgot" && otpSent ? "Verify code & reset password" : c.cta} <FA icon={faArrowRight} />
            </>
          )}
        </button>
      </form>

      <p className="au-switch">
        {mode === "login" && (
          <>
            New here?{" "}
            <Link className="au-link" href="/signup">
              Create an account
            </Link>
          </>
        )}
        {mode === "signup" && (
          <>
            Already have an account?{" "}
            <Link className="au-link" href="/login">
              Log in
            </Link>
          </>
        )}
        {(mode === "forgot" || mode === "reset") && (
          <>
            Remembered it?{" "}
            <Link className="au-link" href="/login">
              Back to log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
