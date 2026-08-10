import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookingId, reporterId, description, claimedAmountCents, photoUrls } = req.body || {};

    if (!bookingId || !reporterId || !description || !claimedAmountCents) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (typeof claimedAmountCents !== 'number' || claimedAmountCents <= 0) {
      return res.status(400).json({ error: 'claimedAmountCents must be a positive number' });
    }

    if (description.length < 20) {
      return res.status(400).json({ error: 'Description must be at least 20 characters' });
    }

    if (!Array.isArray(photoUrls) || photoUrls.length < 2) {
      return res.status(400).json({ error: 'At least 2 evidence photos are required' });
    }

    if (photoUrls.length > 15) {
      return res.status(400).json({ error: 'Maximum 15 photos allowed' });
    }

    // Look up booking with participant info
    const { rows: bookingRows } = await sql`
      SELECT b.id, b.renter_id, l.owner_id AS host_id, b.checkout_at, b.deposit_hold_status,
             b.deposit_amount, b.stripe_deposit_payment_intent_id, b.damage_report_id
      FROM bookings b
      JOIN listings l ON l.id = b.listing_id
      WHERE b.id = ${bookingId}
    `;
    if (bookingRows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    const booking = bookingRows[0];

    // Verify reporter is either host or renter of this booking
    let reporterType: 'host' | 'renter';
    let reportedPartyId: string;
    if (reporterId === booking.host_id) {
      reporterType = 'host';
      reportedPartyId = booking.renter_id;
    } else if (reporterId === booking.renter_id) {
      reporterType = 'renter';
      reportedPartyId = booking.host_id;
    } else {
      return res.status(403).json({ error: 'You are not authorized to report on this booking' });
    }

    // Verify there's no existing active report
    if (booking.damage_report_id) {
      const { rows: existing } = await sql`
        SELECT status FROM damage_reports WHERE id = ${booking.damage_report_id}
      `;
      if (existing[0] && !existing[0].status.startsWith('resolved_')) {
        return res.status(409).json({ error: 'A damage report already exists for this booking' });
      }
    }

    // Verify booking has a deposit hold (can't report without a hold to capture from)
    if (!booking.stripe_deposit_payment_intent_id) {
      return res.status(400).json({ error: 'No deposit hold exists on this booking' });
    }

    // Verify 48h window from checkout (or allow if no checkout yet)
    if (booking.checkout_at) {
      const checkoutTime = new Date(booking.checkout_at).getTime();
      const hoursSinceCheckout = (Date.now() - checkoutTime) / (1000 * 60 * 60);
      if (hoursSinceCheckout > 48) {
        return res.status(400).json({ error: 'Report window has expired (48h after checkout)' });
      }
    }

    // Verify amount doesn't exceed deposit
    const depositCents = Math.round(parseFloat(booking.deposit_amount) * 100);
    if (claimedAmountCents > depositCents) {
      return res.status(400).json({ 
        error: `Claimed amount ($${(claimedAmountCents/100).toFixed(2)}) exceeds deposit ($${(depositCents/100).toFixed(2)})` 
      });
    }

    // Create damage report
    const reportId = 'dmg_' + crypto.randomBytes(8).toString('hex');
    const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    await sql`
      INSERT INTO damage_reports (
        id, booking_id, reporter_id, reporter_type, reported_party_id,
        description, claimed_amount_cents, status, response_deadline
      ) VALUES (
        ${reportId}, ${bookingId}, ${reporterId}, ${reporterType}, ${reportedPartyId},
        ${description}, ${claimedAmountCents}, 'pending_response', ${deadline}
      )
    `;

    // Insert evidence photos
    for (const url of photoUrls) {
      const evId = 'ev_' + crypto.randomBytes(6).toString('hex');
      await sql`
        INSERT INTO dispute_evidence (id, damage_report_id, party, evidence_type, url_or_text)
        VALUES (${evId}, ${reportId}, 'reporter', 'photo', ${url})
      `;
    }

    // Link on booking for quick access
    await sql`UPDATE bookings SET damage_report_id = ${reportId} WHERE id = ${bookingId}`;

    // Fire-and-forget email notifications
    try {
      const { rows: userRows } = await sql`
        SELECT id, email, name FROM users WHERE id IN (${reportedPartyId}, ${reporterId})
      `;
      const reported = userRows.find(u => u.id === reportedPartyId);
      const reporter = userRows.find(u => u.id === reporterId);
      const host = req.headers.host || 'www.goodslister.com';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      if (reported?.email) {
        fetch(`${protocol}://${host}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'damage_report_submitted',
            to: reported.email,
            data: {
              userName: reported.name || '',
              reporterName: reporter?.name || 'The other party',
              claimedAmount: (claimedAmountCents / 100).toFixed(2),
              description: description.substring(0, 300),
              bookingId,
              reportId
            }
          })
        }).catch(e => console.warn('damage email failed:', e));
      }
    } catch (emailErr) {
      console.warn('email prep failed:', emailErr);
    }

    return res.status(200).json({
      success: true,
      reportId,
      status: 'pending_response',
      responseDeadline: deadline,
      claimedAmountCents,
      reporterType,
      reportedPartyId
    });
  } catch (error) {
    console.error('Damage report error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
