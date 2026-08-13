# Deployment Guide

### Deploying Frontend to Vercel
1. Connect repository to Vercel.
2. Build command: `npm run build`
3. Output directory: `frontend/dist`
4. Set environment variable `VITE_API_URL` pointing to the live API URL.

### Deploying API to Render / Cloud Run
1. Create a Web Service on Render or Cloud Run pointing to `server.ts`.
2. Build command: `npm run build`
3. Start command: `npm start`
4. Configure environment variables (`DATABASE_URL`, `JWT_SECRET`, `CLOUDFLARE_R2_*`).
