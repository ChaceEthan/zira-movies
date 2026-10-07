# Deployment

## Vercel Frontend

Set the Vercel project root directory to `frontend`. Use `npm install`, `npm run build`, and output directory `dist`. Configure `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_API_URL` in Vercel; the API URL is public browser configuration, not a secret. No Google OAuth client ID is currently needed by the UI.

## Render Backend

Set the service root directory to `backend`. Build with `npm install && npm run prisma:generate && npm run build`; start with `npm run start`. Set the health check to `/health`. Configure `NODE_ENV=production`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`, and `CORS_ORIGINS` in Render's secret settings. Both JWT secrets must be separate and at least 32 characters. Apply migrations with `npm run prisma:deploy` as a release/deploy step before serving traffic.

The API uses credentialed CORS for the refresh cookie. Allow the exact Vercel origin, enable HTTPS, and do not use wildcard origins. Keep database, JWT, Google, and R2 secrets in the backend secret store only.

## Database and First Admin

Provision PostgreSQL, configure `DATABASE_URL`, then deploy the migrations. To create the first administrator, register the intended account, set `ADMIN_EMAIL` to that verified address, and run `npm run admin:promote -- user@example.com --i-verified-ownership` from `backend/`. The command checks the configured email and requires the explicit ownership confirmation flag.

## Media and Monetization

R2 is optional for API startup but required for uploads. Configure all five `CLOUDFLARE_*` variables on the backend, enable HTTPS public delivery, and add a bucket CORS rule permitting the Vercel origin and `PUT` with `Content-Type`. R2 does not transcode video; supply processed renditions/HLS from a separately configured processor. Sponsor and affiliate tracking is stored in PostgreSQL; publisher integrations remain separately configured and non-intrusive.
