// One error shape for the whole app. Services throw AppError; API routes
// catch it and convert to a JSON response. Anything else becomes a
// generic 500 so internals never leak to the client.

export type ErrorCode =
  | "VALIDATION"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "PAYLOAD_TOO_LARGE"
  | "INTERNAL";

const STATUS: Record<ErrorCode, number> = {
  VALIDATION: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS[code];
  }
}

export const validationError = (msg: string) => new AppError("VALIDATION", msg);
export const unauthorized = (msg = "Authentication required") =>
  new AppError("UNAUTHORIZED", msg);
export const forbidden = (msg = "Not allowed") => new AppError("FORBIDDEN", msg);
export const notFound = (msg = "Not found") => new AppError("NOT_FOUND", msg);
export const conflict = (msg: string) => new AppError("CONFLICT", msg);
export const rateLimited = (msg = "Too many requests — try again later") =>
  new AppError("RATE_LIMITED", msg);
export const payloadTooLarge = (msg: string) =>
  new AppError("PAYLOAD_TOO_LARGE", msg);

/** Convert any thrown value into a safe JSON Response. */
export function errorResponse(err: unknown): Response {
  if (err instanceof AppError) {
    return Response.json(
      { error: { code: err.code, message: err.message } },
      { status: err.status },
    );
  }
  console.error("Unhandled error:", err);
  return Response.json(
    { error: { code: "INTERNAL", message: "Something went wrong" } },
    { status: 500 },
  );
}
