import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "../../../../server/auth";

// Sign up, sign in, OAuth callbacks, email verification, password reset, sessions: all handled by Better Auth.
export const { GET, POST } = toNextJsHandler(auth);
