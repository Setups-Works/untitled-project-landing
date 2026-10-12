const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

function toOrigin(value: string | undefined) {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

export const mobileEnv = {
  /** The web app's origin. All auth and data requests go here. */
  apiBaseUrl: toOrigin(configuredApiUrl),
  /** The deep-link scheme from app.json; the server lists it in Better Auth's trustedOrigins. */
  scheme: "untitled",
  /** Public pages linked from the sign-up form. */
  privacyUrl: toOrigin(configuredApiUrl) ? `${toOrigin(configuredApiUrl)}/privacy-security` : undefined,
} as const;
