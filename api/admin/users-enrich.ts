import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Admin whitelist
const ADMIN_EMAILS = ['lucianoreverberi@gmail.com'];

interface UserEnrich {
  bookings_count: number;
  boosts_count: number;
  ltv: number;
  last_activity: string | null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const adminEmail = (req.query.admin_email as string || '').toLowerCase();
  if (!ADMIN_EMAILS.includes(adminEmail)) {
    return res.status(401).json({ error: 'Unauthorized. Admin access required.' });
  }

  try {
    // Fetch transaction fee percent
    let feePercent = 6;
    try {
      const { rows } = await sql`SELECT transaction_fee_percent FROM platform_settings LIMIT 1`;
      if (rows[0]?.transaction_fee_percent) feePercent = parseFloat(rows[0].transaction_fee_percent);
    } catch (e) { /* skip */ }

    const byUser: Record<string, UserEnrich> = {};

    // Aggregate bookings by renter
    try {
      const { rows } = await sql`
        SELECT renter_id, COUNT(*)::int AS c, COALESCE(SUM(total_price), 0) AS total, MAX(created_at) AS last
        FROM bookings
        WHERE status IN ('confirmed', 'completed', 'checked_in', 'active')
        GROUP BY renter_id
      `;
      for (const r of rows) {
        if (!r.renter_id) continue;
        if (!byUser[r.renter_id]) byUser[r.renter_id] = { bookings_count: 0, boosts_count: 0, ltv: 0, last_activity: null };
        byUser[r.renter_id].bookings_count = r.c;
        byUser[r.renter_id].ltv += (parseFloat(r.total) || 0) * (feePercent / 100);
        byUser[r.renter_id].last_activity = r.last;
      }
    } catch (e) { /* bookings may not exist */ }

    // Aggregate boosts by user
    try {
      const { rows } = await sql`
        SELECT user_id, COUNT(*)::int AS c, COALESCE(SUM(price_paid), 0) AS total, MAX(created_at) AS last
        FROM boosts
        WHERE status IN ('active', 'expired')
        GROUP BY user_id
      `;
      for (const r of rows) {
        if (!r.user_id) continue;
        if (!byUser[r.user_id]) byUser[r.user_id] = { bookings_count: 0, boosts_count: 0, ltv: 0, last_activity: null };
        byUser[r.user_id].boosts_count = r.c;
        byUser[r.user_id].ltv += parseFloat(r.total) || 0;
        if (!byUser[r.user_id].last_activity || new Date(r.last) > new Date(byUser[r.user_id].last_activity!)) {
          byUser[r.user_id].last_activity = r.last;
        }
      }
    } catch (e) { /* skip */ }

    // Count listings per user (host)
    try {
      const { rows } = await sql`
        SELECT owner_id, COUNT(*)::int AS c
        FROM listings
        GROUP BY owner_id
      `;
      for (const r of rows) {
        if (!r.owner_id) continue;
        if (!byUser[r.owner_id]) byUser[r.owner_id] = { bookings_count: 0, boosts_count: 0, ltv: 0, last_activity: null };
        (byUser[r.owner_id] as any).listings_count = r.c;
      }
    } catch (e) { /* skip */ }

    // Round LTV to 2 decimals
    for (const uid in byUser) {
      byUser[uid].ltv = Math.round(byUser[uid].ltv * 100) / 100;
    }

    return res.status(200).json({
      users: byUser,
      total_users_with_activity: Object.keys(byUser).length,
      transaction_fee_percent: feePercent,
      generated_at: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('users-enrich error:', e);
    return res.status(500).json({ error: e.message });
  }
}

