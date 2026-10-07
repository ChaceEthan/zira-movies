# Local Development

Requirements: Node.js 20 or newer, npm, and PostgreSQL for API-backed features.

Install and configure each app in a separate terminal:

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

The frontend is served on port 3000 and the API on port 4000. Set `NEXT_PUBLIC_API_URL=http://localhost:4000` in `frontend/.env.local`. If the backend is unavailable, the frontend remains usable and shows a retry action; API-backed content requires a working database.

Set `DATABASE_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` in `backend/.env`. Then, from `backend/`, apply migrations and optionally seed fictional draft records:

```powershell
npm run prisma:deploy
npm run seed
```

The seed includes no real films, media files, accounts, or publishable rights. See [PostgreSQL setup](POSTGRES_SETUP.md) and [Admin guide](ADMIN_GUIDE.md) for database and first-admin steps.
