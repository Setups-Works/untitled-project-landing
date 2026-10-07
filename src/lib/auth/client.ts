"use client";
import { createAuthClient } from "better-auth/react";
import { oneTapClient } from "better-auth/client/plugins";

/** Browser auth client (talks to /api/auth/*). Sign-in, sign-up, sign-out, password reset, profile updates, session state. */
export const authClient = createAuthClient();

/** Separate client with the Google One Tap plugin. It needs the (public) Google client ID, which the server provides at runtime. */
export const oneTapAuthClient = (clientId: string) => createAuthClient({ plugins: [oneTapClient({ clientId, context: "signin" })] });
