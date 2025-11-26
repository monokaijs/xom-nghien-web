import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './db/schema';

declare global {
  var __pool: mysql.Pool | undefined;
  var __db: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cs2_skins',
  waitForConnections: true,
  connectionLimit: process.env.NODE_ENV === 'production' ? 10 : 5,
  maxIdle: process.env.NODE_ENV === 'production' ? 5 : 2,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  supportBigNumbers: true,
  bigNumberStrings: true,
};

if (!global.__pool) {
  global.__pool = mysql.createPool(poolConfig);
}

if (!global.__db) {
  global.__db = drizzle(global.__pool, { schema, mode: 'default' }) as any;
}

export const pool = global.__pool!;
export const db = global.__db!;
