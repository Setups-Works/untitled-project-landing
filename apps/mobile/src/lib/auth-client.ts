import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

import { mobileEnv } from '@/config/env';

export function createMobileAuthClient() {
  if (!mobileEnv.apiBaseUrl) throw new Error('Set EXPO_PUBLIC_API_URL in apps/mobile/.env.local first.');

  return createAuthClient({
    baseURL: mobileEnv.apiBaseUrl,
    plugins: [
      expoClient({
        scheme: 'untitled',
        storagePrefix: 'untitled-mobile',
        storage: SecureStore,
      }),
    ],
  });
}
