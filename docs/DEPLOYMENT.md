# Deployment Guide

## Frontend on Vercel

The existing frontend is a React application built with Vite at the repository root. The checked-in `vercel.json` configures:

- Root directory: `.`
- Framework preset: Vite (or Other if Vercel does not detect it)
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`

Set `VITE_API_URL` to the public backend origin, without a trailing slash or `/api` suffix (for example, `https://api.example.com`). Set only `VITE_*` values in Vercel. These values are delivered to browsers and must never contain secrets. `VITE_GOOGLE_CLIENT_ID` is optional.

The app's API must be deployed separately. Configure the backend CORS allowlist to include the exact Vercel production domain and any intentionally enabled preview domains. Authentication sends bearer tokens from browser storage; the API CORS policy allows the `Authorization` header and required methods.

## Backend and Database

Deploy the Express API as a separate long-running Node.js service from the repository root:

- Build command: `npm run build:backend`
- Start command: `npm start`
- Health check: `/health`
- Database readiness check: `/ready`

Configure `PORT`, `NODE_ENV=production`, `FRONTEND_URL`, `CORS_ORIGINS`, `DATABASE_URL`, and a randomly generated `JWT_SECRET` of at least 32 characters in the backend provider's secret store. Include the exact Vercel origin in `FRONTEND_URL` or `CORS_ORIGINS`. Keep the database and JWT values out of Vercel.

For a fresh database, set `ADMIN_EMAIL`, register that account, independently verify ownership, then run `npm run admin:promote -- admin@example.com --i-verified-ownership` from an operator-controlled environment. The CLI requires the requested address to match `ADMIN_EMAIL`; there is no public admin-registration or demo-admin route.

Prisma schema configuration uses PostgreSQL through `DATABASE_URL`. `prisma migrate deploy` applies the checked-in initial migration and additive Monetag configuration migration. The initial migration was generated from and applied to a verified-empty configured database. Do not apply that initial migration to a different non-empty database; baseline and compare its existing schema first.

## Cloudflare R2

Set `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET`, and `CLOUDFLARE_R2_PUBLIC_URL` only on the backend. Keep the bucket's HTTPS public delivery URL separate from the private S3-compatible credentials. The presigned-upload endpoint requires an authenticated editor/admin token.

The configured bucket passed a read-only `HeadBucket` check, but `GetBucketCors` returned `NoSuchCORSConfiguration` (HTTP 404). After the production Vercel hostname is selected, add an R2 CORS rule for that exact origin: methods `GET`, `HEAD`, and `PUT`; allowed request header `Content-Type`; expose `ETag`; set a bounded max age such as 3600 seconds. Do not use `*` origins. Actual object delivery and browser upload remain unverified until an authorized media object and that CORS rule exist.

## Monetization Integrations

Sponsor campaign and affiliate events are stored by the API. Affiliate conversions remain pending until an administrator verifies or rejects them; only verified commissions are included in verified revenue. Monetag API records are explicitly labeled reported estimates. Placement enablement and public Zone IDs are stored in PostgreSQL. Configure `MONETAG_ALLOWED_SCRIPT_ORIGINS` on the backend with the exact HTTPS script origins from the approved publisher tag. The administrator must enter the Zone ID and exact tag script URL for each placement. Use an in-page format; do not enable MultiTag/popunder behavior by default. These values are public and are never treated as server secrets.

## Readiness

The Vite frontend and Express backend have separate build commands. Apply the checked-in migrations in the backend deployment before serving requests. No deployment is performed by this guide.
