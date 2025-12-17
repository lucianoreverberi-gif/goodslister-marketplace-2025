
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = req.body;

  try {
    // 1. Check for active listings or bookings
    const listings = await sql`SELECT id FROM listings WHERE owner_id = ${userId}`;
    if (listings.rows.length > 0) {
        // In a real app, we might force delete or ask to disable first. 
        // Here we'll delete the user's listings first to satisfy constraints.
        await sql`DELETE FROM listings WHERE owner_id = ${userId}`;
    }

    // 2. Delete the user
    await sql`DELETE FROM users WHERE id = ${userId}`;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
}
