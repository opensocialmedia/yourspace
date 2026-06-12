// Tiny helpers shared by every API route: consistent error handling and
// strict body parsing.

import type { ZodSchema } from "zod";
import { errorResponse, validationError } from "@/lib/errors";

type RouteContext<P> = { params: Promise<P> };

/** Wraps a route handler so any thrown AppError becomes a clean JSON error. */
export function handler<P = Record<string, never>>(
  fn: (request: Request, context: RouteContext<P>) => Promise<Response>,
) {
  return async (request: Request, context: RouteContext<P>): Promise<Response> => {
    try {
      return await fn(request, context);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

/** Parse + validate a JSON body. Throws a 400 AppError on any mismatch. */
export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<T> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    throw validationError("Request body must be JSON");
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    const first = result.error.issues[0];
    throw validationError(
      first ? `${first.path.join(".") || "body"}: ${first.message}` : "Invalid request",
    );
  }
  return result.data;
}
