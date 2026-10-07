"use client";
import Link from "next/link";
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
import { authClient } from "../../lib/auth/client";
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
    sub: "Enter your email and we’ll send you a reset link.",
    cta: "Send reset link",
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

function friendly(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid email or password")) return "That email and password don’t match.";
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
  const [err, setErr] = useState(params.get("error") === "link" ? "That link has expired or was already used. Please try again." : "");
  const [done, setDone] = useState<null | "confirm" | "sent">(null);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [cfg, setCfg] = useState<{ google: boolean; configured: boolean } | null>(null);
  const score = useMemo(() => strength(pw), [pw]);
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
    if (mode !== "reset" && !EMAIL_RE.test(email.trim())) return setErr("Please enter a valid email address.");
    if ((mode === "signup" || mode === "reset") && pw.length < 8) return setErr("Your password needs at least 8 characters.");
    if (mode === "signup" && !name) return setErr("Please tell us your name.");
    if (cfg && !cfg.configured) return setErr("The server isn’t configured yet. Start Docker and copy .env.example to .env.local.");

    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await authClient.signIn.email({ email: email.trim(), password: pw });
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
        const { data, error } = await authClient.signUp.email({ email: email.trim(), password: pw, name, callbackURL: "/dashboard" });
        if (error) throw new Error(error.message || "Couldn’t create the account.");
        if (data?.token) {
          router.push("/dashboard");
          router.refresh();
        } else setDone("confirm");
        return;
      }
      if (mode === "forgot") {
        const { error } = await authClient.requestPasswordReset({ email: email.trim(), redirectTo: "/reset-password" });
        if (error) throw new Error(error.message || "Couldn’t send the email.");
        setDone("sent");
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
    const { error } = await authClient.signIn.social({ provider: "google", callbackURL: next });
    if (error) setErr(friendly(error.message ?? ""));
  }

  async function resend() {
    setBusy(true);
    const { error } = await authClient.sendVerificationEmail({ email: email.trim(), callbackURL: "/dashboard" });
    setBusy(false);
    setErr(error ? friendly(error.message ?? "") : "");
  }

  if (done)
    return (
      <div className="au-done" role="status">
        <span className="au-ico">
          <FA icon={done === "sent" ? faEnvelopeOpenText : faCircleCheck} />
        </span>
        <h2 className="h3">{done === "sent" ? "Check your email" : "Confirm your email"}</h2>
        <p className="body">
          {done === "sent" ? (
            <>
              If an account exists for <b>{email}</b>, a reset link is on its way. It can take a minute.
            </>
          ) : (
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
      <p className="body">{c.sub}</p>

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
          <button type="button" className="au-google" onClick={google}>
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
            Continue with Google
          </button>
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
        {mode !== "reset" && (
          <label>
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
        )}
        {mode !== "forgot" && (
          <label>
            <span className="au-pwrow">
              {mode === "reset" ? "New password" : "Password"}
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
            {(mode === "signup" || mode === "reset") && pw && (
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
              {c.cta} <FA icon={faArrowRight} />
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
