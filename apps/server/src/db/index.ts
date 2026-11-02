import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'messenger_user',
  password: process.env.DB_PASSWORD || 'messenger_password',
  database: process.env.DB_NAME || 'corporate_messenger',
  max: 10
});

export const db = drizzle(pool, { schema });
