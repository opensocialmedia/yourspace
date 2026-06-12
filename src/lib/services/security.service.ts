// Request-level security guards shared by API routes.

import { forbidden, unauthorized, rateLimited } from "@/lib/errors";
import { getConfig } from "@/lib/config";
import * as rateLimitRepo from "@/lib/repositories/rate-limit.repo";
import { RATE_LIMITS } from "@/lib/constants";
import { isAdmin, getSubscriberId } from "@/lib/services/session.service";

/** Cloudflare puts the real client IP on this header. */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/**
 * CSRF guard for state-changing requests: the Origin header must match
 * our own site. Combined with SameSite=Lax cookies this blocks
 * cross-site request forgery without needing per-form tokens.
 */
export async function assertSameOrigin(request: Request): Promise<void> {
  const origin = request.headers.get("origin");
  if (!origin) return; // non-browser clients (curl) have no ambient cookies
  const { siteUrl } = await getConfig();
  const allowed = new Set([new URL(siteUrl).origin]);
  // Allow localhost during development.
  const host = request.headers.get("host");
  if (host?.startsWith("localhost")) allowed.add(`http://${host}`);
  if (!allowed.has(origin)) {
    throw forbidden("Cross-origin request rejected");
  }
}

/** Throws 429 once `name`'s fixed window fills up for this key. */
export async function enforceRateLimit(
  name: keyof typeof RATE_LIMITS,
  key: string,
): Promise<void> {
  const { db } = await getConfig();
  const { max, windowSeconds } = RATE_LIMITS[name];
  const count = await rateLimitRepo.hit(db, `${name}:${key}`, windowSeconds);
  if (count > max) throw rateLimited();
}

/** Throws 401 unless the request has a valid admin session. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw unauthorized("Admin session required");
}

/** Throws 401 unless the request has a confirmed subscriber session. */
export async function requireSubscriber(): Promise<string> {
  const id = await getSubscriberId();
  if (!id) throw unauthorized("Subscribe to do that");
  return id;
}
