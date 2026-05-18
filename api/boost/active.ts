import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { listing_id } = req.query;

  if (!listing_id) {
    return res.status(400).json({ error: 'Listing ID is required' });
  }

  try {
    const { rows } = await sql`
      SELECT * FROM boosts 
      WHERE listing_id = ${listing_id as string} 
      AND status = 'active' 
      AND expires_at > NOW()
      LIMIT 1
    `;

    return res.status(200).json({ boost: rows[0] || null });
  } catch (error) {
    console.error('Fetch active boost error:', error);
    return res.status(500).json({ error: 'Failed to fetch active boost' });
  }
}
