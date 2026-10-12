import { z } from "zod";

/**
 * Sign-in / sign-up / reset rules shared by the web forms and the mobile app. They mirror the Better Auth server config
 * (apps/web/src/server/auth.ts: 8–128 character passwords, 6-digit email codes) and the web form (AuthForm.tsx).
 * Messages are the same ones the web shows, so both clients read the same.
 */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const USERNAME_RE = /^[A-Za-z0-9_.]{3,30}$/;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

export const isEmail = (value: string) => EMAIL_RE.test(value.trim());

const email = z.string().trim().regex(EMAIL_RE, "Please enter a valid email address.");
const password = z
  .string()
  .min(PASSWORD_MIN, "Your password needs at least 8 characters.")
  .max(PASSWORD_MAX, "Your password is too long (128 characters at most).");
const otp = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code from your email.");

/** The sign-in field takes an email or a username. */
export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .refine(
      (v) => EMAIL_RE.test(v) || USERNAME_RE.test(v),
      "Enter a valid email address or a username with 3–30 letters, numbers, dots or underscores.",
    ),
  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Please tell us your name.").max(80),
  username: z.string().trim().regex(USERNAME_RE, "Choose a username with 3–30 letters, numbers, dots or underscores."),
  email,
  password,
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ email, otp, password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Your passwords don’t match." });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** First problem of a failed parse, as the single line the forms show. */
export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check what you entered.";
}

/** Password strength 0–4, same scale and labels as the web sign-up form. */
export function passwordStrength(p: string): number {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 14) s++;
  return s;
}
export const PASSWORD_STRENGTH_LABELS = ["Too short", "Weak", "Okay", "Good", "Strong"] as const;

/** Turns Better Auth error text into the friendly wording the web uses. */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid email or password")) return "That email and password don’t match.";
  if (m.includes("invalid username or password")) return "That email or username and password don’t match.";
  if (m.includes("username_is_already_taken") || m.includes("username already taken"))
    return "That username is already in use. Choose another one.";
  if (m.includes("not verified") || m.includes("not confirmed")) return "Please confirm your email first — check your inbox.";
  if (m.includes("already exists") || m.includes("already registered")) return "An account with this email already exists. Try logging in.";
  if (m.includes("suspended")) return "This account has been suspended. Contact support if you think this is a mistake.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a minute and try again.";
  if (m.includes("password should be")) return "Choose a stronger password (at least 8 characters).";
  return message;
}

export * from "./chatActions";
