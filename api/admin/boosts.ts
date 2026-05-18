import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const ADMIN_EMAIL = 'lucianoreverberi@gmail.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user_email, status, tier, tab } = req.query;

  if (user_email !== ADMIN_EMAIL) {
    return res.status(404).end();
  }

  try {
    if (tab === 'waitlist') {
      const { rows } = await sql`
        SELECT bw.*, u.name as user_name, l.title as listing_title
        FROM boost_waitlist bw
        LEFT JOIN users u ON bw.user_id = u.id
        LEFT JOIN listings l ON bw.listing_id = l.id
        ORDER BY bw.created_at DESC
      `;
      return res.status(200).json({ data: rows });
    }

    // Default: fetch boosts
    let query = sql`
      SELECT b.*, u.email as user_email, u.name as user_name, l.title as listing_title
      FROM boosts b
      JOIN users u ON b.user_id = u.id
      JOIN listings l ON b.listing_id = l.id
    `;

    // Basic filtering (simplified for now)
    const { rows: boosts } = await query;
    let filtered = boosts;
    if (status && status !== 'all') {
      filtered = filtered.filter(b => b.status === status);
    }
    if (tier && tier !== 'all') {
      filtered = filtered.filter(b => b.tier === tier);
    }

    // KPIs
    const stats = await sql`
      SELECT 
        COALESCE(SUM(price_paid), 0) as total_revenue,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
        COALESCE(AVG(views_count), 0) as avg_views
      FROM boosts
    `;

    return res.status(200).json({ 
      data: filtered,
      stats: stats.rows[0]
    });
  } catch (error) {
    console.error('Admin boost fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
