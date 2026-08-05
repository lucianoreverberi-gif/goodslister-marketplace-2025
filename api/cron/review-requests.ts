import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Optional auth via CRON_SECRET
  const authHeader = req.headers['authorization'];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Find bookings that ended yesterday and haven't been asked for a review yet
    const { rows } = await sql`
      SELECT b.id, b.renter_id, b.end_date,
             u.email AS renter_email, u.name AS renter_name,
             l.title AS listing_title,
             host.name AS host_name
      FROM bookings b
      JOIN users u ON u.id = b.renter_id
      JOIN listings l ON l.id = b.listing_id
      JOIN users host ON host.id = l.owner_id
      WHERE b.status IN ('confirmed', 'completed')
        AND b.end_date::date = (CURRENT_DATE - INTERVAL '1 day')::date
        AND b.review_request_sent_at IS NULL
    `;

    if (rows.length === 0) {
      return res.status(200).json({ message: 'No review requests to send today.', sent: 0 });
    }

    const host = req.headers.host || 'www.goodslister.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const emailUrl = `${protocol}://${host}/api/send-email`;

    let sentCount = 0;
    const failures: string[] = [];

    for (const booking of rows) {
      try {
        const emailRes = await fetch(emailUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'review_request',
            to: booking.renter_email,
            data: {
              listingTitle: booking.listing_title,
              hostName: booking.host_name || 'your host'
            }
          })
        });

        if (emailRes.ok) {
          await sql`UPDATE bookings SET review_request_sent_at = NOW() WHERE id = ${booking.id}`;
          sentCount++;
        } else {
          failures.push(`${booking.id}: ${emailRes.status}`);
        }
      } catch (err) {
        console.error(`Review request for booking ${booking.id} failed:`, err);
        failures.push(`${booking.id}: exception`);
      }
    }

    return res.status(200).json({ success: true, sent: sentCount, total: rows.length, failures });
  } catch (error) {
    console.error('Review requests cron error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

