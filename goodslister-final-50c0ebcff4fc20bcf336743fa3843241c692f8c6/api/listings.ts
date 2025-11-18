// api/listings.ts
// Vercel serverless function to serve listing data from Postgres database
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, handleDbError } from './db';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Handle different HTTP methods
  if (req.method === 'GET') {
    return handleGetListings(req, res);
  } else if (req.method === 'POST') {
    return handleCreateListing(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// GET /api/listings - Fetch all listings
async function handleGetListings(req: VercelRequest, res: VercelResponse) {
  try {
    const { rows } = await sql`
      SELECT 
        id, title, description, category, price_per_day,
        location, lat, long, images, featured, owner_id,
        created_at, updated_at
      FROM listings
      ORDER BY created_at DESC
    `;
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching listings:', error);
    return res.status(500).json(handleDbError(error));
  }
}

// POST /api/listings - Create a new listing
async function handleCreateListing(req: VercelRequest, res: VercelResponse) {
  try {
    const { title, description, category, price_per_day, location, lat, long, images, owner_id } = req.body;
    
    const { rows } = await sql`
      INSERT INTO listings (
        title, description, category, price_per_day,
        location, lat, long, images, owner_id
      )
      VALUES (
        ${title}, ${description}, ${category}, ${price_per_day},
        ${location}, ${lat}, ${long}, ${images}, ${owner_id}
      )
      RETURNING *
    `;
    
    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating listing:', error);
    return res.status(500).json(handleDbError(error));
  }
}
