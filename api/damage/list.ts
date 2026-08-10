import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const userId = String(req.query.userId || '').trim();
    const scope = String(req.query.scope || 'user').trim();
    const status = String(req.query.status || '').trim();
    if (!userId && scope !== 'admin') {
      return res.status(400).json({ error: 'Missing userId query param' });
    }
    let rows;
    if (scope === 'admin') {
      if (status) {
        const r = await sql`
          SELECT id, booking_id, reporter_id, reporter_type, reported_party_id, description,
                 claimed_amount_cents, status, response_deadline, admin_captured_cents,
                 created_at, updated_at
          FROM damage_reports WHERE status = ${status}
          ORDER BY created_at DESC LIMIT 200
        `;
        rows = r.rows;
      } else {
        const r = await sql`
          SELECT id, booking_id, reporter_id, reporter_type, reported_party_id, description,
                 claimed_amount_cents, status, response_deadline, admin_captured_cents,
                 created_at, updated_at
          FROM damage_reports
          ORDER BY created_at DESC LIMIT 200
        `;
        rows = r.rows;
      }
    } else {
      const r = await sql`
        SELECT id, booking_id, reporter_id, reporter_type, reported_party_id, description,
               claimed_amount_cents, status, response_deadline, admin_captured_cents,
               created_at, updated_at
        FROM damage_reports
        WHERE reporter_id = ${userId} OR reported_party_id = ${userId}
        ORDER BY created_at DESC LIMIT 100
      `;
      rows = r.rows;
    }
    return res.status(200).json({ success: true, reports: rows });
  } catch (error) {
    console.error('Damage list error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
