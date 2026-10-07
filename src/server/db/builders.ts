import "server-only";
import { makeFrom } from "../../lib/api/builder";
import { execute } from "./execute";

/** Query builder for code that should see exactly what this user sees (Row-Level Security applies). Safe for services. */
export const userDb = (userId: string) => makeFrom((spec) => execute(spec, { kind: "user", userId }));

/**
 * Query builder that runs as the database owner and therefore bypasses Row-Level Security.
 * Only use it after verifying the caller (admin panel, public shared chats, account deletion).
 */
export const adminDb = () => makeFrom((spec) => execute(spec, { kind: "owner" }));
