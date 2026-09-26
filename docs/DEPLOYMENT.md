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

The repository does not currently contain a runnable backend: `server.ts` and the files under `src/server/routes/` are empty. Do not deploy those files as an API until the Express entry point, routes, authentication checks, and CORS policy are implemented and verified.

When the API is available, deploy it as a separate long-running Node.js service. Configure `PORT`, `NODE_ENV`, `FRONTEND_URL`, `CORS_ORIGINS`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and any integrations it actually uses in the backend provider's secret store.

Prisma schema configuration uses PostgreSQL through `DATABASE_URL`. There are no checked-in Prisma migrations. Do not run `prisma db push` or apply a production schema change until a reviewed, non-destructive migration has been created and tested against a disposable database backup.

## Cloudflare R2

Set `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_R2_ENDPOINT`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET`, and `CLOUDFLARE_R2_PUBLIC_URL` only on the backend. Keep the bucket's public delivery URL separate from the private S3-compatible credentials. The current server-side R2 service does not perform an upload and must be completed before production uploads are enabled.

## Readiness

Vercel configuration and the frontend API-origin setting are prepared, but deployment readiness depends on a successful production build and a separately implemented, tested backend. No deployment is performed by this guide.
