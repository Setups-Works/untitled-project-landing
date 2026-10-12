import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import { emailOTPClient, usernameClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";

import { mobileEnv } from "@/config/env";

const STORAGE_PREFIX = "untitled-mobile";

function build(baseURL: string) {
  return createAuthClient({
    baseURL,
    plugins: [
      // Sessions are kept in the OS keychain (SecureStore) and sent as a Cookie header; never in AsyncStorage.
      expoClient({ scheme: mobileEnv.scheme, storagePrefix: STORAGE_PREFIX, storage: SecureStore }),
      usernameClient(),
      emailOTPClient(),
    ],
  });
}

export type MobileAuthClient = ReturnType<typeof build>;

/** `null` until EXPO_PUBLIC_API_URL is set; the root layout then shows a setup screen instead of crashing. */
export const authClient: MobileAuthClient | null = mobileEnv.apiBaseUrl ? build(mobileEnv.apiBaseUrl) : null;

/**
 * Drops a session the server no longer accepts (expired, revoked, or the account was banned). A normal sign-out call
 * would fail for the same reason, so the stored cookie and cache are removed directly and the session store is poked.
 */
export async function discardLocalSession() {
  if (!authClient) return;
  await Promise.all(
    [`${STORAGE_PREFIX}_cookie`, `${STORAGE_PREFIX}_session_data`].map((key) => SecureStore.deleteItemAsync(key).catch(() => undefined)),
  );
  authClient.$store.notify("$sessionSignal");
}
