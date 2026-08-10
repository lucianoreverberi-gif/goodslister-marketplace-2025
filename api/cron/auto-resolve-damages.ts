import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CRON auth via CRON_SECRET
  const auth = req.headers.authorization || '';
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results = {
    autoAcceptedReports: 0,
    autoReleasedBookings: 0,
    autoAcceptErrors: [] as string[],
    autoReleaseErrors: [] as string[]
  };

  try {
    const host = req.headers.host || 'www.goodslister.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const now = new Date().toISOString();

    // Part 1: Auto-accept reports past their 48h response deadline
    const { rows: expiredReports } = await sql`
      SELECT id, booking_id, claimed_amount_cents
      FROM damage_reports
      WHERE status = 'pending_response' AND response_deadline < NOW()
    `;

    for (const report of expiredReports) {
      try {
        await sql`
          UPDATE damage_reports 
          SET status = 'auto_accepted', responded_at = ${now}, updated_at = NOW()
          WHERE id = ${report.id}
        `;
        results.autoAcceptedReports++;
      } catch (err) {
        results.autoAcceptErrors.push(`${report.id}: ${err instanceof Error ? err.message : 'unknown'}`);
      }
    }

    // Part 2: Auto-release deposits for bookings that ended 72h+ ago with no damage report
    const { rows: staleBookings } = await sql`
      SELECT id, stripe_deposit_payment_intent_id
      FROM bookings
      WHERE deposit_hold_status = 'held'
        AND damage_report_id IS NULL
        AND checkout_at IS NOT NULL
        AND checkout_at < NOW() - INTERVAL '72 hours'
    `;

    for (const booking of staleBookings) {
      try {
        const releaseRes = await fetch(`${protocol}://${host}/api/bookings/release-deposit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: booking.id })
        });
        const releaseBody = await releaseRes.json();
        if (releaseBody.released || releaseBody.alreadyReleased) {
          results.autoReleasedBookings++;
        } else if (releaseBody.error) {
          results.autoReleaseErrors.push(`${booking.id}: ${releaseBody.error}`);
        }
      } catch (err) {
        results.autoReleaseErrors.push(`${booking.id}: ${err instanceof Error ? err.message : 'unknown'}`);
      }
    }

    return res.status(200).json({
      success: true,
      ...results,
      runAt: now
    });
  } catch (error) {
    console.error('Auto-resolve damages error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      results
    });
  }
}
