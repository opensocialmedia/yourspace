// The only place that reads environment variables and Cloudflare bindings.
// Everything else asks this module, so a missing secret fails loudly here
// with a message that says exactly what to do.

import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface Env {
  // Bindings (configured in wrangler.jsonc)
  DB: D1Database;
  MEDIA: R2Bucket;

  // Public vars (wrangler.jsonc → "vars")
  NEXT_PUBLIC_SITE_URL: string;
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: string;
  RESEND_FROM_EMAIL: string;

  // Secrets (wrangler secret put <NAME>, or .dev.vars locally)
  ADMIN_PASSWORD: string;
  SESSION_SECRET: string;
  RESEND_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
}

const SECRET_HELP =
  "Set it with `npx wrangler secret put <NAME>` (production) or in .dev.vars (local dev). See README → Secrets.";

export async function getEnv(): Promise<Env> {
  const { env } = await getCloudflareContext({ async: true });
  return env as unknown as Env;
}

function required(env: Env, name: keyof Env): string {
  const value = env[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing required environment variable ${name}. ${SECRET_HELP}`);
  }
  return value;
}

export async function getConfig() {
  const env = await getEnv();
  return {
    db: env.DB,
    media: env.MEDIA,
    siteUrl: required(env, "NEXT_PUBLIC_SITE_URL").replace(/\/$/, ""),
    turnstileSiteKey: required(env, "NEXT_PUBLIC_TURNSTILE_SITE_KEY"),
    resendFromEmail: required(env, "RESEND_FROM_EMAIL"),
    adminPassword: required(env, "ADMIN_PASSWORD"),
    sessionSecret: required(env, "SESSION_SECRET"),
    resendApiKey: required(env, "RESEND_API_KEY"),
    turnstileSecretKey: required(env, "TURNSTILE_SECRET_KEY"),
  };
}

export type Config = Awaited<ReturnType<typeof getConfig>>;
