import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Makes Cloudflare bindings (D1, R2, secrets from .dev.vars) available
// during `next dev`.
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  // Media is served straight from R2 through our own /api/media route, so
  // Next's image optimizer (which needs extra setup on Workers) is off.
  images: { unoptimized: true },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            // 'unsafe-inline' for script/style is required by Next.js
            // hydration and Tailwind. challenges.cloudflare.com is the
            // Turnstile widget. frame-ancestors backs up X-Frame-Options.
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob:",
              "font-src 'self'",
              "connect-src 'self' https://challenges.cloudflare.com",
              "frame-src https://challenges.cloudflare.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
