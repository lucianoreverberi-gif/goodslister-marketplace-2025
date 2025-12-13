
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { disputeId, outcome, amount, resolutionText } = req.body; // outcome: 'approved' | 'rejected'

  if (!disputeId || !outcome) {
      return res.status(400).json({ error: 'Missing required resolution fields' });
  }

  try {
    // 1. Update Dispute Status
    await sql`
        UPDATE disputes 
        SET status = 'resolved', amount_involved = ${amount || 0}
        WHERE id = ${disputeId}
    `;

    // 2. Notify Parties of Verdict
    // Fetch details again to get emails
    const details = await sql`
        SELECT 
            d.id as dispute_id,
            l.title as listing_title,
            r.email as renter_email,
            o.email as owner_email
        FROM disputes d
        JOIN bookings b ON d.booking_id = b.id
        JOIN listings l ON b.listing_id = l.id
        JOIN users r ON b.renter_id = r.id
        JOIN users o ON l.owner_id = o.id
        WHERE d.id = ${disputeId}
    `;

    if (details.rows.length > 0) {
        const info = details.rows[0];
        
        // Construct notification data
        const emailPayload = {
            listingTitle: info.listing_title,
            disputeId: disputeId,
            outcome: outcome, // 'approved' or 'rejected'
            amount: amount || 0,
            resolutionText: resolutionText || "Case reviewed by Goodslister Trust & Safety."
        };

        // Notify RENTER
        await fetch(new URL('/api/send-email', `https://${req.headers.host}`).toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'dispute_verdict',
                to: info.renter_email,
                data: emailPayload
            })
        });

        // Notify OWNER
        await fetch(new URL('/api/send-email', `https://${req.headers.host}`).toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'dispute_verdict',
                to: info.owner_email,
                data: emailPayload
            })
        });
    }

    return res.status(200).json({ success: true, disputeId, outcome });

  } catch (error: any) {
    console.error('Resolve dispute error:', error);
    return res.status(500).json({ error: error.message });
  }
}
