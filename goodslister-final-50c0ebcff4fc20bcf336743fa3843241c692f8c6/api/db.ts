// api/db.ts
// Database connection utility for Postgres
import { sql } from '@vercel/postgres';

export { sql };

// Helper function to handle database errors
export function handleDbError(error: unknown) {
  console.error('Database error:', error);
  return {
    error: 'Database operation failed',
    details: error instanceof Error ? error.message : 'Unknown error'
  };
}
