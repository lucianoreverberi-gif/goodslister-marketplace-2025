import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { reportId, adminUserId, decision, adminCaptureCents, adminNotes } = req.body || {};
    if (!reportId || !adminUserId || !decision) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (decision !== 'release' && decision !== 'capture') {
      return res.status(400).json({ error: 'decision must be release or capture' });
    }
    // Verify admin
    const { rows: adminRows } = await sql`SELECT id, role, email FROM users WHERE id = ${adminUserId}`;
    if (adminRows.length === 0 || (adminRows[0].role !== 'SUPER_ADMIN' && adminRows[0].role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Only admins can resolve damage reports' });
    }

    // Look up report + booking
    const { rows: reportRows } = await sql`
      SELECT r.*, b.deposit_amount, b.stripe_deposit_payment_intent_id, b.deposit_hold_status
      FROM damage_reports r
      JOIN bookings b ON b.id = r.booking_id
      WHERE r.id = ${reportId}
    `;
    if (reportRows.length === 0) return res.status(404).json({ error: 'Report not found' });
    const report = reportRows[0];

    if (report.status.startsWith('resolved_')) {
      return res.status(409).json({ error: 'Report already resolved' });
    }

    let newStatus: string;
    let capturedCents: number | null = null;
    const now = new Date().toISOString();
    const host = req.headers.host || 'www.goodslister.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';

    if (decision === 'release') {
      // Trigger release via existing endpoint
      const releaseRes = await fetch(`${protocol}://${host}/api/bookings/release-deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: report.booking_id })
      });
      const releaseBody = await releaseRes.json();
      if (!releaseRes.ok && !releaseBody.alreadyReleased) {
        return res.status(500).json({ error: `Release failed: ${releaseBody.error || 'unknown'}` });
      }
      newStatus = 'resolved_released';
    } else {
      // Capture amount validation
      if (typeof adminCaptureCents !== 'number' || adminCaptureCents <= 0) {
        return res.status(400).json({ error: 'adminCaptureCents must be a positive number when capturing' });
      }
      const depositCents = Math.round(parseFloat(report.deposit_amount) * 100);
      if (adminCaptureCents > depositCents) {
        return res.status(400).json({ error: `Capture exceeds deposit ($${(depositCents/100).toFixed(2)})` });
      }
      // Call capture-deposit
      const captureRes = await fetch(`${protocol}://${host}/api/bookings/capture-deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: report.booking_id, captureAmountCents: adminCaptureCents })
      });
      const captureBody = await captureRes.json();
      if (!captureRes.ok) {
        return res.status(500).json({ error: `Capture failed: ${captureBody.error || 'unknown'}` });
      }
      capturedCents = adminCaptureCents;
      newStatus = adminCaptureCents >= depositCents ? 'resolved_captured' : 'resolved_partial';
    }

    await sql`
      UPDATE damage_reports 
      SET status = ${newStatus}, admin_resolved_at = ${now},
          admin_captured_cents = ${capturedCents}, admin_notes = ${adminNotes || null},
          updated_at = NOW()
      WHERE id = ${reportId}
    `;

    // Fire-and-forget emails
    try {
      const { rows: userRows } = await sql`
        SELECT id, email, name FROM users WHERE id IN (${report.reporter_id}, ${report.reported_party_id})
      `;
      const reported = userRows.find(u => u.id === report.reported_party_id);
      if (reported?.email) {
        const emailType = decision === 'release' ? 'damage_released' : 'damage_captured';
        fetch(`${protocol}://${host}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: emailType,
            to: reported.email,
            data: {
              userName: reported.name || '',
              amount: capturedCents ? (capturedCents / 100).toFixed(2) : '0.00',
              claimedAmount: (report.claimed_amount_cents / 100).toFixed(2),
              adminNotes: (adminNotes || '').substring(0, 300),
              reportId
            }
          })
        }).catch(e => console.warn('resolve email failed:', e));
      }
    } catch (emailErr) {
      console.warn('email prep failed:', emailErr);
    }

    return res.status(200).json({
      success: true,
      reportId,
      newStatus,
      capturedCents,
      resolvedAt: now
    });
  } catch (error) {
    console.error('Admin resolve error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
