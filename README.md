# ZIRA

ZIRA is a free-to-watch movie and series platform. This repository preserves the existing React/Vite product and separates it from the Express/Prisma API so external credentials can be configured without exposing them to browser code.

## Structure

```text
frontend/   React, Vite, TypeScript, Tailwind CSS, player and public/admin UI
backend/    Express REST API, auth, Prisma schema/migrations, storage services and tests
docs/       Architecture, local setup, deployment, database, R2 and admin guides
```

The frontend is React/Vite, not Next.js. Its API origin is configured with `NEXT_PUBLIC_API_URL`; no API host is hardcoded in frontend application code. An unavailable API leaves the application shell visible and offers a retry action.

## Local Development

Use Node.js 20 or newer, npm, and PostgreSQL. In separate terminals:

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run dev
```

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

The API listens on port 4000 and Vite on port 3000. Set `DATABASE_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` in `backend/.env`; set `NEXT_PUBLIC_API_URL=http://localhost:4000` in `frontend/.env.local`. The two example files contain no credentials.

Apply database migrations and optionally add fictional, unpublished demo catalog records from `backend/`:

```bash
npm run prisma:deploy
npm run seed
```

See [Local Setup](docs/LOCAL_SETUP.md), [PostgreSQL Setup](docs/POSTGRES_SETUP.md), and [Cloudflare R2 Setup](docs/CLOUDFLARE_R2_SETUP.md).

## Integrations and Current Scope

R2 upload, delete, and presigned-upload operations are backend-only and require all five `CLOUDFLARE_*` values. Missing values disable uploads; production never falls back to mock storage. R2 does not transcode video. Playback supports a direct source and actual HLS variants when supplied by an external processor.

Authentication uses bcrypt, short-lived JWT access tokens, rotated HttpOnly refresh sessions, and backend role checks. Sponsor and affiliate campaigns track impressions and clicks. The product has no subscriptions, pay-per-view, or paid downloads.

Google OAuth credentials are not currently consumed. There is no Gemini integration or `GEMINI_API_KEY` requirement. Password-reset delivery requires an email provider and is not currently configured. Dedicated user administration, season/episode administration, upload workflow, and promoted-content administration remain incomplete; see [Admin Guide](docs/ADMIN_GUIDE.md).

## Production

Deploy `frontend/` to Vercel and `backend/` to Render as separate services. Configure `NEXT_PUBLIC_API_URL` on Vercel and secrets only in the backend environment. See [Deployment](docs/DEPLOYMENT.md) for exact settings and first-admin setup.

## Guides

- [Architecture](docs/ARCHITECTURE.md)
- [Local Setup](docs/LOCAL_SETUP.md)
- [Deployment](docs/DEPLOYMENT.md)
- [PostgreSQL](docs/POSTGRES_SETUP.md)
- [Cloudflare R2](docs/CLOUDFLARE_R2_SETUP.md)
- [Admin](docs/ADMIN_GUIDE.md)
- [Sponsors](docs/SPONSOR_GUIDE.md)
- [Affiliates](docs/AFFILIATE_GUIDE.md)
- [Monetization](docs/MONETIZATION.md)
