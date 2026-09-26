# Deployment Guide

## Frontend on Vercel

The existing frontend is a React application built with Vite at the repository root. The checked-in `vercel.json` configures:

- Root directory: `.`
- Framework preset: Vite (or Other if Vercel does not detect it)
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`

Set `VITE_API_URL` to the public backend origin, without a trailing slash or `/api` suffix (for example, `https://api.example.com`). Set only `VITE_*` values in Vercel. These values are delivered to browsers and must never contain secrets. Add `VITE_GOOGLE_CLIENT_ID` and the `VITE_MONETAG_ZONE_*` IDs only if those integrations are enabled.

The app's API must be deployed separately. Configure the backend CORS allowlist to include the exact Vercel production domain and any intentionally enabled preview domains. Authentication currently sends bearer tokens from browser storage, so the API must allow the `Authorization` header and the required methods. No backend CORS implementation is present in this repository yet.

## Backend and Database

Deploy the Express API as a separate long-running Node.js service from the repository root:

- Build command: `npm run build:backend`
- Start command: `npm start`
- Health check: `/health`
- Database readiness check: `/ready`

Configure `PORT`, `NODE_ENV=production`, `FRONTEND_URL`, `CORS_ORIGINS`, `DATABASE_URL`, and a randomly generated `JWT_SECRET` of at least 32 characters in the backend provider's secret store. Include the exact Vercel origin in `FRONTEND_URL` or `CORS_ORIGINS`. Keep the database and JWT values out of Vercel.

Prisma schema configuration uses PostgreSQL through `DATABASE_URL`. The repository has no baseline migrations, including for the existing content tables. The monetization schema adds tables and columns, but there is no safe migration chain for an existing production database yet. Do not run `prisma db push` or apply schema changes to production; first create and review a migration plan against a production backup and a disposable database.

## Cloudflare R2

Set `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET`, and `CLOUDFLARE_R2_PUBLIC_URL` only on the backend. Keep the bucket's public delivery URL separate from the private S3-compatible credentials. The presigned-upload endpoint requires an authenticated editor/admin token. Configure bucket CORS to allow the Vercel origin and `PUT` requests for browser uploads.

## Monetization Integrations

Sponsor campaign and affiliate events are stored by the API. Affiliate conversions remain pending until an administrator verifies or rejects them; only verified commissions are included in verified revenue. Monetag API records are explicitly labeled reported estimates. Placement enablement is stored in PostgreSQL. The Vercel `VITE_MONETAG_ZONE_*` values are public zone identifiers, not secrets; an approved Monetag tag/client integration is still required before those IDs render ads. No secret Monetag credentials belong in frontend configuration.

## Readiness

The Vite frontend and Express backend have separate build commands. Prisma schema validation and client generation do not migrate a database. No Vercel or backend deployment is performed by this guide.
