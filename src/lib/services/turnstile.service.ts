// Server-side verification of Cloudflare Turnstile tokens (the "prove
// you're human" widget on the subscribe form).

import { getConfig } from "@/lib/config";
import { validationError } from "@/lib/errors";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function assertHuman(
  turnstileToken: string,
  clientIp: string,
): Promise<void> {
  const { turnstileSecretKey } = await getConfig();

  const response = await fetch(VERIFY_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      secret: turnstileSecretKey,
      response: turnstileToken,
      remoteip: clientIp,
    }),
  });

  const result = (await response.json()) as { success: boolean };
  if (!result.success) {
    throw validationError("Human verification failed — please try again");
  }
}
