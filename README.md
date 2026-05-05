# maquette

Dynamic QR codes + per-placement analytics for event posters.

You mint one short URL per placement (EECS bulletin, LinkedIn post,
Instagram story, …). Scans are logged with UA/device/geo, then redirected
to your Luma page. A dashboard shows totals, per-placement breakdown,
time series, and unique-visitor dedup — so you can tell which spot is
actually driving RSVPs.

Backend: InsForge (Postgres + Auth). Frontend + redirect handler:
Next.js 16 on Vercel.

## Local development

```bash
# Install
npm install

# Env — copy and fill in
cp .env.example .env.local

# Apply the schema to the linked InsForge project
npx @insforge/cli db migrations up --all

# Run
npm run dev
```

Env vars:
- `NEXT_PUBLIC_INSFORGE_URL` / `NEXT_PUBLIC_INSFORGE_ANON_KEY` — from
  `.insforge/project.json` and `npx @insforge/cli secrets get ANON_KEY`
- `INSFORGE_API_KEY` — server-only admin key for the redirect handler
- `IP_HASH_SALT` — random 32+ byte string for dedup hashing
- `NEXT_PUBLIC_APP_URL` — public base URL used in QR codes

## Tests

```bash
npm test            # vitest (unit/component)
npm run test:e2e    # playwright (local, auto-starts dev server)

# Prod smoke — point at a deployed URL
PLAYWRIGHT_BASE_URL=https://maquette.vercel.app npm run test:e2e -- e2e/prod-smoke.spec.ts
```

## Deploy

1. `vercel link` (or import the repo via the Vercel dashboard)
2. Set the env vars above in the Vercel project (Production + Preview)
3. `vercel --prod`
4. Run the prod smoke suite against the deployment URL

The `/r/[code]` route is a Node runtime route handler — Vercel
injects `x-forwarded-for`, `x-vercel-ip-country`, `-region`, and `-city`
headers automatically, which is where geo comes from.

## Google OAuth

Email/password sign-in works out of the box. For Google sign-in, create
an OAuth client in Google Cloud Console with the InsForge callback URL
and plug the credentials into the InsForge project dashboard under
Auth → Providers → Google.
