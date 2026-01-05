
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.body;

  if (!id) {
      return res.status(400).json({ error: 'Missing listing ID' });
  }

  try {
    // In a real application, you should verify that the user making the request owns the listing.
    // For this implementation, we proceed with deletion based on ID.
    
    // Optional: Check if there are active bookings associated with this listing before deleting
    // const activeBookings = await sql`SELECT id FROM bookings WHERE listing_id = ${id} AND status = 'active'`;
    // if (activeBookings.rows.length > 0) { return res.status(400).json({ error: 'Cannot delete listing with active bookings.' }); }

    // First delete dependent records (like bookings) if you want cascading deletes, 
    // or just delete the listing if constraints allow. 
    // Assuming simple deletion for now or that constraints are handled.
    await sql`DELETE FROM listings WHERE id = ${id}`;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete listing error:', error);
    return res.status(500).json({ error: 'Failed to delete listing' });
  }
}
