const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const mobileEnv = {
  apiBaseUrl: configuredApiUrl ? new URL(configuredApiUrl).origin : undefined,
} as const;
