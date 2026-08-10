import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const reportId = String(req.query.reportId || '').trim();
    if (!reportId) {
      return res.status(400).json({ error: 'Missing reportId query param' });
    }
    const { rows: reportRows } = await sql`
      SELECT r.*, b.deposit_amount, b.checkout_at, l.title AS listing_title
      FROM damage_reports r
      JOIN bookings b ON b.id = r.booking_id
      JOIN listings l ON l.id = b.listing_id
      WHERE r.id = ${reportId}
    `;
    if (reportRows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    const report = reportRows[0];
    const { rows: evidenceRows } = await sql`
      SELECT id, party, evidence_type, url_or_text, created_at
      FROM dispute_evidence
      WHERE damage_report_id = ${reportId}
      ORDER BY created_at ASC
    `;
    return res.status(200).json({ success: true, report, evidence: evidenceRows });
  } catch (error) {
    console.error('Damage get error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
