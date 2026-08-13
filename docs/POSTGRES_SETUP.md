# PostgreSQL Setup Guide

To connect ZIRA to a live PostgreSQL database:

1. Provision a PostgreSQL instance (e.g. Neon, Supabase, Cloud SQL, or Render Postgres).
2. Set `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/zira_db?schema=public"
   ```
3. Run Prisma migrations:
   ```bash
   npx prisma db push
   ```
4. Verify models against `prisma/schema.prisma`.
