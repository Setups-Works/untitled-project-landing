import { z } from "zod";
import {
  entryCreate,
  entryUpdate,
  inviteBody,
  journalName,
  respondBody,
  roleBody,
} from "../../server/services/collaboration/collaboration.schema";
import { healthSyncInput } from "../../server/services/health/health.schema";
import { RESOURCES } from "./resources";

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
  // `provider` or `provider:model` (the model picker lists one entry per model, see /api/v1/ai/status).
  provider: z.string().regex(/^[a-z0-9_-]{1,40}(:[A-Za-z0-9._/-]{1,100})?$/),
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
const healthDay = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  steps: z.number().int().nullable(),
  distance_m: z.number().int().nullable(),
  active_kcal: z.number().int().nullable(),
  resting_hr: z.number().int().nullable(),
  hr_min: z.number().int().nullable(),
  hr_max: z.number().int().nullable(),
  sleep_minutes: z.number().int().nullable(),
  source: z.enum(["healthkit", "health_connect", "unknown"]),
  synced_at: z.string(),
});
const healthListResponse = z.object({ data: z.array(healthDay) });
const healthSavedResponse = z.object({ data: z.object({ saved: z.number().int() }) });
const sjRole = z.enum(["owner", "editor", "viewer"]);
const sjPerson = z.object({ id: uuid, username: z.string().nullable(), name: z.string(), image: z.string().nullable() });
const sjJournal = z.object({
  id: uuid,
  name: z.string(),
  role: sjRole,
  owner: sjPerson,
  member_count: z.number().int(),
  entry_count: z.number().int(),
  last_entry_at: z.string().nullable(),
  created_at: z.string(),
});
const sjInvite = z.object({
  id: uuid,
  journal_id: uuid,
  journal_name: z.string(),
  role: z.enum(["editor", "viewer"]),
  invitee: sjPerson,
  inviter: sjPerson,
  created_at: z.string(),
});
const sjDetail = sjJournal.extend({
  me: uuid,
  members: z.array(z.object({ person: sjPerson, role: sjRole, joined_at: z.string() })),
  invites: z.array(sjInvite),
});
const sjEntry = z.object({
  id: uuid,
  journal_id: uuid,
  entry_date: z.string(),
  body: z.string(),
  kind: z.enum(["text", "voice"]),
  attachments: z.array(z.object({ path: z.string(), name: z.string(), type: z.string(), size: z.number() })),
  created_at: z.string(),
  updated_at: z.string(),
  author: sjPerson,
});
const accountSettings = z.object({
  data: z.object({
    id: uuid,
    email: z.string(),
    name: z.string(),
    username: z.string().nullish(),
    providers: z.array(z.string()),
    hasPassword: z.boolean(),
    preferences: z.record(z.string(), z.unknown()),
  }),
});
const accountAction = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reset-workspace"), confirmation: z.string().max(20) }),
  z.object({ action: z.literal("delete-account"), confirmation: z.string().max(254) }),
]);
const chatShareRequest = z.object({ shared: z.boolean() });
const chatShareResponse = z.object({ data: z.object({ share_token: z.string().nullable() }) });
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
  HealthSyncRequest: healthSyncInput,
  HealthListResponse: healthListResponse,
  HealthSavedResponse: healthSavedResponse,
  JournalShareRequest: z.object({ shared: z.boolean() }),
  AccountSettings: accountSettings,
  AccountAction: accountAction,
  ChatShareRequest: chatShareRequest,
  ChatShareResponse: chatShareResponse,
  SharedJournal: sjJournal,
  SharedJournalDetail: sjDetail,
  SharedJournalInvite: sjInvite,
  SharedJournalEntry: sjEntry,
  SharedJournalName: journalName,
  SharedJournalInviteRequest: inviteBody,
  SharedJournalRoleRequest: roleBody,
  SharedJournalRespondRequest: respondBody,
  SharedJournalEntryInput: entryCreate,
  SharedJournalEntryUpdate: entryUpdate,
  Ok: okResponse,
  Error: errorResponse,
};

const ref = (name: keyof typeof schemas) => ({ $ref: `#/components/schemas/${name}` });
const json = (name: keyof typeof schemas) => ({ "application/json": { schema: ref(name) } });
const body = (name: keyof typeof schemas) => ({ required: true, content: json(name) });
const err = (description: string) => ({ description, content: json("Error") });
const common = { "401": err("Not signed in."), "403": err("Request did not come from this site, or the resource is not yours.") };
const secured = [{ cookieAuth: [] }];

/**
 * Shared journals (features/collaboration): create journals, invite people by username, answer invitations, manage roles, write entries.
 * Every answer is `{ data }`; permissions are decided by row-level security, and a journal you aren't in is simply "not found".
 */
function sharedJournalPaths() {
  const tags = ["Shared journals"];
  const idParam = { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } };
  const sub = (name: string) => ({ name, in: "path", required: true, schema: { type: "string", format: "uuid" } });
  const data = (inner: object, description = "OK") => ({
    description,
    content: { "application/json": { schema: { type: "object", properties: { data: inner } } } },
  });
  const list = (name: keyof typeof schemas) => data({ type: "array", items: ref(name) });
  const one = (name: keyof typeof schemas, description?: string) => data(ref(name), description);
  const empty = data({ type: "null" });
  const fail = { "400": err("Invalid input."), "404": err("Not found, or you are not in that journal."), ...common };
  const op = (summary: string, ok: object, extra: Record<string, unknown> = {}, status = "200") => ({
    tags,
    summary,
    security: secured,
    ...extra,
    responses: { [status]: ok, ...fail },
  });
  return {
    "/api/v1/shared-journals": {
      get: op("The journals you own or belong to", list("SharedJournal")),
      post: op(
        "Start a shared journal (you are its owner)",
        one("SharedJournalDetail", "Created"),
        { requestBody: body("SharedJournalName") },
        "201",
      ),
    },
    "/api/v1/shared-journals/{id}": {
      get: op("One journal with its people (open invitations only for the owner)", one("SharedJournalDetail"), { parameters: [idParam] }),
      patch: op("Rename (owner)", one("SharedJournalDetail"), { parameters: [idParam], requestBody: body("SharedJournalName") }),
      delete: op("Delete the journal, its entries and files (owner)", empty, { parameters: [idParam] }),
    },
    "/api/v1/shared-journals/{id}/invites": {
      post: op(
        "Invite someone by username (owner)",
        data({ type: "object", properties: { id: { type: "string", format: "uuid" } } }, "Sent"),
        {
          parameters: [idParam],
          requestBody: body("SharedJournalInviteRequest"),
          description:
            "They are added only after they accept. 404: no such username. 409: already in the journal, already invited, or the journal is full. 429: too many invitations.",
        },
        "201",
      ),
    },
    "/api/v1/shared-journals/{id}/invites/{inviteId}": {
      delete: op("Withdraw an invitation that has not been answered (owner)", empty, { parameters: [idParam, sub("inviteId")] }),
    },
    "/api/v1/shared-journals/{id}/members/{userId}": {
      patch: op("Change someone's role (owner)", empty, {
        parameters: [idParam, sub("userId")],
        requestBody: body("SharedJournalRoleRequest"),
      }),
      delete: op("Remove someone (owner), or leave by passing your own id", empty, { parameters: [idParam, sub("userId")] }),
    },
    "/api/v1/shared-journals/{id}/entries": {
      get: op(
        "A page of entries, newest day first",
        data({ type: "object", properties: { entries: { type: "array", items: ref("SharedJournalEntry") }, more: { type: "boolean" } } }),
        {
          parameters: [
            idParam,
            {
              name: "cursor",
              in: "query",
              description: "The oldest day you already have (YYYY-MM-DD).",
              schema: { type: "string", format: "date" },
            },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 200, default: 100 } },
          ],
        },
      ),
      post: op(
        "Add an entry (owner or editor)",
        one("SharedJournalEntry", "Created"),
        { parameters: [idParam], requestBody: body("SharedJournalEntryInput") },
        "201",
      ),
    },
    "/api/v1/shared-journals/{id}/entries/{entryId}": {
      patch: op("Edit your own entry", one("SharedJournalEntry"), {
        parameters: [idParam, sub("entryId")],
        requestBody: body("SharedJournalEntryUpdate"),
      }),
      delete: op("Delete your own entry, or any entry as the owner", empty, { parameters: [idParam, sub("entryId")] }),
    },
    "/api/v1/shared-journal-invites": {
      get: op("Invitations to shared journals that are waiting for your answer", list("SharedJournalInvite")),
    },
    "/api/v1/shared-journal-invites/{id}": {
      post: op(
        "Accept or decline an invitation addressed to you",
        data({ type: "object", properties: { journalId: { type: "string", format: "uuid" } } }),
        { parameters: [idParam], requestBody: body("SharedJournalRespondRequest") },
      ),
    },
  };
}

export function buildOpenApi() {
  const components: Record<string, unknown> = {};
  for (const [name, schema] of Object.entries(schemas)) {
    const { $schema: _ignored, ...js } = z.toJSONSchema(schema, { io: "input", unrepresentable: "any" }) as Record<string, unknown>;
    void _ignored;
    components[name] = js;
  }
  // Notes, to-dos and journal entries: list, create, read, change, delete, from the shared resource definitions.
  const resourcePaths: Record<string, unknown> = {};
  const names: Record<string, string> = { notes: "Note", tasks: "Task", journal: "JournalEntry" };
  const toJs = (s: z.ZodType, io: "input" | "output") => {
    const { $schema: _s, ...js } = z.toJSONSchema(s, { io, unrepresentable: "any" }) as Record<string, unknown>;
    void _s;
    return js;
  };
  const idParam = { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } };
  for (const r of RESOURCES) {
    const n = names[r.key];
    components[n] = toJs(r.row, "output");
    components[`${n}Input`] = toJs(r.create, "input");
    components[`${n}Update`] = toJs(r.update, "input");
    const r$ = (s: string) => ({ $ref: `#/components/schemas/${s}` });
    const one = (description: string) => ({
      description,
      content: { "application/json": { schema: { type: "object", properties: { data: r$(n) } } } },
    });
    const filterParams = Object.entries(r.filters).map(([name, kind]) => ({
      name,
      in: "query",
      required: false,
      schema: kind === "boolean" ? { type: "boolean" } : kind === "date" ? { type: "string", format: "date" } : { type: "string" },
    }));
    resourcePaths[r.path] = {
      get: {
        tags: [r.tag],
        summary: `List your ${r.singular}s`,
        security: secured,
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 500, default: 100 } },
          { name: "offset", in: "query", schema: { type: "integer", minimum: 0, default: 0 } },
          ...filterParams,
        ],
        responses: {
          "200": {
            description: "The list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { type: "array", items: r$(n) }, limit: { type: "integer" }, offset: { type: "integer" } },
                },
              },
            },
          },
          "400": err("Bad filter."),
          "401": common["401"],
        },
      },
      post: {
        tags: [r.tag],
        summary: `Create a ${r.singular}`,
        security: secured,
        requestBody: { required: true, content: { "application/json": { schema: r$(`${n}Input`) } } },
        responses: { "201": one("Created"), "400": err("Invalid input."), ...common },
      },
    };
    resourcePaths[`${r.path}/{id}`] = {
      parameters: [idParam],
      get: {
        tags: [r.tag],
        summary: `Read one ${r.singular}`,
        security: secured,
        responses: { "200": one("The item"), "401": common["401"], "404": err("Not found.") },
      },
      patch: {
        tags: [r.tag],
        summary: `Change a ${r.singular}`,
        description: "Send only the fields to change.",
        security: secured,
        requestBody: { required: true, content: { "application/json": { schema: r$(`${n}Update`) } } },
        responses: { "200": one("Updated"), "400": err("Invalid input."), ...common, "404": err("Not found.") },
      },
      delete: {
        tags: [r.tag],
        summary: `Delete a ${r.singular}`,
        description: r.key === "tasks" ? undefined : "Files attached to it are deleted too.",
        security: secured,
        responses: { "200": { description: "Deleted", content: json("Ok") }, ...common, "404": err("Not found.") },
      },
    };
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
      { name: "To-do", description: "To-dos, including repeating ones" },
      { name: "Notes", description: "Notes (Markdown) with colours, pins and files" },
      { name: "Journal", description: "Journal entries by day" },
      { name: "Health", description: "Daily activity, sleep and heart-rate totals synced from the phone" },
      { name: "AI", description: "Assistant replies and confirmed drafts" },
      { name: "Data", description: "Row-level-security protected data door used by the web app" },
      { name: "Realtime", description: "Server-sent events" },
      { name: "Storage", description: "Files in private and public buckets" },
      { name: "Config", description: "Public deployment info" },
      { name: "Auth", description: "Provided by Better Auth (see its documentation for every endpoint)" },
    ],
    paths: {
      ...resourcePaths,
      "/api/v1/health": {
        get: {
          tags: ["Health"],
          summary: "Your recent daily health totals, newest first",
          security: secured,
          parameters: [{ name: "days", in: "query", schema: { type: "integer", minimum: 1, maximum: 90, default: 14 } }],
          responses: {
            "200": { description: "OK", content: json("HealthListResponse") },
            "401": common["401"],
            "500": err("Could not load."),
          },
        },
        put: {
          tags: ["Health"],
          summary: "Save daily totals read from Apple Health or Health Connect",
          description:
            "Sent by the mobile app. Each day is replaced, so the latest sync of a day wins. Only daily aggregates are stored, never raw samples. A metric the phone has no data for is null or omitted.",
          security: secured,
          requestBody: body("HealthSyncRequest"),
          responses: {
            "200": { description: "Saved", content: json("HealthSavedResponse") },
            "400": err("Invalid input."),
            ...common,
            "500": err("Could not save."),
          },
        },
      },
      "/api/v1/account/settings": {
        get: {
          tags: ["Account"],
          summary: "Your account facts and profile preferences (the app's settings bootstrap)",
          security: secured,
          responses: {
            "200": { description: "OK", content: json("AccountSettings") },
            "401": common["401"],
            "500": err("Could not load."),
          },
        },
      },
      "/api/v1/account/actions": {
        post: {
          tags: ["Account"],
          summary: "Reset your workspace or delete your account, after typing the confirmation",
          description: "reset-workspace needs the word “reset”; delete-account needs your email address. Both are permanent.",
          security: secured,
          requestBody: body("AccountAction"),
          responses: {
            "200": { description: "Done", content: json("Ok") },
            "400": err("Invalid input, or the confirmation doesn’t match."),
            ...common,
            "500": err("Could not complete."),
          },
        },
      },
      "/api/v1/chats/{id}/share": {
        post: {
          tags: ["Chat"],
          summary: "Turn the public link of one of your chats on or off",
          security: secured,
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: body("ChatShareRequest"),
          responses: {
            "200": { description: "OK", content: json("ChatShareResponse") },
            "400": err("Invalid input."),
            ...common,
            "404": err("Chat not found."),
          },
        },
      },
      "/api/v1/journal/{id}/share": {
        post: {
          tags: ["Journal"],
          summary: "Turn the public link of one of your entries on or off",
          description:
            "On makes a new secret token (the page is /share/journal/{token}, read-only, no name); off clears it and ends the old link at once.",
          security: secured,
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: body("JournalShareRequest"),
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { data: { type: "object", properties: { share_token: { type: ["string", "null"] } } } },
                  },
                },
              },
            },
            "400": err("Invalid input."),
            ...common,
            "404": err("Entry not found."),
          },
        },
      },
      ...sharedJournalPaths(),
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
