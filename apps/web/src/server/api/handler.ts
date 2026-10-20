import "server-only";
import { z } from "zod";
import { forbidden, json, sameOrigin, unauthorized } from "../http";
import { ServiceError } from "../errors";
import { currentUser } from "../session";

/**
 * Glue for REST routes that call a service: sign-in and same-origin checks, UUID path parameters, body validation, and turning a
 * ServiceError into its HTTP answer (anything else becomes a generic 500; details go to the log, never the response). Rules live in the
 * service; a route only describes its inputs and calls it.
 */
const uuid = z.string().uuid();

type Params = Record<string, string>;
type Ctx<S extends z.ZodType | undefined> = {
  userId: string;
  params: Params;
  body: S extends z.ZodType ? z.infer<S> : undefined;
  query: URLSearchParams;
};

export function handler<S extends z.ZodType | undefined = undefined>(
  opts: { write?: boolean; body?: S; status?: number },
  run: (ctx: Ctx<S>) => Promise<unknown>,
) {
  return async (req: Request, { params }: { params?: Promise<Params> } = {}) => {
    if (opts.write && !sameOrigin(req)) return forbidden();
    const user = await currentUser();
    if (!user) return unauthorized();
    const path = (await params) ?? {};
    for (const v of Object.values(path)) if (!uuid.safeParse(v).success) return json({ error: "Not found." }, 404);
    let body: unknown;
    if (opts.body) {
      const parsed = opts.body.safeParse(await req.json().catch(() => null));
      if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "That doesn’t look right." }, 400);
      body = parsed.data;
    }
    try {
      const data = await run({ userId: user.id, params: path, body: body as Ctx<S>["body"], query: new URL(req.url).searchParams });
      return json({ data: data ?? null }, opts.status ?? 200);
    } catch (e) {
      if (e instanceof ServiceError) return json({ error: e.message }, e.status);
      console.error("request failed", e instanceof Error ? e.name : "unknown error");
      return json({ error: "Something went wrong. Try again." }, 500);
    }
  };
}
