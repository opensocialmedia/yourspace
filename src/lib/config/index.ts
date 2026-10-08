// The only place that reads environment variables and Cloudflare bindings.
// Everything else asks this module, so a missing secret fails loudly here
// with a message that says exactly what to do.

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";
import { isConfigured, subscriptionsConfigured } from "@/lib/domain/config";

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
  if (typeof value !== "string" || !isConfigured(value)) {
    throw new Error(`Missing required environment variable ${name}. ${SECRET_HELP}`);
  }
  return value;
}

export async function getConfig() {
  const env = await getEnv();
  // A fresh deployment can use its actual host without another setup field.
  // Set NEXT_PUBLIC_SITE_URL explicitly for a canonical custom domain.
  let siteUrl = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!isConfigured(siteUrl)) {
    const requestHeaders = await headers();
    const host = requestHeaders.get("host");
    if (!host) throw new Error("Missing request host. Set NEXT_PUBLIC_SITE_URL.");
    const protocol = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ? "http" : "https";
    const url = new URL(`${protocol}://${host}`);
    if (url.host !== host || url.username || url.password || url.pathname !== "/") {
      throw new Error("Invalid request host. Set NEXT_PUBLIC_SITE_URL.");
    }
    siteUrl = url.origin;
  }
  return {
    db: env.DB,
    media: env.MEDIA,
    siteUrl: siteUrl!.replace(/\/$/, ""),
    turnstileSiteKey: env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
    resendFromEmail: env.RESEND_FROM_EMAIL || "",
    adminPassword: required(env, "ADMIN_PASSWORD"),
    sessionSecret: required(env, "SESSION_SECRET"),
    resendApiKey: env.RESEND_API_KEY || "",
    turnstileSecretKey: env.TURNSTILE_SECRET_KEY || "",
    subscriptionsEnabled: subscriptionsConfigured(env),
  };
}

export type Config = Awaited<ReturnType<typeof getConfig>>;
