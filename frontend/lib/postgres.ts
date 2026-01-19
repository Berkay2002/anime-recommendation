// PostgreSQL database connection using Vercel Postgres (works with Neon via DATABASE_URL)
// This supports both serverless functions and edge runtime
import { sql as vercelSql } from '@vercel/postgres';
import logger from './logger';

// Export Vercel's sql for tagged template usage (e.g., sql`SELECT * FROM table`)
export { sql as vercelSql } from '@vercel/postgres';

// Backward-compatible function-based query for existing code
// Usage: sql(queryString, params)
export async function sql<T = unknown>(queryString: string, params: unknown[] = []): Promise<T[]> {
  try {
    const result = await vercelSql.query<T>(queryString, params);
    return result.rows;
  } catch (error) {
    logger.error({ error, query: queryString, params }, 'PostgreSQL query error');
    throw error;
  }
}

// Default export for compatibility
export default sql;
