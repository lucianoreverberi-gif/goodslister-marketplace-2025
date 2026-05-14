import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { bookingId, status } = req.body;
    await sql`UPDATE bookings SET status = ${status} WHERE id = ${bookingId}`;
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Update booking status error:', error);
    return res.status(500).json({ error: 'Failed to update booking status' });
  }
}
