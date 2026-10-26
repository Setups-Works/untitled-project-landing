import "server-only";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { serverEnv } from "../../../config/env";
import { ValidationError } from "../../errors";

/**
 * Seals a person's own AI key before it is stored: AES-256-GCM with a key derived from BETTER_AUTH_SECRET, and the user's id bound
 * in as associated data so a copied row can't be opened as someone else's. Only the server can open it; the browser only ever gets a
 * four-character hint. Rotating BETTER_AUTH_SECRET makes saved keys unreadable, and people are then asked to enter theirs again.
 */
function vaultKey(): Buffer {
  const secret = serverEnv().authSecret;
  if (!secret) throw new ValidationError("Saving an API key isn’t available on this server yet.");
  return Buffer.from(hkdfSync("sha256", secret, "untitled-ai-keys", "aes-256-gcm", 32));
}

export function sealKey(plain: string, userId: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", vaultKey(), iv);
  cipher.setAAD(Buffer.from(userId));
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64");
}

/** The key, or null when it can't be opened (a rotated secret or a damaged row). */
export function openKey(sealed: string, userId: string): string | null {
  try {
    const raw = Buffer.from(sealed, "base64");
    const decipher = createDecipheriv("aes-256-gcm", vaultKey(), raw.subarray(0, 12));
    decipher.setAAD(Buffer.from(userId));
    decipher.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
