"use client";
import { createAuthClient } from "better-auth/react";

/** Browser auth client (talks to /api/auth/*). Sign-in, sign-up, sign-out, password reset, profile updates, session state. */
export const authClient = createAuthClient();
