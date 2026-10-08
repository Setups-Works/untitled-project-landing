import { z } from "zod";

/**
 * OpenAPI 3.1 description of the app's HTTP API, served at /api/v1/openapi.json and browsable at /api/v1/docs.
 * Request bodies are Zod schemas converted to JSON Schema. They mirror the schemas inside the route files; when a route's
 * input changes, change it here too.
 */
const uuid = z.string().uuid();
const identifier = z.string().regex(/^[a-z_][a-z0-9_]*$/);

const dbRequest = z.object({
  table: identifier,
  op: z.enum(["select", "insert", "update", "delete", "upsert"]),
  columns: z.string().max(500).optional(),
  returning: z.string().max(500).nullish(),
  values: z.union([z.record(z.string(), z.unknown()), z.array(z.record(z.string(), z.unknown())).max(500)]).optional(),
  filters: z
    .array(
      z.object({
        column: identifier,
        op: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "in", "is"]),
        value: z.unknown(),
        not: z.boolean().optional(),
      }),
    )
    .max(30),
  or: z.array(z.string().max(1000)).max(5),
  order: z.array(z.object({ column: identifier, ascending: z.boolean(), nullsFirst: z.boolean().optional() })).max(5),
  limit: z.number().int().min(1).max(5000).optional(),
  range: z.tuple([z.number().int().min(0), z.number().int().min(0)]).optional(),
  single: z.enum(["single", "maybe"]).optional(),
  count: z.literal("exact").optional(),
  head: z.boolean().optional(),
  onConflict: z.string().max(200).optional(),
});
const dbResponse = z.object({
  data: z.unknown().nullable(),
  count: z.number().nullable(),
  error: z.object({ message: z.string(), code: z.string().optional(), details: z.string().nullish() }).nullable(),
});
const chatRequest = z.object({
  chatId: uuid,
  provider: z.string().regex(/^[a-z0-9_-]{1,40}$/),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
const actionsRequest = z.object({ messageId: uuid, which: z.union([z.number().int().min(0).max(20), z.literal("all")]).default(0) });
const actionsResponse = z.object({
  created: z.array(z.object({ kind: z.enum(["task", "note", "journal"]), id: z.string().optional(), path: z.string() })),
});
const statusResponse = z.object({
  providers: z.array(
    z.object({ id: z.string(), label: z.string(), note: z.string(), runtime: z.enum(["server", "client"]), available: z.boolean() }),
  ),
});
const authConfigResponse = z.object({ google: z.boolean(), googleClientId: z.string().nullable(), configured: z.boolean() });
const signRequest = z.object({
  bucket: z.enum(["avatars", "note-files"]),
  paths: z.array(z.string()).min(1).max(200),
  ttl: z.number().int().min(60).max(86400).optional(),
});
const signResponse = z.object({
  data: z.array(z.object({ path: z.string(), signedUrl: z.string().nullable(), error: z.string().nullable() })),
});
const removeRequest = z.object({
  bucket: z.enum(["avatars", "note-files"]),
  paths: z.array(z.string()).max(1000).optional(),
  prefix: z.string().max(300).optional(),
});
const okResponse = z.object({ ok: z.literal(true) });
const errorResponse = z.object({ error: z.string() });

const schemas = {
  DbRequest: dbRequest,
  DbResponse: dbResponse,
  ChatRequest: chatRequest,
  ActionsRequest: actionsRequest,
  ActionsResponse: actionsResponse,
  AiStatus: statusResponse,
  AuthConfig: authConfigResponse,
  SignRequest: signRequest,
  SignResponse: signResponse,
  RemoveRequest: removeRequest,
  Ok: okResponse,
  Error: errorResponse,
};

const ref = (name: keyof typeof schemas) => ({ $ref: `#/components/schemas/${name}` });
const json = (name: keyof typeof schemas) => ({ "application/json": { schema: ref(name) } });
const body = (name: keyof typeof schemas) => ({ required: true, content: json(name) });
const err = (description: string) => ({ description, content: json("Error") });
const common = { "401": err("Not signed in."), "403": err("Request did not come from this site, or the resource is not yours.") };
const secured = [{ cookieAuth: [] }];

export function buildOpenApi() {
  const components: Record<string, unknown> = {};
  for (const [name, schema] of Object.entries(schemas)) {
    const { $schema: _ignored, ...js } = z.toJSONSchema(schema, { io: "input", unrepresentable: "any" }) as Record<string, unknown>;
    void _ignored;
    components[name] = js;
  }
  return {
    openapi: "3.1.0",
    info: {
      title: "untitled project API",
      version: "1.0.0",
      description:
        "HTTP API behind the web app. Requests are authenticated by the Better Auth session cookie and, for state-changing calls, must come from the app's own origin. Use Swagger UI from the same site (/api/v1/docs) so the cookie is sent.",
    },
    servers: [{ url: "/" }],
    tags: [
      { name: "AI", description: "Assistant replies and confirmed drafts" },
      { name: "Data", description: "Row-level-security protected data door used by the web app" },
      { name: "Realtime", description: "Server-sent events" },
      { name: "Storage", description: "Files in private and public buckets" },
      { name: "Config", description: "Public deployment info" },
      { name: "Auth", description: "Provided by Better Auth (see its documentation for every endpoint)" },
    ],
    paths: {
      "/api/v1/auth-config": {
        get: {
          tags: ["Config"],
          summary: "Sign-in configuration (no secrets)",
          responses: { "200": { description: "OK", content: json("AuthConfig") } },
        },
      },
      "/api/v1/ai/status": {
        get: {
          tags: ["AI"],
          summary: "AI providers and whether each is configured",
          security: secured,
          responses: { "200": { description: "OK", content: json("AiStatus") }, "401": common["401"] },
        },
      },
      "/api/v1/ai/chat": {
        post: {
          tags: ["AI"],
          summary: "Stream the assistant's reply to the latest message in a chat",
          description:
            "The reply streams as plain text. Draft blocks (<create-item>…</create-item>) are saved with the reply; nothing is created until /api/v1/ai/actions is called.",
          security: secured,
          requestBody: body("ChatRequest"),
          responses: {
            "200": { description: "Plain-text stream", content: { "text/plain": { schema: { type: "string" } } } },
            "400": err("Bad request, or the provider is not available."),
            ...common,
            "404": err("Chat not found."),
            "429": err("Too many replies, or the AI provider is rate limiting."),
            "502": err("The AI provider failed."),
          },
        },
      },
      "/api/v1/ai/actions": {
        post: {
          tags: ["AI"],
          summary: "Create the items from a draft the user confirmed",
          security: secured,
          requestBody: body("ActionsRequest"),
          responses: {
            "201": { description: "Items created", content: json("ActionsResponse") },
            "400": err("Invalid draft."),
            ...common,
            "409": err("That draft is no longer available."),
          },
        },
      },
      "/api/v1/db": {
        post: {
          tags: ["Data"],
          summary: "Run a validated query as the signed-in user (row-level security applies)",
          description:
            "Only allow-listed tables are reachable. Results use the shape { data, count, error }; query errors are returned with status 200 inside `error`.",
          security: secured,
          requestBody: body("DbRequest"),
          responses: {
            "200": { description: "Result", content: json("DbResponse") },
            "400": { description: "Malformed query", content: json("DbResponse") },
            ...common,
          },
        },
      },
      "/api/v1/realtime": {
        get: {
          tags: ["Realtime"],
          summary: 'Server-sent events: `event: change` with {"t":"<table>"} when one of your rows changes',
          security: secured,
          responses: {
            "200": { description: "Event stream", content: { "text/event-stream": { schema: { type: "string" } } } },
            "401": common["401"],
          },
        },
      },
      "/api/v1/storage/sign": {
        post: {
          tags: ["Storage"],
          summary: "Expiring links for your own files",
          security: secured,
          requestBody: body("SignRequest"),
          responses: { "200": { description: "OK", content: json("SignResponse") }, "400": err("Bad request."), ...common },
        },
      },
      "/api/v1/storage/remove": {
        post: {
          tags: ["Storage"],
          summary: "Delete your own files",
          security: secured,
          requestBody: body("RemoveRequest"),
          responses: { "200": { description: "OK", content: json("Ok") }, "400": err("Bad request."), ...common },
        },
      },
      "/api/v1/storage/o/{bucket}/{key}": {
        parameters: [
          { name: "bucket", in: "path", required: true, schema: { type: "string", enum: ["avatars", "note-files"] } },
          { name: "key", in: "path", required: true, description: "Object path, starting with your user id", schema: { type: "string" } },
        ],
        get: {
          tags: ["Storage"],
          summary: "Download a file",
          description:
            "Public bucket (avatars) is open. Private files need a valid signed link (e and s query parameters) or the owner's session.",
          parameters: [
            { name: "e", in: "query", schema: { type: "string" }, description: "Expiry of a signed link" },
            { name: "s", in: "query", schema: { type: "string" }, description: "Signature of a signed link" },
          ],
          responses: {
            "200": { description: "File bytes", content: { "*/*": { schema: { type: "string", format: "binary" } } } },
            "404": err("Not found."),
            ...common,
          },
        },
        put: {
          tags: ["Storage"],
          summary: "Upload a file into your own folder",
          security: secured,
          requestBody: { required: true, content: { "*/*": { schema: { type: "string", format: "binary" } } } },
          responses: {
            "200": { description: "OK", content: json("Ok") },
            "413": err("Too large."),
            "415": err("File type not allowed."),
            ...common,
          },
        },
      },
      "/api/auth/sign-in/email": {
        post: {
          tags: ["Auth"],
          summary: "Sign in with email and password (Better Auth)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: { email: { type: "string", format: "email" }, password: { type: "string" }, rememberMe: { type: "boolean" } },
                },
              },
            },
          },
          responses: {
            "200": { description: "Signed in; the session cookie is set" },
            "401": { description: "Invalid email or password" },
          },
        },
      },
      "/api/auth/sign-up/email": {
        post: {
          tags: ["Auth"],
          summary: "Create an account (Better Auth)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password", "name"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                    name: { type: "string" },
                    username: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "Account created (email verification may be required)" } },
        },
      },
      "/api/auth/get-session": {
        get: {
          tags: ["Auth"],
          summary: "Current session (Better Auth)",
          responses: { "200": { description: "Session and user, or null" } },
        },
      },
      "/api/auth/sign-out": {
        post: { tags: ["Auth"], summary: "Sign out (Better Auth)", responses: { "200": { description: "Signed out" } } },
      },
    },
    components: {
      schemas: components,
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "better-auth.session_token",
          description: "Set by signing in; sent automatically by the browser.",
        },
      },
    },
  };
}
