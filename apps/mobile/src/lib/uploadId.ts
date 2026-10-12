/** Generates a collision-resistant object name on runtimes without crypto.randomUUID. */
export function createUploadId(): string {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === "function") return cryptoApi.randomUUID();

  // This identifier is only used to avoid filename collisions, not as a security token.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
