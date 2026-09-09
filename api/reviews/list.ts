import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * GET /api/reviews/list?authorId=X or ?targetId=X or ?bookingId=X
 * Returns reviews matching the filter.
 * Used by dashboard to know which bookings the user already reviewed.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { authorId, targetId, bookingId } = req.query;

    if (!authorId && !targetId && !bookingId) {
      return res.status(400).json({ error: 'One of authorId, targetId, or bookingId is required' });
    }

    let result;
    if (bookingId && !Array.isArray(bookingId)) {
      result = await sql`SELECT id, booking_id, author_id, target_id, role, rating, status, created_at FROM reviews WHERE booking_id = ${bookingId} ORDER BY created_at DESC`;
    } else if (authorId && !Array.isArray(authorId)) {
      result = await sql`SELECT id, booking_id, author_id, target_id, role, rating, status, created_at FROM reviews WHERE author_id = ${authorId} ORDER BY created_at DESC`;
    } else if (targetId && !Array.isArray(targetId)) {
      result = await sql`SELECT id, booking_id, author_id, target_id, role, rating, comment, status, created_at FROM reviews WHERE target_id = ${targetId} AND status = 'PUBLISHED' ORDER BY created_at DESC`;
    } else {
      return res.status(400).json({ error: 'Invalid params' });
    }

    return res.status(200).json({ reviews: result.rows });
  } catch (error: any) {
    console.error('List reviews error:', error);
    const msg = error?.message || 'Failed to list reviews';
    if (msg.toLowerCase().includes('connect')) {
      return res.status(200).json({ reviews: [], simulated: true });
    }
    if (msg.includes('does not exist') || error?.code === '42P01') {
      return res.status(200).json({ reviews: [] });
    }
    return res.status(500).json({ error: msg });
  }
}
