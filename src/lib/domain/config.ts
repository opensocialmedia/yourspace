/** Ignore starter placeholders instead of presenting a broken signup form. */
export function isConfigured(value: string | undefined): boolean {
  const trimmed = value?.trim();
  return Boolean(trimmed && !/REPLACE_ME|change-me|re_your_key_here|example\.com/i.test(trimmed));
}

export function subscriptionsConfigured(env: {
  NEXT_PUBLIC_TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
}): boolean {
  return [env.NEXT_PUBLIC_TURNSTILE_SITE_KEY, env.TURNSTILE_SECRET_KEY,
    env.RESEND_API_KEY, env.RESEND_FROM_EMAIL].every(isConfigured);
}
