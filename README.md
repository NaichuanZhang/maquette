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

## Deploy (InsForge-managed Vercel)

Production URL: **https://k8j86yip.insforge.site**

```bash
# 1. Set persistent env vars once (encrypted at rest on InsForge)
npx @insforge/cli deployments env set NEXT_PUBLIC_INSFORGE_URL      https://k8j86yip.us-east.insforge.app
npx @insforge/cli deployments env set NEXT_PUBLIC_INSFORGE_ANON_KEY <anon-key>
npx @insforge/cli deployments env set INSFORGE_API_KEY              <admin-key>
npx @insforge/cli deployments env set IP_HASH_SALT                  "$(openssl rand -hex 32)"
npx @insforge/cli deployments env set NEXT_PUBLIC_APP_URL           https://k8j86yip.insforge.site

# 2. Deploy the source tree (the CLI zips, excludes node_modules/.next/.env, and builds remotely)
npm run build                          # local build first to catch errors cheaply
npx @insforge/cli deployments deploy .

# 3. Smoke the deployed URL
PLAYWRIGHT_BASE_URL=https://k8j86yip.insforge.site npm run test:e2e -- e2e/prod-smoke.spec.ts
```

The `/r/[code]` route is a Node runtime route handler — Vercel
injects `x-forwarded-for`, `x-vercel-ip-country`, `-region`, and `-city`
headers automatically, which is where geo comes from.

## Google OAuth

Email/password sign-in works out of the box. For Google sign-in, create
an OAuth client in Google Cloud Console with the InsForge callback URL
and plug the credentials into the InsForge project dashboard under
Auth → Providers → Google.
