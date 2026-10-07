const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');

const command = process.argv[2];
if (!['validate', 'generate'].includes(command)) {
  throw new Error('Supported Prisma commands: validate, generate.');
}

const result = spawnSync('prisma', [command, '--schema', 'prisma/schema.prisma'], {
  cwd: resolve(__dirname, '..'),
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://zira:zira@127.0.0.1:5432/zira_validation',
  },
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);