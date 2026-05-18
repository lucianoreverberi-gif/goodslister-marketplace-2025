import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Check CRON_SECRET if provided
  const authHeader = req.headers['authorization'];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Find all boosts that should be expired
    const { rows: expiringBoosts } = await sql`
      SELECT b.*, u.email as owner_email, l.title as listing_title
      FROM boosts b
      JOIN users u ON b.user_id = u.id
      JOIN listings l ON b.listing_id = l.id
      WHERE b.status = 'active' AND b.expires_at < NOW()
    `;

    if (expiringBoosts.length === 0) {
      return res.status(200).json({ message: 'No boosts to expire today.' });
    }

    // 2. Update status and listing cache
    for (const boost of expiringBoosts) {
      await sql`UPDATE boosts SET status = 'expired' WHERE id = ${boost.id}`;
      
      // Only clear listing cache if this was the last active boost for this listing
      await sql`
        UPDATE listings 
        SET boost_active_until = NULL, 
            boost_tier_active = NULL 
        WHERE id = ${boost.listing_id} AND boost_active_until = ${boost.expires_at}
      `;

      // 3. Send notification email
      try {
        await resend.emails.send({
          from: 'Goodslister <team@goodslister.com>',
          to: boost.owner_email,
          subject: `Your boost on ${boost.listing_title} has ended`,
          html: `
            <h1>Your boost has ended</h1>
            <p>Hi there,</p>
            <p>Your <strong>${boost.tier}</strong> boost for <strong>${boost.listing_title}</strong> has completed its duration.</p>
            <p><strong>Results generated:</strong></p>
            <ul>
              <li>Views: ${boost.views_count}</li>
              <li>Inquiries: ${boost.inquiries_count}</li>
            </ul>
            <p>Want to stay at the top of search results? <a href="${process.env.VITE_APP_URL}/dashboard?tab=listings">Boost again now</a>.</p>
            <p>Best,<br/>The Goodslister Team</p>
          `,
        });
      } catch (emailError) {
        console.error(`Failed to send expiration email to ${boost.owner_email}:`, emailError);
      }
    }

    return res.status(200).json({ success: true, expiredCount: expiringBoosts.length });
  } catch (error) {
    console.error('Expiration cron error:', error);
    return res.status(500).json({ error: 'Failed to run expiration cron' });
  }
}
