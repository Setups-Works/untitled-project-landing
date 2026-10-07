import "server-only";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { APIError } from "better-auth/api";
import { oneTap } from "better-auth/plugins";
import pg from "pg";
import { serverEnv } from "../config/env";
import { sendMail } from "./mail";

const env = serverEnv();
const g = globalThis as unknown as { __authPool?: pg.Pool; __auth?: ReturnType<typeof create> };

// Better Auth reads and writes the `auth` schema (see db/migrations/…_auth.sql); the search_path lets it use unqualified table names.
function authPool() {
  g.__authPool ??= new pg.Pool({ connectionString: env.databaseUrl, options: "-c search_path=auth,public", max: 5 });
  return g.__authPool;
}

const verificationRequired = process.env.AUTH_REQUIRE_EMAIL_VERIFICATION?.trim().toLowerCase() !== "false";

function create() {
  return betterAuth({
    appName: "untitled project",
    baseURL: env.authUrl,
    secret: env.authSecret,
    database: authPool(),
    advanced: { database: { generateId: "uuid" } },
    trustedOrigins: [env.authUrl],

    user: {
      modelName: "users",
      fields: { emailVerified: "email_verified", createdAt: "created_at", updatedAt: "updated_at" },
      additionalFields: {
        role: { type: "string", required: false, input: false },
        banned: { type: "boolean", required: false, input: false, defaultValue: false },
      },
      changeEmail: {
        enabled: true,
        sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
          await sendMail(
            user.email,
            "Confirm your email change",
            `Someone asked to change your email to ${newEmail}. Confirm if that was you.`,
            {
              label: "Approve the change",
              url,
            },
          );
        },
      },
    },
    session: {
      modelName: "sessions",
      fields: {
        expiresAt: "expires_at",
        createdAt: "created_at",
        updatedAt: "updated_at",
        ipAddress: "ip_address",
        userAgent: "user_agent",
        userId: "user_id",
      },
      expiresIn: 60 * 60 * 24 * 30,
    },
    account: {
      modelName: "accounts",
      fields: {
        accountId: "account_id",
        providerId: "provider_id",
        userId: "user_id",
        accessToken: "access_token",
        refreshToken: "refresh_token",
        idToken: "id_token",
        accessTokenExpiresAt: "access_token_expires_at",
        refreshTokenExpiresAt: "refresh_token_expires_at",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
      accountLinking: { enabled: true, trustedProviders: ["google"] },
    },
    verification: {
      modelName: "verifications",
      fields: { expiresAt: "expires_at", createdAt: "created_at", updatedAt: "updated_at" },
    },

    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      requireEmailVerification: verificationRequired,
      autoSignIn: !verificationRequired,
      sendResetPassword: async ({ user, url }) => {
        await sendMail(user.email, "Reset your password", "We received a request to reset your password. The link works for one hour.", {
          label: "Choose a new password",
          url,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendMail(user.email, "Confirm your email", `Hi ${user.name || "there"}, confirm your email to activate your account.`, {
          label: "Confirm email",
          url,
        });
      },
    },
    socialProviders:
      env.google.clientId && env.google.clientSecret
        ? { google: { clientId: env.google.clientId, clientSecret: env.google.clientSecret } }
        : {},

    rateLimit: { enabled: true, window: 60, max: 60 },

    databaseHooks: {
      user: {
        create: {
          // Every account gets a profile row (plan, preferences, onboarding).
          after: async (user) => {
            await authPool().query("insert into public.profiles (user_id) values ($1) on conflict do nothing", [user.id]);
          },
        },
      },
      session: {
        create: {
          before: async (session) => {
            const { rows } = await authPool().query<{ banned: boolean }>("select banned from auth.users where id = $1", [session.userId]);
            if (rows[0]?.banned) throw new APIError("FORBIDDEN", { message: "This account has been suspended." });
            return { data: session };
          },
        },
      },
    },
    // One Tap uses the same Google credentials as the redirect sign-in; nextCookies() must stay last.
    plugins: [oneTap(), nextCookies()],
  });
}

/** The single Better Auth instance (kept across dev hot-reloads). Mounted at /api/auth/* and used by getUser() on the server. */
export const auth = (g.__auth ??= create());
