import 'dotenv/config';
import prisma from '../prisma/prisma';

async function main() {
  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const requestedEmail = process.argv[2]?.trim().toLowerCase();
  const ownershipConfirmed = process.argv[3] === '--i-verified-ownership';

  if (!configuredEmail || !requestedEmail || requestedEmail !== configuredEmail || !ownershipConfirmed) {
    throw new Error('Set ADMIN_EMAIL and pass the matching address plus --i-verified-ownership after verifying account ownership out of band.');
  }

  const user = await prisma.user.findUnique({ where: { email: configuredEmail } });
  if (!user) {
    throw new Error('No account exists for ADMIN_EMAIL. Register that address before running this command.');
  }
  if (user.role === 'SUPER_ADMIN') {
    console.log('Configured administrator already has SUPER_ADMIN access.');
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { role: 'SUPER_ADMIN', emailVerified: true } });
  console.log('Configured account promoted to SUPER_ADMIN.');
}

main()
  .catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
