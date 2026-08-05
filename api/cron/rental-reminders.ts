import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Optional auth via CRON_SECRET
  const authHeader = req.headers['authorization'];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Find bookings starting tomorrow that haven't received a reminder yet
    const { rows } = await sql`
      SELECT b.id, b.renter_id, b.start_date,
             u.email AS renter_email, u.name AS renter_name,
             l.title AS listing_title, l.location AS listing_location
      FROM bookings b
      JOIN users u ON u.id = b.renter_id
      JOIN listings l ON l.id = b.listing_id
      WHERE b.status = 'confirmed'
        AND b.start_date::date = (CURRENT_DATE + INTERVAL '1 day')::date
        AND b.reminder_sent_at IS NULL
    `;

    if (rows.length === 0) {
      return res.status(200).json({ message: 'No reminders to send today.', sent: 0 });
    }

    const host = req.headers.host || 'www.goodslister.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const emailUrl = `${protocol}://${host}/api/send-email`;

    let sentCount = 0;
    const failures: string[] = [];

    for (const booking of rows) {
      try {
        const startDate = new Date(booking.start_date).toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        const emailRes = await fetch(emailUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'rental_reminder',
            to: booking.renter_email,
            data: {
              listingTitle: booking.listing_title,
              startDate: startDate,
              meetingPoint: booking.listing_location || 'Coordinate via chat',
              hostPhone: 'Check inbox'
            }
          })
        });

        if (emailRes.ok) {
          await sql`UPDATE bookings SET reminder_sent_at = NOW() WHERE id = ${booking.id}`;
          sentCount++;
        } else {
          failures.push(`${booking.id}: ${emailRes.status}`);
        }
      } catch (err) {
        console.error(`Reminder for booking ${booking.id} failed:`, err);
        failures.push(`${booking.id}: exception`);
      }
    }

    return res.status(200).json({ success: true, sent: sentCount, total: rows.length, failures });
  } catch (error) {
    console.error('Rental reminders cron error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

