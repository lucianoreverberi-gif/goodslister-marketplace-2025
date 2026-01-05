
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bookingId, action, ownerId } = req.body; // action: 'approve' | 'reject'

  if (!bookingId || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
      // 1. Verify Ownership & Status
      const bookingRes = await sql`
        SELECT b.id, b.status, b.renter_id, b.listing_id, l.owner_id, l.title, b.start_date, b.end_date, b.total_price
        FROM bookings b
        JOIN listings l ON b.listing_id = l.id
        WHERE b.id = ${bookingId}
      `;

      if (bookingRes.rows.length === 0) {
          return res.status(404).json({ error: 'Booking not found' });
      }

      const booking = bookingRes.rows[0];

      if (booking.owner_id !== ownerId) {
          return res.status(403).json({ error: 'Unauthorized' });
      }

      if (booking.status !== 'pending') {
          return res.status(400).json({ error: 'Booking is not pending' });
      }

      // 2. Update Status
      const newStatus = action === 'approve' ? 'confirmed' : 'rejected';
      await sql`UPDATE bookings SET status = ${newStatus} WHERE id = ${bookingId}`;

      // 3. Notifications
      if (process.env.RESEND_API_KEY) {
          const renterRes = await sql`SELECT email, name FROM users WHERE id = ${booking.renter_id}`;
          const renter = renterRes.rows[0];

          if (renter) {
               // Email Notification
               await fetch(new URL('/api/send-email', `https://${req.headers.host}`).toString(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'booking_status_update', 
                    to: renter.email,
                    data: {
                        name: renter.name,
                        listingTitle: booking.title,
                        status: newStatus,
                        startDate: new Date(booking.start_date).toLocaleDateString(),
                        endDate: new Date(booking.end_date).toLocaleDateString(),
                        totalPrice: booking.total_price
                    }
                })
            });
          }
      }

      // Chat Notification
      const chatMsg = action === 'approve' 
        ? `👋 Great news! I've accepted your booking request. See you on ${new Date(booking.start_date).toLocaleDateString()}!`
        : `❌ Unfortunately I cannot accept this booking request at this time.`;

      await fetch(new URL('/api/chat/send', `https://${req.headers.host}`).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            senderId: ownerId, // Owner sends the update
            text: chatMsg,
            listingId: booking.listing_id,
            recipientId: booking.renter_id
        })
      });

      return res.status(200).json({ success: true, status: newStatus });

  } catch (error: any) {
    console.error('Approve booking error:', error);
    return res.status(500).json({ error: error.message });
  }
}
