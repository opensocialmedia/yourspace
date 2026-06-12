// The follow/subscribe flow: email capture → double opt-in → access.

import { getConfig } from "@/lib/config";
import { validationError, notFound } from "@/lib/errors";
import { isValidEmailFormat, normalizeEmail } from "@/lib/domain/email";
import { randomHex, sha256Hex } from "@/lib/crypto";
import { CONFIRM_TOKEN_TTL_HOURS } from "@/lib/constants";
import * as subscribersRepo from "@/lib/repositories/subscribers.repo";
import * as profileRepo from "@/lib/repositories/profile.repo";
import { isDeliverableDomain } from "@/lib/services/email-verification.service";
import { sendConfirmationEmail } from "@/lib/services/email.service";
import { createSubscriberSession } from "@/lib/services/session.service";

/**
 * Step 1 of double opt-in. Validates the address, stores a *hashed*
 * confirm token, and emails the real token. Returns the same shape
 * whether or not the email was already subscribed, so this endpoint
 * can't be used to probe who is on the list.
 */
export async function subscribe(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  if (!isValidEmailFormat(normalized)) {
    throw validationError("That doesn't look like a valid email address");
  }
  if (!(await isDeliverableDomain(normalized))) {
    throw validationError(
      "That email domain doesn't appear to accept mail — check for typos",
    );
  }

  const { db, siteUrl } = await getConfig();

  const token = randomHex(32);
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(
    Date.now() + CONFIRM_TOKEN_TTL_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { alreadyConfirmed } = await subscribersRepo.upsertPending(
    db,
    normalized,
    tokenHash,
    expiresAt,
  );
  // Already-confirmed subscribers get no email; the response to the
  // visitor is identical either way.
  if (alreadyConfirmed) return;

  const profile = await profileRepo.getProfile(db);
  const siteName = profile?.display_name ?? "this site";
  const confirmUrl = `${siteUrl}/confirm?token=${token}`;
  await sendConfirmationEmail(normalized, confirmUrl, siteName);
}

/**
 * Step 2: the visitor clicked the email link and pressed Confirm.
 * Validates the token, marks them confirmed, and signs them in by
 * setting the subscriber session cookie.
 */
export async function confirm(token: string): Promise<void> {
  const { db } = await getConfig();
  const tokenHash = await sha256Hex(token);
  const subscriber = await subscribersRepo.confirmByTokenHash(db, tokenHash);
  if (!subscriber) {
    throw notFound("This confirmation link is invalid or has expired");
  }
  await createSubscriberSession(subscriber.id);
}

export async function listSubscribers() {
  const { db } = await getConfig();
  return subscribersRepo.list(db);
}

export async function deleteSubscriber(id: string): Promise<void> {
  const { db } = await getConfig();
  const deleted = await subscribersRepo.remove(db, id);
  if (!deleted) throw notFound("Subscriber not found");
}

/** CSV export for the admin page. */
export async function exportSubscribersCsv(): Promise<string> {
  const { db } = await getConfig();
  const subscribers = await subscribersRepo.list(db);
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = [
    "email,status,username,signed_up_at,confirmed_at",
    ...subscribers.map((s) =>
      [
        escape(s.email),
        s.status,
        escape(s.username ?? ""),
        s.createdAt,
        s.confirmedAt ?? "",
      ].join(","),
    ),
  ];
  return lines.join("\n");
}
