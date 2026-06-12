// Sends transactional email through Resend, with bodies rendered from
// React Email templates.

import { Resend } from "resend";
import { render } from "@react-email/render";
import { createElement } from "react";
import { getConfig } from "@/lib/config";
import ConfirmSubscriptionEmail from "@/emails/confirm-subscription";

export async function sendConfirmationEmail(
  to: string,
  confirmUrl: string,
  siteName: string,
): Promise<void> {
  const { resendApiKey, resendFromEmail } = await getConfig();
  const resend = new Resend(resendApiKey);

  const html = await render(
    createElement(ConfirmSubscriptionEmail, { siteName, confirmUrl }),
  );

  const { error } = await resend.emails.send({
    from: resendFromEmail,
    to,
    subject: `Confirm your subscription to ${siteName}`,
    html,
  });

  if (error) {
    // Bubble up as a generic failure — the subscriber row stays pending
    // and the visitor can simply try again.
    throw new Error(`Resend send failed: ${error.message}`);
  }
}
