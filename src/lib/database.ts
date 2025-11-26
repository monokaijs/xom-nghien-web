import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './db/schema';

declare global {
  var __db: any;
  var __pool: mysql.Pool | undefined;
}

let pool: mysql.Pool;

if (process.env.NODE_ENV === 'production') {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cs2_skins',
    waitForConnections: true,
    connectionLimit: 50,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    supportBigNumbers: true,
    bigNumberStrings: true,
  });
} else {
  if (!global.__pool) {
    global.__pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cs2_skins',
      waitForConnections: true,
      connectionLimit: 20,
      maxIdle: 5,
      idleTimeout: 60000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      supportBigNumbers: true,
      bigNumberStrings: true,
    });
  }
  pool = global.__pool;
}

export const db = global.__db || drizzle(pool, { schema, mode: 'default' });

if (process.env.NODE_ENV !== 'production') {
  global.__db = db;
}
