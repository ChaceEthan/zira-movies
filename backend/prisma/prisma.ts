// The error "Cannot find module '@prisma/client'" typically indicates that the Prisma client
// package is not installed or has not been generated.
// To truly fix this, you need to run:
// 1. `npm install @prisma/client` or `yarn add @prisma/client` in your project's root directory.
// 2. `npx prisma generate` after making changes to your Prisma schema.
//
// The code itself in `prisma.ts` is syntactically correct for importing PrismaClient.
// As this is an environment/setup issue rather than a code bug within this file,
// no direct code modification in `prisma.ts` can resolve the "Cannot find module" error.
// The import statement below is correct and should remain as is once the environment is set up.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;