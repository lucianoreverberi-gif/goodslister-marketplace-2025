// This is a Vercel serverless function to serve listing data.
// It replaces the direct use of mock data on the frontend,
// moving our application towards a real backend architecture.

import type { VercelRequest, VercelResponse } from '@vercel/node';

// In a real application, you would import the Vercel Postgres SDK
// and fetch data from your database, like this:
// import { sql } from '@vercel/postgres';

// For now, we'll use our mock data to simulate the database response.
// This allows us to build and test the frontend-backend connection
// before the database is fully set up.
import { mockListings } from '../constants';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // --- REAL DATABASE QUERY (EXAMPLE) ---
  // In a real setup with Vercel Postgres, your code would look like this:
  //
  // try {
  //   const { rows } = await sql`SELECT * FROM listings;`;
  //   return res.status(200).json(rows);
  // } catch (error) {
  //   return res.status(500).json({ error: 'Failed to fetch listings' });
  // }
  // --- END REAL DATABASE QUERY ---

  // For now, we return our mock data from the backend.
  // This confirms our API endpoint is working correctly and allows us to
  // build the rest of the application around a real API structure.
  return res.status(200).json(mockListings);
}
