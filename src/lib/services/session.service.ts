// Session handling: HMAC-signed, HttpOnly cookies. Two roles —
// "subscriber" (long-lived, grants feed access) and "admin"
// (short-lived, grants /admin and admin APIs).

import { cookies } from "next/headers";
import { getConfig } from "@/lib/config";
import { signToken, verifyToken } from "@/lib/crypto";
import {
  SUBSCRIBER_COOKIE,
  ADMIN_COOKIE,
  SUBSCRIBER_SESSION_DAYS,
  ADMIN_SESSION_HOURS,
} from "@/lib/constants";
import * as subscribersRepo from "@/lib/repositories/subscribers.repo";

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  // `secure` is safe to always set: browsers still accept secure cookies
  // on http://localhost during development.
  secure: true,
};

export async function createSubscriberSession(subscriberId: string): Promise<void> {
  const { sessionSecret } = await getConfig();
  const exp =
    Math.floor(Date.now() / 1000) + SUBSCRIBER_SESSION_DAYS * 24 * 60 * 60;
  const token = await signToken(
    { sub: subscriberId, role: "subscriber", exp },
    sessionSecret,
  );
  (await cookies()).set(SUBSCRIBER_COOKIE, token, {
    ...baseCookieOptions,
    maxAge: SUBSCRIBER_SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function createAdminSession(): Promise<void> {
  const { sessionSecret } = await getConfig();
  const exp = Math.floor(Date.now() / 1000) + ADMIN_SESSION_HOURS * 60 * 60;
  const token = await signToken({ sub: "admin", role: "admin", exp }, sessionSecret);
  (await cookies()).set(ADMIN_COOKIE, token, {
    ...baseCookieOptions,
    maxAge: ADMIN_SESSION_HOURS * 60 * 60,
  });
}

export async function clearAdminSession(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function clearSubscriberSession(): Promise<void> {
  (await cookies()).delete(SUBSCRIBER_COOKIE);
}

/**
 * The verified subscriber id for this request, or null. Checks the
 * cookie signature AND that the subscriber still exists and is
 * confirmed — deleting a subscriber in the admin page revokes access
 * immediately, not when their cookie expires.
 */
export async function getSubscriberId(): Promise<string | null> {
  const token = (await cookies()).get(SUBSCRIBER_COOKIE)?.value;
  if (!token) return null;
  const { sessionSecret, db } = await getConfig();
  const payload = await verifyToken(token, sessionSecret);
  if (!payload || payload.role !== "subscriber") return null;
  const subscriber = await subscribersRepo.getById(db, payload.sub);
  if (!subscriber || subscriber.status !== "confirmed") return null;
  return subscriber.id;
}

/** True when the request carries a valid admin session. */
export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const { sessionSecret } = await getConfig();
  const payload = await verifyToken(token, sessionSecret);
  return payload?.role === "admin";
}
