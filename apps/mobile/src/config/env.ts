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
  /** Where the Android app's releases are published; the app checks it for a newer version. */
  githubRepo: "Setups-Works/untitled-project-landing",
  /** The web changelog, linked from the update prompt. */
  changelogUrl: toOrigin(configuredApiUrl) ? `${toOrigin(configuredApiUrl)}/changelog` : undefined,
  privacyUrl: toOrigin(configuredApiUrl) ? `${toOrigin(configuredApiUrl)}/privacy-security` : undefined,
} as const;
