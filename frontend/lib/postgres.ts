// PostgreSQL database connection using Vercel Postgres (works with Neon via DATABASE_URL)
// This supports both serverless functions and edge runtime
import { sql as vercelSql } from '@vercel/postgres';

// Export Vercel's sql for tagged template usage (e.g., sql`SELECT * FROM table`)
export { sql as vercelSql } from '@vercel/postgres';

// Backward-compatible function-based query for existing code
// Usage: sql(queryString, params)
export async function sql(queryString: string, params: any[] = []) {
  try {
    const result = await vercelSql.query(queryString, params);
    return result.rows;
  } catch (error) {
    console.error('PostgreSQL query error:', error);
    console.error('Query:', queryString);
    console.error('Params:', params);
    throw error;
  }
}

// Default export for compatibility
export default sql;
