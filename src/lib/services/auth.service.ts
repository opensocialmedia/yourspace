// Admin authentication. One password (a Wrangler secret), compared in
// constant time, behind a rate limit, yielding a short-lived signed
// session cookie.

import { getConfig } from "@/lib/config";
import { unauthorized } from "@/lib/errors";
import { safeEqual } from "@/lib/crypto";
import {
  createAdminSession,
  clearAdminSession,
} from "@/lib/services/session.service";
import { enforceRateLimit } from "@/lib/services/security.service";

export async function adminLogin(password: string, clientIp: string): Promise<void> {
  // Rate limit BEFORE comparing, so brute force burns out quickly.
  await enforceRateLimit("adminLogin", clientIp);

  const { adminPassword } = await getConfig();
  if (!(await safeEqual(password, adminPassword))) {
    throw unauthorized("Wrong password");
  }
  await createAdminSession();
}

export async function adminLogout(): Promise<void> {
  await clearAdminSession();
}
