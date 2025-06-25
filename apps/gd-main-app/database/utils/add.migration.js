const execSync = require('child_process').execSync;

const arg = process.argv[2];
if (!arg) {
  throw new Error('Need some name for migration');
}
const command = `typeorm-ts-node-commonjs migration:generate apps/gd-main-app/database/migrations/${arg} -d apps/gd-main-app/database/typeorm.config.ts`;


execSync(command, { stdio: 'inherit' });
