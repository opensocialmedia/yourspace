# yourspace

Your own subscriber-gated personal feed: a social-style profile with the control
of a personal blog. Publish text, photos, videos, and links; manage followers,
comments, and your profile from `/admin`.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/opensocialmedia/yourspace)

## Fastest deployment: use the button

1. Click **Deploy to Cloudflare** above and sign in to Cloudflare and GitHub.
2. Choose your repository, Worker, D1 database, and R2 bucket names.
   Cloudflare creates a copy of this repo and provisions the database and bucket.
   Enable R2 on your Cloudflare account if prompted. Cloudflare may require a
   payment method to activate R2; review its terms and pricing before continuing.
3. Set the two required Worker secrets:
   - `ADMIN_PASSWORD`: a long, unique password for `/admin`.
   - `SESSION_SECRET`: a random signing key. Generate it with
     `openssl rand -base64 48` or your password manager.
4. Use **`npm run deploy`** as the deploy command. It builds the Worker, applies
   the D1 migrations, and publishes. The build command can be left empty because
   the deploy command includes the production build.
5. Open the resulting `workers.dev` URL, then `/admin`. Set your profile and
   write your first post.

No account IDs, database IDs, email provider, custom domain, or code edits are
needed for this first deployment. The site uses the current request's host by
default. Posts remain gated and the signup form says subscriptions are coming
soon until you connect email and bot protection below.

The button uses Cloudflare Workers Builds. See [Cloudflare's deploy-button
documentation](https://developers.cloudflare.com/workers/platform/deploy-buttons/)
for supported resources and setup behavior.

## Deploy from a local clone

Requires **Node.js 22.13+**, npm, a Cloudflare account, an enabled R2 service,
and a `workers.dev` subdomain (shown under Cloudflare → Workers & Pages).

```bash
git clone https://github.com/opensocialmedia/yourspace.git
cd yourspace
npm ci
npm run setup
```

The guided setup logs in to Cloudflare, lets you choose an account, asks for a
Worker name and full site URL, creates or reuses D1/R2 resources, generates
secure admin/session secrets, applies the schema, and deploys. It asks for only
the Wrangler OAuth scopes needed for this workflow. Review the consent screen.

Your account configuration goes into **`wrangler.local.json`** and your generated
admin password into **`.dev.vars`**. Both are gitignored; the public
`wrangler.jsonc` stays portable. Save the admin password in your password manager.
Setup can be rerun from the same checkout: it reuses resources and preserves
existing secrets. Use a separate clone for another account or Worker.

For later code changes:

```bash
npm run deploy
```

The npm commands automatically use `wrangler.local.json` when it exists,
otherwise `wrangler.jsonc`. When running Wrangler directly in a locally configured
checkout, include **`--config wrangler.local.json`**. For a clone produced by the
deploy button, Cloudflare fills in `wrangler.jsonc` instead.

## Enable email subscriptions when ready

The profile and admin area work without Resend or Turnstile. Email subscriptions
require all four of these real values; unset or starter placeholder values keep
the form disabled and the signup API returns 503 without collecting an address.

| Setting | Where to set it | Source |
|---|---|---|
| `RESEND_FROM_EMAIL` | Wrangler `vars` | E.g. `Your Name <hello@yourdomain.com>`; verify the domain at [Resend](https://resend.com/domains) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Wrangler `vars` | Create a widget for your blog hostname in Cloudflare → Turnstile |
| `RESEND_API_KEY` | Worker secret | [Resend API keys](https://resend.com/api-keys) |
| `TURNSTILE_SECRET_KEY` | Worker secret | Secret paired with that Turnstile widget |

Edit the selected Wrangler config's public `vars`, then set the secrets:

```bash
# Local-wizard checkout: add --config wrangler.local.json to each command.
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put TURNSTILE_SECRET_KEY
npm run deploy
```

Never put secret keys in `vars` or commit `.dev.vars`. For local development,
add the optional secrets to `.dev.vars`. Cloudflare's Turnstile test keys are
for local testing only; use real widget keys on your public blog. Setup uploads
only the two required admin/session secrets, so reruns do not replace your
existing production credentials. For a Worker that is already live, use
`npm run deploy`; setup refuses to adopt an existing Worker's credentials from
a fresh checkout.

For a custom domain, attach it in Worker → Settings → Domains & Routes, set
`NEXT_PUBLIC_SITE_URL` to that HTTPS origin without a trailing slash, add the
hostname to Turnstile, and redeploy. This gives confirmation emails and shared
posts a canonical URL. Leave the variable empty to use the request's host.

## Local development

No Cloudflare login or cloud resources are needed:

```bash
npm ci
npm run setup:local
npm run dev
```

`setup:local` generates private secrets, applies the local D1 schema, and generates
Cloudflare types. Read your admin password from `.dev.vars`, then visit
`http://localhost:3000/admin`. `npm run preview` builds and runs the actual Worker
locally with its local database and bucket.

| Command | What it does |
|---|---|
| `npm run setup` | Guided Cloudflare provisioning and first deploy |
| `npm run setup:local` | Generate local secrets, schema, and types |
| `npm run dev` | Next.js dev server with local D1/R2 |
| `npm run preview` | Local schema + production Worker build and preview |
| `npm run deploy` | Production build + remote migrations + deploy |
| `npm run db:migrate:local` / `:remote` | Apply migrations through the `DB` binding |
| `npm run cf-typegen` | Regenerate Cloudflare types |
| `npm test` | Setup, rerun, and failure-path tests |
| `npm run typecheck` / `npm run lint` | TypeScript and source lint checks |

## Services and costs

This app is designed to fit the free allowances of Workers, D1, R2, Turnstile,
and Resend for a small personal blog. Free allowances are not a spending cap;
usage beyond them can be billed on paid plans. The setup script does not select
or upgrade a plan. Review the current [Cloudflare pricing](https://www.cloudflare.com/plans/developer-platform/)
and [Resend pricing](https://resend.com/pricing) for your account.

## Troubleshooting

- **Homepage says subscriptions are coming soon:** complete all four email/Turnstile
  settings and redeploy. There is no bypass of the subscriber gate.
- **Missing admin/session secret:** use the deploy-button secret fields or rerun
  `npm run setup:local` / `npm run setup` as appropriate.
- **R2 is unavailable:** enable R2 in the Cloudflare dashboard, then rerun setup.
- **Wrong account or Worker:** use a separate clone. The wizard stops rather than
  retargeting an existing checkout.
- **Setup stopped midway:** resolve the reported Cloudflare/auth/network error
  and rerun. Existing named resources are reused; failed migrations stop publishing.
- **Direct Wrangler commands target the wrong config:** pass
  `--config wrangler.local.json` when that file exists.
- **Lint after a build:** generated `.open-next`, `.wrangler`, and Cloudflare type
  files are excluded; only source code is linted.

---

## How the email gate works

1. Visitor enters their email (format-checked, MX-record-checked) and
   passes a Turnstile human check
2. A pending subscriber row is stored in D1 — with a **SHA-256 hash** of
   a one-time token, never the token itself
3. Resend delivers a confirmation email (React Email template in
   [src/emails/](src/emails/confirm-subscription.tsx))
4. The visitor clicks through to `/confirm` and presses the button
   (a POST, so inbox prefetch bots can't consume the link)
5. They're marked confirmed and receive a signed, HttpOnly session
   cookie that unlocks the feed

Post content is **never sent to the browser** without a valid session —
the gate is enforced server-side, including for media files streamed
from R2.

## Security notes

- Admin auth: constant-time password check, rate-limited (5 tries / 15
  min per IP), 24 h HMAC-signed session cookie
- All cookies: `HttpOnly`, `Secure`, `SameSite=Lax`
- CSRF: Origin-header verification on every state-changing request
- All inputs validated with Zod; all SQL parameterized
- Confirm tokens: 256-bit, stored hashed, 24 h expiry, single-use
- Security headers + CSP set in [next.config.ts](next.config.ts)
- Rate limits on subscribe, comment, and reaction endpoints

## Architecture

```
src/
  lib/            # The "brain" — no UI
    domain/       # Pure business rules
    validation/   # Zod schemas for incoming data
    repositories/ # The only code that touches D1/R2
    services/     # Orchestrates repositories + domain rules
    config/       # Env access, fails loudly when misconfigured
    errors/       # One error shape for the whole app
    constants/    # Every hardcoded value, named and explained
    crypto/       # WebCrypto helpers (HMAC sessions, hashing)
  app/
    api/          # The locked door — all requests pass through here
    (public)/     # Feed, confirm page, shareable post pages
    admin/        # Password-protected admin UI
  emails/         # React Email templates
  components/     # Display only
  hooks/          # How the UI talks to the API
  types/          # Shared TypeScript definitions
```

## License

MIT — do whatever you like, no attribution needed.
# yourspace
