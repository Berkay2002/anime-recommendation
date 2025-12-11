// PostgreSQL database connection using Neon serverless driver
import { Pool, neonConfig } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Export query function that supports parameterized queries
export async function sql(queryString: string, params: any[] = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(queryString, params);
    return result.rows;
  } catch (error) {
    console.error('PostgreSQL query error:', error);
    console.error('Query:', queryString);
    console.error('Params:', params);
    throw error;
  } finally {
    client.release();
  }
}

// Export for compatibility
export default sql;
