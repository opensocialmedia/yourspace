// POST /api/subscribers — email capture (step 1 of double opt-in).

import { getConfig } from "@/lib/config";
import { handler, parseBody } from "@/lib/api";
import { subscribeSchema } from "@/lib/validation";
import {
  assertSameOrigin,
  enforceRateLimit,
  getClientIp,
} from "@/lib/services/security.service";
import { assertHuman } from "@/lib/services/turnstile.service";
import * as subscriberService from "@/lib/services/subscriber.service";

export const POST = handler(async (request) => {
  await assertSameOrigin(request);
  if (!(await getConfig()).subscriptionsEnabled) {
    return Response.json(
      { error: { code: "UNAVAILABLE", message: "Email subscriptions are coming soon." } },
      { status: 503 },
    );
  }
  const ip = getClientIp(request);
  await enforceRateLimit("subscribe", ip);

  const { email, turnstileToken } = await parseBody(request, subscribeSchema);
  await assertHuman(turnstileToken, ip);
  await subscriberService.subscribe(email);

  // Same response whether the email was new, pending, or already
  // confirmed — no list-probing.
  return Response.json({
    ok: true,
    message: "Check your inbox to confirm your subscription",
  });
});
