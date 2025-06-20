import mysql from 'mysql2/promise';

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

let pool: mysql.Pool | null = null;

export function createDatabasePool(): mysql.Pool {
  if (pool) {
    return pool;
  }

  const config: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cs2_skins',
  };

  pool = mysql.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return pool;
}

export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T> {
  const connection = createDatabasePool();

  try {
    const [results] = await connection.execute(query, params);
    return results as T;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function executeTransaction<T = any>(
  queries: Array<{ query: string; params: any[] }>
): Promise<T[]> {
  const connection = createDatabasePool();
  const conn = await connection.getConnection();

  try {
    await conn.beginTransaction();

    const results: T[] = [];
    for (const { query, params } of queries) {
      const [result] = await conn.execute(query, params);
      results.push(result as T);
    }

    await conn.commit();
    return results;
  } catch (error) {
    await conn.rollback();
    console.error('Database transaction error:', error);
    throw error;
  } finally {
    conn.release();
  }
}

export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
