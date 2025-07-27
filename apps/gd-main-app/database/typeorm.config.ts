import { join } from 'path';
import process from 'node:process';
import { existsSync } from 'fs';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

const nodeEnv = process.env.NODE_ENV || 'development';

const envPaths = [
  join(process.cwd(), 'env', `.env.${nodeEnv}.local`),
  join(process.cwd(), 'env', `.env.${nodeEnv}`),
  join(process.cwd(), 'env', '.env.local'),
  join(process.cwd(), 'env', '.env'),
];

for (const path of envPaths) {
  if (existsSync(path)) {
    dotenv.config({ path });
    break;
  }
}
const depType = process.env.DEP_TYPE;

export default new DataSource({
  type: 'postgres',
  host: process.env.PG_HOST,
  port: +process.env.PG_PORT!,
  username: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.MAIN_PG_DATABASE,
  synchronize: false,
  logging: ['error'],
  namingStrategy: new SnakeNamingStrategy(),
  entities: [join(__dirname, '../src/**/*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations/*.{ts,js}')],
  extra:
    depType === 'staging'
      ? {
          ssl: {
            rejectUnauthorized: false,
          },
        }
      : undefined,
});
