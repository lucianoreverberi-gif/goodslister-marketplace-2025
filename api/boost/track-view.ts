import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { listing_id } = req.body;

  if (!listing_id) {
    return res.status(400).json({ error: 'Listing ID is required' });
  }

  try {
    // Atomically increment views_count if listing has an active boost
    const { rowCount } = await sql`
      UPDATE boosts 
      SET views_count = views_count + 1
      WHERE listing_id = ${listing_id} 
      AND status = 'active' 
      AND expires_at > NOW()
    `;

    return res.status(200).json({ success: rowCount > 0 });
  } catch (error) {
    console.error('Track view error:', error);
    return res.status(500).json({ error: 'Failed to track boost view' });
  }
}
