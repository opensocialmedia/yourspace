# yourspace

Your own subscriber-gated personal feed — looks like a social media
profile, works like a blog, runs **entirely on Cloudflare's free tier**.

Visitors see your profile, bio, links, and follower count. The posts stay
locked until they follow with their email (double opt-in, human-verified).
Once confirmed they can view everything, like/dislike, comment under a
fun auto-generated username, and share posts with rich link previews.
You manage everything — posts, comments, subscribers, profile — from a
password-protected `/admin` page.

| Layer | Service | Free tier |
|---|---|---|
| Hosting + API | Cloudflare Workers (OpenNext) | 100K requests/day |
| Database | Cloudflare D1 (SQLite) | 5 GB |
| Media storage | Cloudflare R2 | 10 GB, zero egress fees |
| Bot protection | Cloudflare Turnstile | free |
| Email | Resend | 3,000 emails/month |

---

## Deploy your own

Everything you must personalize is marked **`REPLACE_ME`** in
[wrangler.jsonc](wrangler.jsonc) — that's the only file you have to edit.
Your name, bio, photos, and links are set later in the admin UI, not in code.

### 0. Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free)
- A [Resend account](https://resend.com) (free) with a verified sending domain
- Node.js 20+ and npm

### 1. Clone and install

```bash
git clone <this-repo> && cd yourspace
npm install
npx wrangler login
```

### 2. Create your database and bucket

```bash
npx wrangler d1 create yourspace-db
npx wrangler r2 bucket create yourspace-media
```

The first command prints a `database_id` — paste it into
[wrangler.jsonc](wrangler.jsonc) where it says
`REPLACE_ME_WITH_YOUR_D1_DATABASE_ID`.

### 3. Create a Turnstile widget

Cloudflare dashboard → **Turnstile** → Add site → your domain.
You get two keys:

- **Site key** (public) → goes in `wrangler.jsonc` →
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- **Secret key** → set as a secret in step 5

### 4. Fill in the rest of wrangler.jsonc

Search for `REPLACE_ME` and set:

- `name` — your Worker's name
- `NEXT_PUBLIC_SITE_URL` — the URL your site will live at
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — from step 3
- `RESEND_FROM_EMAIL` — e.g. `You <hello@yourdomain.com>` (domain must be
  verified at [resend.com/domains](https://resend.com/domains))

### 5. Set your secrets

```bash
npx wrangler secret put ADMIN_PASSWORD       # your /admin password — make it long
npx wrangler secret put SESSION_SECRET       # run: openssl rand -base64 48
npx wrangler secret put RESEND_API_KEY       # from resend.com/api-keys
npx wrangler secret put TURNSTILE_SECRET_KEY # from step 3
```

### 6. Create the tables and deploy

```bash
npm run db:migrate:remote
npm run deploy
```

### 7. Make it yours

Open `https://your-site/admin`, log in with your `ADMIN_PASSWORD`, and:

1. **Profile** — upload your profile picture and header photo, set your
   name, bio, and links
2. **Posts** — write your first post

Done. Point your domain at the Worker (Cloudflare dashboard → your
Worker → Settings → Domains & Routes) and share the link.

---

## Local development

```bash
cp .dev.vars.example .dev.vars   # then edit it — see comments inside
npm run db:migrate:local
npm run dev                      # Next.js dev server with local D1/R2
```

`npm run preview` builds the real Worker and runs it locally in
workerd — closest thing to production before deploying.

| Script | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload + local bindings |
| `npm run preview` | Production build, served locally via Wrangler |
| `npm run deploy` | Build + deploy to Cloudflare |
| `npm run db:migrate:local` / `:remote` | Apply `migrations/` to D1 |
| `npm run typecheck` / `npm run lint` | The usual |

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
