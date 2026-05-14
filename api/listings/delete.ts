import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { id } = req.body;
    
    // Check for active bookings before deleting?
    const bookings = await sql`SELECT count(*) FROM bookings WHERE listing_id = ${id} AND status IN ('pending', 'confirmed', 'active')`;
    if (Number(bookings.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete listing with active bookings.' });
    }

    await sql`DELETE FROM listings WHERE id = ${id}`;
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete listing error:', error);
    return res.status(500).json({ error: 'Failed to delete listing' });
  }
}
