import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const bookingId = String(req.query.bookingId || '').trim();
    if (!bookingId) {
      return res.status(400).json({ error: 'Missing bookingId query param' });
    }

    const { rows } = await sql`
      SELECT id, booking_id, type, photo_urls, condition_notes, condition_rating,
             latitude, longitude, status,
             renter_signed_at, renter_signed_ip,
             host_signed_at, host_signed_ip,
             created_at, updated_at
      FROM handoff_sessions
      WHERE booking_id = ${bookingId}
      ORDER BY created_at ASC
    `;

    const checkin = rows.find(r => r.type === 'checkin') || null;
    const checkout = rows.find(r => r.type === 'checkout') || null;

    // Get booking timestamps
    const { rows: bookingRows } = await sql`
      SELECT checkin_at, checkout_at, deposit_hold_status, deposit_amount
      FROM bookings WHERE id = ${bookingId}
    `;
    const booking = bookingRows[0] || null;

    return res.status(200).json({
      success: true,
      bookingId,
      checkin,
      checkout,
      booking: booking ? {
        checkin_at: booking.checkin_at,
        checkout_at: booking.checkout_at,
        deposit_hold_status: booking.deposit_hold_status,
        deposit_amount: booking.deposit_amount
      } : null
    });
  } catch (error) {
    console.error('Handoff get error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
