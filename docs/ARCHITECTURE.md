# ZIRA Architecture

## Runtime

- `frontend/` is the existing React 19, Vite, TypeScript, Tailwind CSS, and HLS.js application. It is intentionally preserved rather than rewritten into a new framework.
- `backend/` is a Node.js, Express, TypeScript REST API. PostgreSQL access uses Prisma; there is no in-memory production data adapter.
- `backend/prisma/` owns the schema, migrations, and fictional development seed.
- `docs/` contains operational guides.

The browser calls `NEXT_PUBLIC_API_URL` when set and otherwise requests `/api` on its current origin. Configure the URL per environment; the client shows a retryable unavailable state when it cannot load the catalog.

## Security Boundaries

JWT access tokens are short-lived. Refresh credentials are rotated, stored as hashes in PostgreSQL sessions, and delivered in an HttpOnly cookie. API role checks are enforced by Express middleware. Production requires separate access and refresh secrets, a database, and an explicit CORS origin.

Cloudflare R2 credentials are only read by backend code. Uploads use the AWS S3-compatible API and signed PUT URLs. Missing R2 configuration disables upload operations; there is no mock production storage.

## Media

R2 stores source objects and does not transcode them. `VideoAsset`, `VideoRendition`, and `SubtitleTrack` record externally processed assets. The player accepts a direct source when present and uses HLS.js for an HLS master playlist; quality choices are shown only for actual HLS levels. A transcoding provider and subtitle delivery workflow are not configured by this repository.

## Monetization and Rights

ZIRA V1 is free to watch. Sponsor and affiliate campaign tracking records impressions and clicks for CTR reporting. Campaigns are not subscriptions, pay-per-view, or download purchases. Movie publication checks for valid current rights; pending or expired rights cannot be published. Series publication workflow is not yet implemented.

## Current Scope Gaps

The admin UI currently covers overview metrics, movies, series, rights, sponsors, Monetag settings, affiliates, analytics, and audit logs. Dedicated user administration, season/episode management, upload workflow, and promoted-content management are not complete. Password-reset delivery requires an email provider and is not configured. Google OAuth credentials are not consumed by the current app.
