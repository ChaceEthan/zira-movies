# ZIRA — STREAM • WATCH • ENJOY

> Your Ultimate Streaming Destination for Movies, Series, and Originals in Rwanda, Africa, and Worldwide.

ZIRA V1 is a premium, mobile-first, zero-paywall streaming platform built with React, Vite, Express, TypeScript, Tailwind CSS, PostgreSQL / Prisma ORM, and Cloudflare R2 media storage.

---

## 🌟 Key Features

- **100% Free Streaming**: No subscriptions or paywalls in V1.
- **Mobile-First Experience**: Optimized for touch controls, responsive video rails, and 320px+ mobile screens.
- **Rwandan & African Showcase**: Dedicated spotlights for original Rwandan films, documentaries, and regional cinema.
- **Custom HTML5 & HLS Video Player**: Multi-quality selector (`1080p`, `720p`, `480p`, `360p`, `Auto`), Data Saver mode, subtitle tracks (Kinyarwanda, English, French), and auto-saving watch progress.
- **Monetization Engine**: Direct sponsor banners, affiliate campaigns, house ads, and promoted content managed via Admin Console.
- **Rights Management**: Built-in legal rights audit system (`OWNED`, `LICENSED`, `PERMISSION_GRANTED`, `PUBLIC_DOMAIN`, `EXPIRED`) with strict publishing blocks for unverified content.
- **Cloudflare R2 Media Storage**: Server-side pre-signed uploads and media key structure with local mock storage adapter fallback.
- **PWA Ready**: Installable on Android and iOS devices.

---

## 📂 Project Structure

The project is organized into two main packages: `frontend` and `backend`.
```
zira/
├── frontend/       # React/Vite Client Application
├── backend/        # Node.js/Express API Server
├── docs/           # Documentation
└── README.md
```

---

## 🛠️ Local Development Setup

### Prerequisites

- Node.js (v18+)
- npm (v9+)
- PostgreSQL

### 1. Install Dependencies

Install dependencies for both frontend and backend from the root directory.

```bash
npm install
```

### 2. Configure Environment

**Backend:**

From the project root, copy the backend environment example file. The backend runs on port `4000`.

```bash
cp backend/.env.example backend/.env
```

**Frontend:**

The frontend requires no secret values and is pre-configured for local development to connect to the backend at `http://localhost:4000`. It runs on port `3000`.

```bash
cp frontend/.env.example frontend/.env.local
```

### 3. Setup Database

Ensure your PostgreSQL server is running and the `DATABASE_URL` in `backend/.env` is correct. Then, run the Prisma migration to create the database schema.

```bash
cd backend
npm run prisma:migrate
cd ..
```

### 4. Run Development Servers

Start both the frontend and backend servers concurrently from the root directory.

```bash
npm run dev
```

- Frontend will be available at: `http://localhost:3000`
- Backend API will be available at: `http://localhost:4000`

---

## ⚙️ Required External Configuration

To run ZIRA, you will need to configure several external services and provide credentials in the `backend/.env` file.

1.  **PostgreSQL** (Required)
    -   Provides: `DATABASE_URL`

2.  **JWT Secrets** (Required)
    -   Locally generated secure random strings.
    -   Provides: `JWT_SECRET`, `JWT_REFRESH_SECRET`

3.  **Cloudflare R2** (Required for media uploads)
    -   Provides: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET`, `CLOUDFLARE_R2_PUBLIC_URL`

4.  **Google OAuth** (Optional)
    -   Provides: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (for backend) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (for frontend).

5.  **Email Provider** (Optional)
    -   For password resets and notifications.
    -   Provides: `EMAIL_FROM`, `EMAIL_PROVIDER`, `EMAIL_API_KEY`

---

## 📖 Complete Documentation

Detailed operational guides are available in the `docs/` folder:

- [Architecture Guide](docs/ARCHITECTURE.md)
- [Local Development Setup](docs/LOCAL_SETUP.md)
- [PostgreSQL Database Setup](docs/POSTGRES_SETUP.md)
- [Cloudflare R2 Storage Setup](docs/CLOUDFLARE_R2_SETUP.md)
- [Admin Console Guide](docs/ADMIN_GUIDE.md)
- [Sponsor & Advertising Guide](docs/SPONSOR_GUIDE.md)
- [Affiliate Placements Guide](docs/AFFILIATE_GUIDE.md)
- [Monetization Strategy](docs/MONETIZATION.md)
- [Deployment Guide (Vercel & Render)](docs/DEPLOYMENT.md)

---

## 🔐 Credentials & Demo Accounts

Instant one-click demo login is built into the Sign In dialog:
- **Viewer Demo**: `viewer@zira.stream`
- **Super Admin Demo**: `admin@zira.stream`

---

© 2026 ZIRA Media Ltd.
