# AdGen Studio MVP

Multi-tenant ad creative studio built with Next.js App Router.

## Features
- Passwordless email sign-in (magic link)
- Tenant resolution by request hostname
- Brand and generation job management with strict tenant scoping
- Creative generation API and history tracking
- File upload helper to Google Drive (service account)
- Slack notification helper
- Usage report endpoint and CSV export from history page

## Tech Stack
- Next.js (App Router, TypeScript)
- Supabase (Auth + Postgres)
- `@fal-ai/client` generation model: `fal-ai/nano-banana-2/edit`

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env:
   ```bash
   cp .env.example .env.local
   ```
3. Configure Supabase project URL/keys and service role in `.env.local`.
4. Apply DB schema from `db/schema.sql` in Supabase SQL editor.
5. Seed one tenant and map users:
   - Insert tenant with hostname (example: `acme.example.com`)
   - Insert `tenant_users` rows linking auth users to tenant IDs
6. Configure generation + integrations:
   - `FAL_KEY`
   - Google Drive service account env vars
   - `SLACK_WEBHOOK_URL` (optional)
7. Run locally:
   ```bash
   npm run dev
   ```

## API Endpoints
- `POST /api/brands` – create brand
- `POST /api/generate` – generate creative, upload output, notify Slack
- `GET /api/usage-report` – job report for current tenant

All API/database reads and writes are tenant-filtered by `tenant_id` and guarded by tenant membership.

## White-label Rules
- UI and user-facing errors intentionally avoid vendor/builder naming
- Tenant isolation is mandatory on all queries

## Deploy (Vercel + custom domains) checklist
- [ ] Add all env vars in Vercel project settings
- [ ] Add each tenant domain in Vercel Domains
- [ ] Point DNS records (CNAME/A) to Vercel
- [ ] Ensure hostname exists in `tenants.hostname`
- [ ] Validate magic-link redirect URL for each domain (`https://<tenant-domain>/auth/callback`)
- [ ] Verify generation, upload, and history flows on each tenant domain
- [ ] Confirm no user-facing vendor names in UI/errors

## Scripts
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
