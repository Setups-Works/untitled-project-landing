"use client";
import { createAuthClient } from "better-auth/react";
import { adminClient, emailOTPClient, lastLoginMethodClient, oneTapClient, usernameClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

/** Browser auth client (talks to /api/auth/*). Sign-in, sign-up, sign-out, password reset, profile updates, session state. */
export const authClient = createAuthClient({ plugins: [passkeyClient(), usernameClient(), emailOTPClient(), lastLoginMethodClient(), adminClient()] });

/** Separate client with the Google One Tap plugin. It needs the (public) Google client ID, which the server provides at runtime. */
export const oneTapAuthClient = (clientId: string) =>
  createAuthClient({ plugins: [oneTapClient({ clientId, context: "signin" }), lastLoginMethodClient()] });
