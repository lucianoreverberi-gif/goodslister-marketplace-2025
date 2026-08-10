import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reportId, respondingUserId, action, disputeNote, evidencePhotoUrls } = req.body || {};

    if (!reportId || !respondingUserId || !action) {
      return res.status(400).json({ error: 'Missing required fields: reportId, respondingUserId, action' });
    }

    if (action !== 'accept' && action !== 'dispute') {
      return res.status(400).json({ error: 'action must be accept or dispute' });
    }

    // Look up report
    const { rows: reportRows } = await sql`
      SELECT id, booking_id, reporter_id, reported_party_id, status, claimed_amount_cents, description
      FROM damage_reports WHERE id = ${reportId}
    `;
    if (reportRows.length === 0) {
      return res.status(404).json({ error: 'Damage report not found' });
    }
    const report = reportRows[0];

    // Verify responder is the reported party
    if (respondingUserId !== report.reported_party_id) {
      return res.status(403).json({ error: 'Only the reported party can respond' });
    }

    // Verify status is pending
    if (report.status !== 'pending_response') {
      return res.status(409).json({ error: `Report is in status ${report.status}, cannot respond` });
    }

    if (action === 'dispute') {
      if (!disputeNote || disputeNote.length < 20) {
        return res.status(400).json({ error: 'Dispute requires a note of at least 20 characters' });
      }
      if (!Array.isArray(evidencePhotoUrls) || evidencePhotoUrls.length < 1) {
        return res.status(400).json({ error: 'Dispute requires at least 1 evidence photo' });
      }
    }

    const newStatus = action === 'accept' ? 'accepted' : 'disputed';
    const now = new Date().toISOString();

    // Update report status
    await sql`
      UPDATE damage_reports 
      SET status = ${newStatus}, responded_at = ${now}, updated_at = NOW()
      WHERE id = ${reportId}
    `;

    // Insert dispute evidence if disputing
    if (action === 'dispute') {
      const noteId = 'ev_' + crypto.randomBytes(6).toString('hex');
      await sql`
        INSERT INTO dispute_evidence (id, damage_report_id, party, evidence_type, url_or_text)
        VALUES (${noteId}, ${reportId}, 'reported', 'note', ${disputeNote})
      `;
      for (const url of evidencePhotoUrls) {
        const evId = 'ev_' + crypto.randomBytes(6).toString('hex');
        await sql`
          INSERT INTO dispute_evidence (id, damage_report_id, party, evidence_type, url_or_text)
          VALUES (${evId}, ${reportId}, 'reported', 'photo', ${url})
        `;
      }
    }

    // Fire-and-forget emails
    try {
      const { rows: userRows } = await sql`
        SELECT id, email, name FROM users WHERE id IN (${report.reporter_id}, ${report.reported_party_id})
      `;
      const reporter = userRows.find(u => u.id === report.reporter_id);
      const reported = userRows.find(u => u.id === report.reported_party_id);
      const host = req.headers.host || 'www.goodslister.com';
      const protocol = host.includes('localhost') ? 'http' : 'https';

      if (action === 'accept' && reporter?.email) {
        fetch(`${protocol}://${host}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'damage_accepted',
            to: reporter.email,
            data: {
              userName: reporter.name || '',
              reportedName: reported?.name || 'The other party',
              claimedAmount: (report.claimed_amount_cents / 100).toFixed(2),
              reportId
            }
          })
        }).catch(e => console.warn('accept email failed:', e));
      }

      // For disputes, notify admin (via a default admin email or admin channel)
      if (action === 'dispute') {
        fetch(`${protocol}://${host}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'damage_disputed',
            to: 'lucianoreverberi@gmail.com',
            data: {
              reportId,
              reporterName: reporter?.name || 'Unknown',
              reportedName: reported?.name || 'Unknown',
              claimedAmount: (report.claimed_amount_cents / 100).toFixed(2),
              disputeNote: (disputeNote || '').substring(0, 500)
            }
          })
        }).catch(e => console.warn('dispute email failed:', e));
      }
    } catch (emailErr) {
      console.warn('email prep failed:', emailErr);
    }

    return res.status(200).json({
      success: true,
      reportId,
      newStatus,
      respondedAt: now
    });
  } catch (error) {
    console.error('Damage respond error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
