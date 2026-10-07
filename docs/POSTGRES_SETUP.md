# PostgreSQL Setup

Provision PostgreSQL 14 or newer and set `DATABASE_URL` in `backend/.env`. Keep the connection URL private. For local PostgreSQL, use the URL supplied by your local database setup; managed providers may require SSL query parameters.

From `backend/`, apply the checked-in migration history:

```bash
npm run prisma:validate
npm run prisma:deploy
```

Use `npm run prisma:migrate -- --name describe_change` for new development migrations. Commit both the schema change and generated migration. Do not use `prisma db push` against shared environments.

The fictional seed is repeatable and creates only draft content with pending rights:

```bash
npm run seed
```

`DATABASE_URL` is not needed for frontend or backend TypeScript checks/builds or for `npm run prisma:validate`; it is required when connecting to or migrating a database. The schema validation command uses a disposable local-only URL if the variable is absent and never connects to it.
